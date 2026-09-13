import { interviewReplySchema } from "../../../shared/audit-interview.js";
import { auditResultSchema } from "../../../shared/audit-result.js";
import { analysisErrorMessage, genericError } from "./analysis-errors.js";

export const initialInterviewState = () => ({
  busy: false,
  error: "",
  question: null,
  questionNumber: 0,
  result: null,
  started: false,
});

// In-memory browser state only. Retries reuse the same payload/idempotency ID.
export function createInterviewClient({
  submission,
  onChange,
  fetcher = fetch,
  uuid = () => crypto.randomUUID(),
}) {
  let state = initialInterviewState();
  let generation = 0,
    active = null,
    lastRequest = null,
    interviewId = null;
  const update = (next) => {
    state = { ...state, ...next };
    onChange(state);
  };
  async function run(path, payload) {
    if (active) return;
    const version = generation;
    active = new AbortController();
    const requestController = active;
    const signal = active.signal;
    update({ busy: true, error: "", started: true });
    const request = async (endpoint, body) => {
      lastRequest = { path: endpoint, payload: body };
      const timer = setTimeout(() => requestController.abort(), 55000);
      try {
        const response = await fetcher(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });
        if (!response.ok) throw new Error(await analysisErrorMessage(response));
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      let body = await request(path, payload);
      if (version !== generation) return;
      if (path === "/api/audit/interview") {
        const reply = interviewReplySchema.parse(body);
        interviewId = reply.interviewId;
        update({
          question: reply.question,
          questionNumber: reply.questionNumber,
        });
        if (reply.status === "needs_clarification") return;
        body = await request("/api/audit/analyze", { interviewId });
      }
      if (version !== generation) return;
      const result = auditResultSchema.parse(body?.result);
      update({ result, question: null });
    } catch (error) {
      if (version === generation) {
        // Only controlled HTTP messages can reach the UI; never response bodies or parser details.
        const allowed =
          error.message === genericError ||
          controlledMessages.has(error.message);
        update({ error: allowed ? error.message : genericError });
      }
    } finally {
      if (version === generation) {
        active = null;
        update({ busy: false });
      }
    }
  }
  return {
    start: () =>
      lastRequest
        ? run(lastRequest.path, lastRequest.payload)
        : run("/api/audit/interview", {
            action: "start",
            requestId: uuid(),
            input: submission,
          }),
    answer: (answer, skipped = false) =>
      state.question &&
      run("/api/audit/interview", {
        action: "answer",
        interviewId,
        questionId: state.question.id,
        answer: skipped ? "" : answer.trim(),
        skipped,
      }),
    retry: () => lastRequest && run(lastRequest.path, lastRequest.payload),
    restart: () => {
      generation++;
      active?.abort();
      active = null;
      lastRequest = null;
      interviewId = null;
      state = initialInterviewState();
      onChange(state);
    },
    dispose: () => {
      generation++;
      active?.abort();
      active = null;
    },
  };
}

const controlledMessages = new Set([
  "You've reached the analysis limit. Please wait a few minutes and try again.",
  "Please edit your workflow and check the required fields and numeric values.",
  "Please shorten your workflow description and try again.",
  "We could not assess this workflow. Please edit its description or request a manual review.",
  "This interview has expired or could not finish. Please restart the interview.",
  "Your previous request is still processing. Please wait a moment and retry.",
]);
