import { z } from "zod";
import { auditInputSchema } from "./audit-input.js";

export const MAX_QUESTIONS = 4;
export const diagnosticTopics = [
  "rules_and_exceptions",
  "parameters",
  "connectors",
  "linked_models",
  "views_and_tags",
  "tolerances",
  "worksharing",
  "mutation_authority",
  "revit_version",
  "deployment",
  "volume",
  "approval",
];
// A nullable field keeps the strict Structured Output root an object.
export const interviewDecisionSchema = z
  .object({
    status: z.enum(["needs_clarification", "ready_for_assessment"]),
    question: z
      .object({
        text: z.string().min(10).max(300),
        reason: z.string().min(1).max(240),
        topic: z.enum(diagnosticTopics),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const interviewRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("start"),
      requestId: z.uuid(),
      input: auditInputSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("answer"),
      interviewId: z.uuid(),
      questionId: z.uuid(),
      answer: z.string().trim().max(2000),
      skipped: z.boolean(),
    })
    .strict()
    .refine((value) =>
      value.skipped ? value.answer === "" : value.answer.length > 0,
    ),
]);
export const interviewAssessmentSchema = z
  .object({ interviewId: z.uuid() })
  .strict();
export const interviewReplySchema = z
  .object({
    interviewId: z.uuid(),
    status: z.enum(["needs_clarification", "ready_for_assessment"]),
    question: z
      .object({ id: z.uuid(), text: z.string().min(10).max(300) })
      .strict()
      .nullable(),
    questionNumber: z.number().int().min(0).max(MAX_QUESTIONS),
  })
  .strict()
  .refine(
    (value) =>
      (value.status === "needs_clarification") === (value.question !== null),
  );
