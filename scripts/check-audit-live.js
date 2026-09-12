// Explicit, billable smoke test using synthetic input. Never included in npm test.
import {
  createProvider,
  DEFAULT_MODEL,
  safeUsage,
  toModelWorkflow,
} from "../server/audit/provider.js";
import { auditInputSchema } from "../shared/audit-input.js";
import { auditResultSchema } from "../shared/audit-result.js";
import { validInput } from "../server/audit/fixtures.js";

if (!process.env.OPENAI_API_KEY?.trim()) {
  console.error(
    "Set OPENAI_API_KEY in the server environment before explicitly running this billable test.",
  );
  process.exitCode = 1;
} else {
  try {
    const input = validInput();
    input.workflow = {
      ...input.workflow,
      title: "Weekly Revit piping QA review",
      description: "A 6-person MEP team manually checks a Revit piping model every Friday for disconnected fittings, incorrect system classifications, missing insulation parameters, and untagged vertical pipes. Each review takes approximately 3 hours per participant.",
      frequency: { type: "weekly", occurrences: 1, intervalDays: null },
      manualEffort: { duration: 3, unit: "hours", basis: "per-person-per-occurrence" },
      participants: 6,
      painPoint: "Manual checks are repetitive and findings are difficult to track consistently.",
      desiredOutcome: "Repeatable inspection with reviewable findings and controlled corrections.",
    };
    const started = performance.now();
    const response = await createProvider(process.env.OPENAI_API_KEY).analyze(
      toModelWorkflow(auditInputSchema.parse(input)),
      process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    );
    if (
      response.status !== "completed" ||
      !auditResultSchema.safeParse(response.output_parsed).success
    )
      throw new Error();
    console.info(
      JSON.stringify({ event: "live_audit_schema_passed", elapsedMs: Math.round(performance.now() - started), ...safeUsage(response) }),
    );
    // Synthetic assessment only: enables manual architecture review, never customer logging.
    console.info(JSON.stringify({ syntheticAssessment: response.output_parsed }, null, 2));
    console.info("Manual quality gate: verify deterministic Revit API/rules first, controlled execution, AI assistance only, no guarantees, capability inventions, or financial arithmetic.");
  } catch {
    console.error(
      "Live assessment did not complete with valid output. Check model access, credentials, limits, and provider availability.",
    );
    process.exitCode = 1;
  }
}
