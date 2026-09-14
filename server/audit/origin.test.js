import test from "node:test";
import assert from "node:assert/strict";
import { createAuditHandler } from "./handler.js";

const origin = "https://bimcode-solutions-git-preview-m3-interview-bimc-ode-solutions.vercel.app";
function harness(operation, configured = origin) {
  const logs = [];
  const handler = createAuditHandler({
    operation,
    env: { VERCEL: "1", AUDIT_ANALYSIS_ENABLED: "true", AUDIT_INTERVIEW_ENABLED: "true", OPENAI_API_KEY: "unit-test-placeholder", AUDIT_ALLOWED_ORIGIN: configured },
    // Schema-invalid body stops before any session/provider operation.
    storeFactory: () => ({ consumeInterviewRequest: async () => ({ allowed: true, retryAfter: 600 }) }),
    providerFactory: () => { throw new Error("Provider must not be invoked"); },
    log: (entry) => logs.push(entry),
  });
  const post = (requestOrigin = origin, fetchSite = "same-origin", extra = {}) => handler(new Request(`https://example.com/api/audit/${operation}`, {
    method: "POST", headers: { "content-type": "application/json", "x-vercel-forwarded-for": "192.0.2.1", ...(requestOrigin === null ? {} : { origin: requestOrigin }), ...(fetchSite === null ? {} : { "sec-fetch-site": fetchSite }), ...extra }, body: "{}",
  }));
  return { post, logs };
}

for (const operation of ["interview", "analyze"]) {
  test(`${operation}: exact and whitespace-padded configured origins pass origin validation`, async () => {
    for (const configured of [origin, ` \t${origin}\r\n `]) {
      const h = harness(operation, configured);
      const reply = await h.post();
      assert.equal(reply.status, 400);
      assert.equal((await reply.json()).error.code, "INVALID_INPUT");
      assert.deepEqual(h.logs, []);
    }
  });
  test(`${operation}: wrong/missing/null origins rejected without Host or Referer fallback`, async () => {
    for (const value of ["https://wrong.example", origin + ".evil.example", null, "null"]) {
      const h = harness(operation);
      const reply = await h.post(value, "same-origin", { host: new URL(origin).host, referer: origin + "/audit" });
      assert.equal(reply.status, 403);
      assert.equal((await reply.json()).error.code, "ORIGIN_NOT_ALLOWED");
      assert.equal(h.logs[0].trimmedEquality, false);
    }
  });
  test(`${operation}: fetch metadata still rejects non-same-origin even when origin matches`, async () => {
    const h = harness(operation);
    assert.equal((await h.post(origin, "cross-site")).status, 403);
    assert.equal(h.logs[0].strictEquality, true);
    assert.equal(h.logs[0].trimmedEquality, true);
    assert.equal((await h.post(origin, null)).status, 400);
    assert.deepEqual(Object.keys(h.logs[0]).sort(), ["event", "requestOrigin", "configuredOrigin", "requestOriginLength", "configuredOriginLength", "strictEquality", "trimmedEquality"].sort());
    assert.ok(!JSON.stringify(h.logs).includes("unit-test-placeholder"));
  });
  test(`${operation}: trim does not accept paths, wildcards or embedded whitespace`, async () => {
    for (const configured of [origin + "/", "https://*.vercel.app", origin.replace("solutions", "solu tions"), " \n "]) {
      // A wildcard config is a literal URL origin, never a matching wildcard.
      assert.ok([403, 503].includes((await harness(operation, configured).post()).status));
    }
  });
}
