import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAuditHandler, MAX_BODY_BYTES } from "./handler.js";
import {
  createProvider,
  toModelWorkflow,
  MAX_OUTPUT_TOKENS,
  auditInstructions,
  safeUsage,
} from "./provider.js";
import { auditInputSchema } from "../../shared/audit-input.js";
import { auditResultSchema } from "../../shared/audit-result.js";
import { validInput, validResult } from "./fixtures.js";

const env = {
  OPENAI_API_KEY: "unit-test-placeholder",
  AUDIT_ANALYSIS_ENABLED: "true",
  AUDIT_ALLOWED_ORIGIN: "https://example.com",
};
const request = (body = validInput(), headers = {}, method = "POST") =>
  new Request("https://example.com/api/audit/analyze", {
    method,
    headers: {
      origin: env.AUDIT_ALLOWED_ORIGIN,
      "content-type": "application/json",
      ...headers,
    },
    ...(!["GET", "HEAD"].includes(method)
      ? { body: typeof body === "string" ? body : JSON.stringify(body) }
      : {}),
  });
const response = (result = validResult()) => ({
  status: "completed",
  output: [],
  output_parsed: result,
  model: "gpt-6-astra",
  usage: {
    input_tokens: 120,
    output_tokens: 80,
    input_tokens_details: { cached_tokens: 20 },
  },
});
function harness(implementation = async () => response(), customEnv = env) {
  const calls = [],
    logs = [];
  const handler = createAuditHandler({
    env: customEnv,
    providerFactory: () => ({
      analyze: async (...args) => {
        calls.push(args);
        return implementation(...args);
      },
    }),
    log: (entry) => logs.push(entry),
  });
  return { handler, calls, logs };
}

test("valid normalized payload accepted, strict types and unknown keys rejected", () => {
  assert.ok(auditInputSchema.safeParse(validInput()).success);
  const cases = [null, [], {}, { ...validInput(), model: "client-model" }];
  for (const change of [
    (p) => {
      delete p.contact.name;
    },
    (p) => {
      p.contact.email = "invalid";
    },
    (p) => {
      p.contact.company = " ";
    },
    (p) => {
      p.contact.role = 123;
    },
    (p) => {
      p.workflow.title = "x".repeat(161);
    },
    (p) => {
      p.workflow.description = "x".repeat(4001);
    },
    (p) => {
      p.workflow.discipline = "unknown";
    },
    (p) => {
      p.workflow.software = ["unknown"];
    },
    (p) => {
      p.workflow.revitVersion = {};
    },
    (p) => {
      p.workflow.frequency.type = "sometimes";
    },
    (p) => {
      p.workflow.frequency.occurrences = "3";
    },
    (p) => {
      p.workflow.frequency.type = "custom";
    },
    (p) => {
      p.workflow.frequency.intervalDays = 14;
    },
    (p) => {
      p.workflow.manualEffort.duration = 0;
    },
    (p) => {
      p.workflow.manualEffort.duration = -1;
    },
    (p) => {
      p.workflow.manualEffort.duration = 1001;
    },
    (p) => {
      p.workflow.manualEffort.unit = "days";
    },
    (p) => {
      p.workflow.manualEffort.basis = "team";
    },
    (p) => {
      p.workflow.participants = 1.5;
    },
    (p) => {
      p.workflow.participants = 10001;
    },
    (p) => {
      p.workflow.painPoint = null;
    },
    (p) => {
      p.workflow.desiredOutcome = false;
    },
  ]) {
    const input = validInput();
    change(input);
    cases.push(input);
  }
  for (const input of cases)
    assert.equal(auditInputSchema.safeParse(input).success, false);
});

test("contact fields and arithmetic inputs are excluded from the model object", () => {
  const modelData = toModelWorkflow(validInput());
  for (const value of Object.values(validInput().contact))
    assert.ok(!JSON.stringify(modelData).includes(value));
  assert.deepEqual(Object.keys(modelData).sort(), [
    "description",
    "desiredOutcome",
    "discipline",
    "frequencyType",
    "painPoint",
    "revitVersion",
    "software",
    "title",
  ]);
});

test("result schema rejects missing keys, unknown properties and out-of-range scores", () => {
  assert.ok(auditResultSchema.safeParse(validResult()).success);
  for (const mutate of [
    (r) => {
      delete r.summary;
    },
    (r) => {
      r.roi = 200;
    },
    (r) => {
      r.automationFeasibility.score = 101;
    },
    (r) => {
      r.risks[0].severity = "critical";
    },
    (r) => {
      r.questionsOrUnknowns = Array(6).fill("unknown");
    },
  ]) {
    const result = validResult();
    mutate(result);
    assert.equal(auditResultSchema.safeParse(result).success, false);
  }
});

test("HTTP boundary returns only validated assessment; safe usage is not returned to browser", async () => {
  const { handler, calls, logs } = harness();
  const result = await handler(request());
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(await result.json(), { result: validResult() });
  assert.deepEqual(calls, [[toModelWorkflow(validInput()), "gpt-6-astra"]]);
  assert.deepEqual(logs, [
    {
      event: "audit_usage",
      model: "gpt-6-astra",
      inputTokens: 120,
      outputTokens: 80,
      cachedInputTokens: 20,
    },
  ]);
});

