export const genericError =
  "Analysis is temporarily unavailable. Your workflow details have not been lost; please try again.";
const errorMessages = {
  INVALID_INPUT:
    "Please edit your workflow and check the required fields and numeric values.",
  PAYLOAD_TOO_LARGE: "Please shorten your workflow description and try again.",
  RATE_LIMITED: "You've reached the analysis limit. Please wait a few minutes and try again.",
  ANALYSIS_REFUSED:
    "We could not assess this workflow. Please edit its description or request a manual review.",
};
export async function analysisErrorMessage(response) {
  if (response.status === 429) return errorMessages.RATE_LIMITED;
  if (response.status >= 500) return genericError;
  try {
    const body = await response.json();
    return Object.hasOwn(errorMessages, body?.error?.code)
      ? errorMessages[body.error.code]
      : genericError;
  } catch {
    return genericError;
  }
}
