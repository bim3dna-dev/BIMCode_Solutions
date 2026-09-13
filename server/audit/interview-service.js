import { randomUUID } from "node:crypto";
import { auditResultSchema } from "../../shared/audit-result.js";
import {
  interviewDecisionSchema,
  MAX_QUESTIONS,
} from "../../shared/audit-interview.js";
import { SESSION_TTL_SECONDS } from "./interview-store.js";
import { toModelWorkflow, safeUsage } from "./provider.js";

export class InterviewError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code) => {
  throw new InterviewError(status, code);
};
const normalizedText = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const isUnknown = (answer) =>
  /^(?:i\s+)?(?:don['’]?t know|do not know|not sure|unsure|unknown|skip)[.!]?$/i.test(
    answer.trim(),
  );
const publicState = (id, state) => ({
  interviewId: id,
  status: state.pending ? "needs_clarification" : "ready_for_assessment",
  question: state.pending
    ? { id: state.pending.id, text: state.pending.text }
    : null,
  questionNumber: state.answers.length + (state.pending ? 1 : 0),
});
function completed(response) {
  if (
    response.output?.some(
      (item) =>
        item.type === "message" &&
        item.content?.some((part) => part.type === "refusal"),
    )
  )
    fail(422, "ANALYSIS_REFUSED");
  if (response.status !== "completed") fail(502, "INCOMPLETE_ANALYSIS");
}

export function createInterviewService({
  store,
  provider,
  model,
  log = () => {},
  now = Date.now,
}) {
  const read = async (id) => {
    const state = await store.get(id);
    if (!state || state.expiresAt <= now()) fail(410, "INTERVIEW_EXPIRED");
    if (state.phase === "working") fail(409, "INTERVIEW_BUSY");
    if (state.phase === "failed") fail(409, "INTERVIEW_FAILED");
    return state;
  };
  const save = async (id, old, next) => {
    if (!(await store.cas(id, old, next))) fail(409, "INTERVIEW_BUSY");
  };
  const decide = async (id, old, next) => {
    if (
      next.answers.length >= MAX_QUESTIONS ||
      next.decisionCalls >= MAX_QUESTIONS
    ) {
      const ready = { ...next, phase: "ready", pending: null };
      await save(id, old, ready);
      return publicState(id, ready);
    }
    const reserved = {
      ...next,
      phase: "working",
      decisionCalls: next.decisionCalls + 1,
    };
    await save(id, old, reserved);
    try {
      const started = now();
      const response = await provider.decideNextAuditQuestion(
        next.workflow,
        next.answers,
        model,
      );
      log({
        event: "audit_interview_usage",
        elapsedMs: now() - started,
        ...safeUsage(response),
      });
      completed(response);
      const parsed = interviewDecisionSchema.safeParse(response.output_parsed);
      if (!parsed.success) fail(502, "INVALID_INTERVIEW");
      const { status, question } = parsed.data;
      if ((status === "needs_clarification") !== (question !== null))
        fail(502, "INVALID_INTERVIEW");
      if (
        question &&
        ((question.text.match(/\?/g) || []).length !== 1 ||
          !question.text.trim().endsWith("?"))
      )
        fail(502, "INVALID_INTERVIEW");
      const duplicate =
        question &&
        next.answers.some(
          (item) =>
            item.topic === question.topic ||
            normalizedText(item.question) === normalizedText(question.text),
        );
      const pending =
        question && !duplicate
          ? { id: randomUUID(), text: question.text, topic: question.topic }
          : null;
      // Never return or retain the model's operational reason; it is not chain-of-thought.
      const done = {
        ...reserved,
        phase: pending ? "question" : "ready",
        pending,
      };
      await save(id, reserved, done);
      return publicState(id, done);
    } catch (error) {
      await store
        .cas(id, reserved, { ...reserved, phase: "failed" })
        .catch(() => {});
      throw error;
    }
  };
  return {
    async interview(input) {
      if (input.action === "start") {
        const workflow = toModelWorkflow(input.input);
        const existing = await store.get(input.requestId);
        if (existing) {
          const state = await read(input.requestId);
          if (JSON.stringify(state.workflow) !== JSON.stringify(workflow))
            fail(409, "INTERVIEW_CONFLICT");
          return publicState(input.requestId, state);
        }
        return decide(input.requestId, null, {
          workflow,
          answers: [],
          pending: null,
          decisionCalls: 0,
          assessmentCalls: 0,
          expiresAt: now() + SESSION_TTL_SECONDS * 1000,
        });
      }
      const state = await read(input.interviewId);
      const answer =
        input.skipped || isUnknown(input.answer) ? "" : input.answer;
      const skipped = answer === "";
      const prior = state.answers.find(
        (item) => item.questionId === input.questionId,
      );
      if (prior) {
        if (prior.answer !== answer || prior.skipped !== skipped)
          fail(409, "INTERVIEW_CONFLICT");
        return publicState(input.interviewId, state);
      }
      if (state.phase !== "question" || state.pending?.id !== input.questionId)
        fail(409, "INTERVIEW_CONFLICT");
      return decide(input.interviewId, state, {
        ...state,
        pending: null,
        answers: [
          ...state.answers,
          {
            questionId: state.pending.id,
            topic: state.pending.topic,
            question: state.pending.text,
            answer,
            skipped,
          },
        ],
      });
    },
    async assess(id) {
      const state = await read(id);
      if (state.phase === "complete") return { result: state.result };
      if (state.phase !== "ready" || state.assessmentCalls !== 0)
        fail(409, "INTERVIEW_NOT_READY");
      const reserved = { ...state, phase: "working", assessmentCalls: 1 };
      await save(id, state, reserved);
      try {
        const started = now();
        const response = await provider.generateAuditAssessment(
          state.workflow,
          state.answers,
          model,
        );
        log({
          event: "audit_usage",
          elapsedMs: now() - started,
          ...safeUsage(response),
        });
        completed(response);
        const parsed = auditResultSchema.safeParse(response.output_parsed);
        if (!parsed.success) fail(502, "INVALID_ANALYSIS");
        await save(id, reserved, {
          ...reserved,
          phase: "complete",
          result: parsed.data,
        });
        return { result: parsed.data };
      } catch (error) {
        await store
          .cas(id, reserved, { ...reserved, phase: "failed" })
          .catch(() => {});
        throw error;
      }
    },
  };
}