test("methods, origin, MIME, malformed JSON, input errors and byte limits reject before provider", async () => {
  const { handler, calls } = harness();
  const large = JSON.stringify({ padding: "x".repeat(MAX_BODY_BYTES) });
  for (const [req, status] of [
    [request(undefined, {}, "GET"), 405],
    [request(undefined, {}, "OPTIONS"), 405],
    [request(undefined, { origin: "https://evil.example" }), 403],
    [request(undefined, { origin: "null" }), 403],
    [request(undefined, { "sec-fetch-site": "cross-site" }), 403],
    [request(undefined, { "content-type": "text/plain" }), 415],
    [request(undefined, { "content-encoding": "gzip" }), 415],
    [request("{bad"), 400],
    [request({}), 400],
    [request("null"), 400],
    [request(large), 413],
    [request(undefined, { "content-length": String(MAX_BODY_BYTES + 1) }), 413],
  ])
    assert.equal((await handler(req)).status, status);
  assert.equal(calls.length, 0);
});

test("chunked and multibyte oversized bodies are counted without trusting content-length", async () => {
  const { handler, calls } = harness();
  const body = new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode('"' + "é".repeat(MAX_BODY_BYTES)));
      c.close();
    },
  });
  const req = new Request("https://example.com/api/audit/analyze", {
    method: "POST",
    headers: {
      origin: env.AUDIT_ALLOWED_ORIGIN,
      "content-type": "application/json",
      "content-length": "1",
    },
    body,
    duplex: "half",
  });
  assert.equal((await handler(req)).status, 413);
  assert.equal(calls.length, 0);
});

test("disabled deployment, missing key and invalid origin configuration fail closed", async () => {
  for (const patch of [
    { AUDIT_ANALYSIS_ENABLED: "false" },
    { OPENAI_API_KEY: "" },
    { AUDIT_ALLOWED_ORIGIN: "" },
    { AUDIT_ALLOWED_ORIGIN: "https://example.com/" },
  ]) {
    const { handler, calls } = harness(undefined, { ...env, ...patch });
    assert.equal((await handler(request())).status, 503);
    assert.equal(calls.length, 0);
  }
});

test("refusal, incomplete and malformed outputs produce controlled errors", async () => {
  for (const [value, status] of [
    [{ ...response(), status: "incomplete" }, 502],
    [
      {
        ...response(),
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "provider detail" }],
          },
        ],
      },
      422,
    ],
    [response({ secret: "malformed" }), 502],
    [response(null), 502],
  ]) {
    const { handler } = harness(async () => value);
    const result = await handler(request());
    assert.equal(result.status, status);
    const text = await result.text();
    assert.ok(!text.includes("provider detail"));
    assert.ok(!text.includes("malformed"));
  }
});

test("auth, unavailable model, provider rate limits, timeout/network and parsing errors are sanitized", async () => {
  for (const [properties, expected] of [
    [{ status: 401 }, 503],
    [{ status: 404 }, 503],
    [{ status: 400 }, 503],
    [{ status: 429 }, 429],
    [{ name: "APIConnectionTimeoutError" }, 504],
    [{ name: "APIConnectionError" }, 502],
    [{ name: "SyntaxError" }, 502],
  ]) {
    const error = Object.assign(
      new Error("PRIVATE workflow and key"),
      properties,
    );
    const { handler, logs } = harness(async () => {
      throw error;
    });
    const result = await handler(request());
    assert.equal(result.status, expected);
    assert.ok(!(await result.text()).includes("PRIVATE"));
    assert.ok(!JSON.stringify(logs).includes("PRIVATE"));
    if (expected === 429) assert.equal(result.headers.get("retry-after"), "60");
  }
});

test("official SDK transport uses Responses with strict schema and server-controlled configuration", async () => {
  let sent,
    calls = 0;
  const provider = createProvider("unit-test-placeholder", {
    fetch: async (url, options) => {
      calls++;
      assert.ok(String(url).endsWith("/responses"));
      sent = JSON.parse(options.body);
      return Response.json({
        id: "test",
        object: "response",
        status: "completed",
        model: "gpt-6-astra",
        output: [
          {
            id: "msg",
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(validResult()),
                annotations: [],
              },
            ],
          },
        ],
      });
    },
  });
  const result = await provider.analyze(
    toModelWorkflow(validInput()),
    "gpt-6-astra",
  );
  assert.equal(calls, 1);
  assert.deepEqual(result.output_parsed, validResult());
  assert.equal(sent.model, "gpt-6-astra");
  assert.deepEqual(sent.reasoning, { effort: "low" });
  assert.equal(sent.text.verbosity, "low");
  assert.equal(sent.text.format.type, "json_schema");
  assert.equal(sent.text.format.strict, true);
  assert.equal(sent.text.format.schema.additionalProperties, false);
  assert.equal(sent.max_output_tokens, MAX_OUTPUT_TOKENS);
  assert.equal(sent.instructions, auditInstructions);
  assert.equal(sent.store, false);
  assert.equal(sent.tools, undefined);
});

test("usage missing values are safe and routing excludes API from SPA fallback", async () => {
  assert.deepEqual(safeUsage({}), {
    model: "unknown",
    inputTokens: null,
    outputTokens: null,
    cachedInputTokens: null,
  });
  const config = JSON.parse(
    await readFile(new URL("../../vercel.json", import.meta.url), "utf8"),
  );
  const fallback = new RegExp(`^${config.rewrites[0].source}$`);
  for (const path of ["/api", "/api/audit/analyze", "/api/unknown"])
    assert.equal(fallback.test(path), false);
  for (const path of ["/", "/audit", "/solutions", "/case-study", "/blog/slug"])
    assert.ok(fallback.test(path));
  const endpoint = await import("../../api/audit/analyze.js");
  assert.equal(typeof endpoint.default.fetch, "function");
});
