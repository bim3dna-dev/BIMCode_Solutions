import { z } from "zod";

const level = z.enum(["low", "medium", "high"]);
const explanation = z.string().min(1).max(800);
const short = z.string().min(1).max(240);
export const auditResultSchema = z.strictObject({
  summary: explanation,
  automationFeasibility: z.strictObject({
    level,
    score: z.number().int().min(0).max(100),
    rationale: explanation,
  }),
  workflowClassification: z.strictObject({
    category: short,
    determinism: level,
    repetitionLevel: level,
  }),
  automationOpportunities: z
    .array(
      z.strictObject({
        task: short,
        approach: explanation,
        technology: short,
        confidence: level,
      }),
    )
    .max(5),
  technicalArchitecture: z.strictObject({
    recommendedPrimaryApproach: explanation,
    revitApiRole: explanation,
    pythonRole: explanation,
    aiRole: explanation,
    externalProcessingRole: explanation,
  }),
  risks: z
    .array(
      z.strictObject({ risk: short, severity: level, mitigation: explanation }),
    )
    .max(5),
  questionsOrUnknowns: z.array(short).max(5),
  recommendedEngagement: z.strictObject({
    type: z.enum(["audit", "sprint", "retainer", "not_recommended"]),
    rationale: explanation,
  }),
});
