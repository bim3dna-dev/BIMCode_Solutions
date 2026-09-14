import { auditInputSchema } from "../../shared/audit-input.js";
import { auditResultSchema } from "../../shared/audit-result.js";
import {
  interviewRequestSchema,
  interviewAssessmentSchema,
} from "../../shared/audit-interview.js";
import { createInterviewStore, interviewClientIp } from "./interview-store.js";
import { createInterviewService, InterviewError } from "./interview-service.js";
import {
  createProvider,
  DEFAULT_MODEL,
  safeUsage,
  toModelWorkflow,
} from "./provider.js";

export const MAX_BODY_BYTES = 32768;
const unavailable =
  "Analysis is temporarily unavailable. Your workflow details have not been lost; please try again.";
class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const reply = (status, body, headers = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
const failure = (status, code, message = unavailable, headers) =>
  reply(status, { error: { code, message } }, headers);

async function readJson(request) {
  const declared = request.headers.get("content-length");
  if (
    declared &&
    (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)
  )
    throw new RequestError(
      413,
      "PAYLOAD_TOO_LARGE",
      "Please shorten your workflow details and try again.",
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new RequestError(
      400,
      "INVALID_JSON",
      "Provide a JSON workflow request.",
    );
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RequestError(
          413,
          "PAYLOAD_TOO_LARGE",
          "Please shorten your workflow details and try again.",
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(
      400,
      "INVALID_JSON",
      "Provide a valid JSON workflow request.",
    );
  } finally {
    reader.releaseLock();
  }
}

export function createAuditHandler({
  env = process.env,
  operation = "analyze",
  storeFactory = createInterviewStore,
  providerFactory = createProvider,
  log = (metadata) => console.info(JSON.stringify(metadata)),
} = {}) {
  return async (request) => {
    if (request.method !== "POST")
      return failure(
        405,
        "METHOD_NOT_ALLOWED",
        "Use POST for workflow analysis.",
        { Allow: "POST" },
      );
    // Fail closed until the deployment owner enables this after configuring edge rate limits.
    if (
      env.AUDIT_ANALYSIS_ENABLED !== "true" ||
      !env.OPENAI_API_KEY?.trim() ||
      !env.AUDIT_ALLOWED_ORIGIN
    )
      return failure(503, "UNAVAILABLE");
    let allowedOrigin;
    try {
      const configured = new URL(env.AUDIT_ALLOWED_ORIGIN);
      if (
        !["http:", "https:"].includes(configured.protocol) ||
        configured.origin !== env.AUDIT_ALLOWED_ORIGIN
      )
        throw new Error();
      allowedOrigin = configured.origin;
    } catch {
      return failure(503, "UNAVAILABLE");
    }
    if (
      request.headers.get("origin") !== allowedOrigin ||
      (request.headers.has("sec-fetch-site") &&
        request.headers.get("sec-fetch-site") !== "same-origin")
    )
      return failure(
        403,
        "ORIGIN_NOT_ALLOWED",
        "Open the Audit page on this website to request analysis.",
      );
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    )
      return failure(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Send the workflow as JSON.",
      );
    if (
      request.headers.has("content-encoding") &&
      request.headers.get("content-encoding") !== "identity"
    )
      return failure(415, "UNSUPPORTED_ENCODING", "Send uncompressed JSON.");
    let interviewStore;
    if (operation === "interview") {
      if (env.AUDIT_INTERVIEW_ENABLED !== "true") return failure(503, "UNAVAILABLE");
      try {
        const ip = interviewClientIp(request, env);
        interviewStore = storeFactory(env);
        const limit = await interviewStore.consumeInterviewRequest(ip);
        if (!limit.allowed)
          return failure(429, "RATE_LIMITED", "You've reached the analysis limit. Please wait a few minutes and try again.", { "Retry-After": String(limit.retryAfter) });
      } catch {
        return failure(503, "UNAVAILABLE");
      }
    }
    let input;
    try {
      input = await readJson(request);
    } catch (error) {
      return failure(error.status, error.code, error.message);
    }
    const interviewMode =
      operation === "interview" ||
      env.AUDIT_INTERVIEW_ENABLED === "true" ||
      Object.hasOwn(input ?? {}, "interviewId");
    if (interviewMode && env.AUDIT_INTERVIEW_ENABLED !== "true")
      return failure(503, "UNAVAILABLE");
    const schema = interviewMode
      ? operation === "interview"
        ? interviewRequestSchema
        : interviewAssessmentSchema
      : auditInputSchema;
    const parsed = schema.safeParse(input);
    if (!parsed.success)
      return failure(
        400,
        "INVALID_INPUT",
        "Please review the required fields, lengths, and numeric values, then try again.",
      );
    try {
      if (interviewMode) {
        const service = createInterviewService({
          store: interviewStore ?? storeFactory(env),
          provider: providerFactory(env.OPENAI_API_KEY),
          model: env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
          log,
        });
        return reply(
          200,
          operation === "interview"
            ? await service.interview(parsed.data)
            : await service.assess(parsed.data.interviewId),
        );
      }
      const response = await providerFactory(env.OPENAI_API_KEY).analyze(
        toModelWorkflow(parsed.data),
        env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
      );
      log({ event: "audit_usage", ...safeUsage(response) });
      if (
        response.output?.some(
          (item) =>
            item.type === "message" &&
            item.content?.some((part) => part.type === "refusal"),
        )
      )
        return failure(
          422,
          "ANALYSIS_REFUSED",
          "We could not assess this workflow. Please review its description or request a manual review.",
        );
      if (response.status !== "completed")
        return failure(502, "INCOMPLETE_ANALYSIS");
      const result = auditResultSchema.safeParse(response.output_parsed);
      if (!result.success) {
        log({ event: "audit_failure", category: "invalid_output" });
        return failure(502, "INVALID_ANALYSIS");
      }
      return reply(200, { result: result.data });
    } catch (error) {
      if (error instanceof InterviewError)
        return failure(error.status, error.code);
      const status = Number.isInteger(error?.status) ? error.status : null;
      const timeout = ["APIConnectionTimeoutError", "AbortError"].includes(
        error?.name,
      );
      // Never log provider messages, request/response objects, keys, or user content.
      log({
        event: "audit_failure",
        category: timeout ? "timeout" : "provider_or_schema",
        status,
      });
      if (status === 429)
        return failure(
          429,
          "RATE_LIMITED",
          "Analysis is busy. Please wait a minute before trying again.",
          { "Retry-After": "60" },
        );
      if (timeout) return failure(504, "ANALYSIS_TIMEOUT");
      if ([400, 401, 403, 404].includes(status))
        return failure(503, "UNAVAILABLE");
      return failure(502, "ANALYSIS_FAILED");
    }
  };
}
