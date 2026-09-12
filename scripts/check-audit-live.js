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
    const response = await createProvider(process.env.OPENAI_API_KEY).analyze(
      toModelWorkflow(auditInputSchema.parse(validInput())),
      process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
    );
    if (
      response.status !== "completed" ||
      !auditResultSchema.safeParse(response.output_parsed).success
    )
      throw new Error();
    console.info(
      JSON.stringify({ event: "live_audit_passed", ...safeUsage(response) }),
    );
  } catch {
    console.error(
      "Live assessment did not complete with valid output. Check model access, credentials, limits, and provider availability.",
    );
    process.exitCode = 1;
  }
}
