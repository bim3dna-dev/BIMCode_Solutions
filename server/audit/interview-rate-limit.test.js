import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAuditHandler } from "./handler.js";
import { createInterviewStore, interviewClientIp } from "./interview-store.js";
import { validInput } from "./fixtures.js";
import { analysisErrorMessage } from "../../src/features/audit/analysis-errors.js";

const env = {
  VERCEL: "1", VERCEL_ENV: "preview", AUDIT_ANALYSIS_ENABLED: "true", AUDIT_INTERVIEW_ENABLED: "true",
  OPENAI_API_KEY: "unit-test-placeholder", AUDIT_ALLOWED_ORIGIN: "https://example.com",
  AUDIT_STATE_REDIS_REST_URL: "https://redis.example", AUDIT_STATE_REDIS_REST_TOKEN: "unit-test-placeholder",
};
const request = (ip = "192.0.2.1", extra = {}) => new Request("https://example.com/api/audit/interview", {
  method: "POST", headers: { origin: env.AUDIT_ALLOWED_ORIGIN, "content-type": "application/json", ...(ip ? { "x-vercel-forwarded-for": ip } : {}), ...extra },
  body: JSON.stringify({ action: "start", requestId: randomUUID(), input: validInput() }),
});

// Deterministic shared Redis REST contract fake; no real Redis or provider network.
// Model the atomic EVAL contracts, including Redis-owned TTL and CAS.
function harness() {
  let seconds = 0, providerCalls = 0, stateAccesses = 0;
  const counters = new Map(), sessions = new Map();
  const fetcher = async (_url, options) => {
    const [command, scriptOrKey, , key, ...args] = JSON.parse(options.body);
    if (command === "GET") { stateAccesses++; return Response.json({ result: sessions.get(scriptOrKey) ?? null }); }
    assert.equal(command, "EVAL");
    if (key.includes(":rate:interview:")) {
      assert.deepEqual(args, ["18", "600"]);
      assert.match(scriptOrKey, /redis.call\('INCR'/);
      assert.match(scriptOrKey, /redis.call\('EXPIRE'/);
      assert.ok(!key.includes("192.0.2"));
      let entry = counters.get(key);
      if (entry?.expires <= seconds) { counters.delete(key); entry = null; }
      if (!entry) { entry = { count: 0, expires: seconds + 600 }; counters.set(key, entry); }
      const allowed = entry.count < 18;
      if (allowed) entry.count++;
      return Response.json({ result: [Number(allowed), entry.expires - seconds] });
    }
    stateAccesses++;
    if ((sessions.get(key) ?? "") !== args[0]) return Response.json({ result: 0 });
    sessions.set(key, args[1]); return Response.json({ result: 1 });
  };
  const handler = (environment = "preview") => createAuditHandler({
    env: { ...env, VERCEL_ENV: environment }, operation: "interview", storeFactory: () => createInterviewStore({ ...env, VERCEL_ENV: environment }, fetcher),
    providerFactory: () => { providerCalls++; return { decideNextAuditQuestion: async () => ({ status: "completed", output_parsed: { status: "ready_for_assessment", question: null } }) }; },
    log: () => {},
  });
  return { handler, counters, sessions, advance: (n) => { seconds += n; }, calls: () => providerCalls, accesses: () => stateAccesses };
}

test("requests 1-18 allowed across handlers; 19 blocked before provider or interview-state access", async () => {
  const h = harness();
  for (let i = 1; i <= 18; i++) assert.equal((await h.handler()(request())).status, 200);
  const before = structuredClone(h.sessions), accessCount = h.accesses();
  const blocked = await h.handler()(request());
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "600");
  assert.equal(await analysisErrorMessage(blocked.clone()), "You've reached the analysis limit. Please wait a few minutes and try again.");
  assert.equal((await blocked.json()).error.code, "RATE_LIMITED");
  assert.equal(h.calls(), 18); assert.equal(h.accesses(), accessCount);
  assert.deepEqual(h.sessions, before);
});

test("different IP has independent fixed window", async () => {
  const h = harness();
  for (let i = 0; i < 18; i++) await h.handler()(request());
  assert.equal((await h.handler()(request())).status, 429);
  assert.equal((await h.handler()(request("192.0.2.2"))).status, 200);
  assert.equal(h.counters.size, 2);
});

test("blocked traffic does not extend window; reset at 600 seconds", async () => {
  const h = harness();
  for (let i = 0; i < 18; i++) await h.handler()(request());
  h.advance(599);
  const blocked = await h.handler()(request());
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get("Retry-After"), "1");
  h.advance(1);
  assert.equal((await h.handler()(request())).status, 200);
  assert.equal([...h.counters.values()][0].count, 1);
});

test("concurrent requests share one allowance across Vercel handler instances", async () => {
  const h = harness();
  const replies = await Promise.all(Array.from({ length: 25 }, () => h.handler()(request())));
  assert.equal(replies.filter((reply) => reply.status === 200).length, 18);
  assert.equal(replies.filter((reply) => reply.status === 429).length, 7);
  assert.equal(h.calls(), 18);
});

test("Redis network, HTTP, malformed and invalid responses fail closed without provider access", async () => {
  for (const fetcher of [
    async () => { throw new Error("private Redis connection details"); },
    async () => new Response("private Redis failure", { status: 500 }),
    async () => new Response("not JSON"),
    async () => Response.json({ error: "private Lua failure" }),
    ...[null, [], [1, -1], [1, 601], ["1", 600]].map((result) => async () => Response.json({ result })),
  ]) {
    let calls = 0;
    const handler = createAuditHandler({ env, operation: "interview", storeFactory: () => createInterviewStore(env, fetcher), providerFactory: () => { calls++; throw new Error(); } });
    const reply = await handler(request());
    assert.equal(reply.status, 503); assert.equal(calls, 0);
    const body = await reply.text(); assert.ok(!/Redis|Lua|private/.test(body));
  }
});

test("only Vercel's single valid IP is trusted; alternate headers cannot change the key", async () => {
  const h = harness();
  for (const ip of [null, "invalid", "192.0.2.1, 192.0.2.2", "192.0.2.1:80", "fe80::1%eth0"]) {
    assert.equal((await h.handler()(request(ip, { "x-forwarded-for": "192.0.2.3", "x-real-ip": "192.0.2.4" }))).status, 503);
  }
  assert.equal(h.counters.size, 0); assert.equal(h.calls(), 0);
  assert.throws(() => interviewClientIp(request(), {}));
  assert.equal(interviewClientIp(request("2001:db8::1"), env), interviewClientIp(request("2001:0db8:0:0:0:0:0:1"), env));
  for (let i = 0; i < 18; i++) await h.handler()(request());
  assert.equal((await h.handler()(request("192.0.2.1", { "x-forwarded-for": "192.0.2.99" }))).status, 429);
});


test("Preview and Production share Redis but isolate counters and identical session/cache IDs", async () => {
  const h = harness();
  for (let i = 0; i < 18; i++) assert.equal((await h.handler("preview")(request())).status, 200);
  assert.equal((await h.handler("preview")(request())).status, 429);
  assert.equal((await h.handler("production")(request())).status, 200);
  assert.equal(h.counters.size, 2);
  assert.ok([...h.counters.keys()].some((key) => key.startsWith("bimcode:audit:m3:preview:rate:interview:")));
  assert.ok([...h.counters.keys()].some((key) => key.startsWith("bimcode:audit:m3:production:rate:interview:")));

  const values = new Map();
  const transport = async (_url, options) => {
    const args = JSON.parse(options.body);
    if (args[0] === "GET") return Response.json({ result: values.get(args[1]) ?? null });
    assert.equal(args[0], "EVAL");
    assert.ok(Number(args[6]) > 0 && Number(args[6]) <= 1800);
    if ((values.get(args[3]) ?? "") !== args[4]) return Response.json({ result: 0 });
    values.set(args[3], args[5]); return Response.json({ result: 1 });
  };
  const preview = createInterviewStore(env, transport);
  const production = createInterviewStore({ ...env, VERCEL_ENV: "production" }, transport);
  const id = randomUUID();
  const state = { phase: "complete", result: { summary: "Preview cached assessment" }, expiresAt: Date.now() + 1800000 };
  assert.equal(await preview.cas(id, null, state), true);
  assert.equal(await production.get(id), null);
  const prodState = { ...state, result: { summary: "Production cached assessment" } };
  assert.equal(await production.cas(id, null, prodState), true);
  assert.deepEqual(await preview.get(id), state);
  assert.deepEqual(await production.get(id), prodState);
  assert.deepEqual([...values.keys()], [`bimcode:audit:m3:preview:${id}`, `bimcode:audit:m3:production:${id}`]);
});

test("missing or unknown deployed environment fails closed without Redis access", () => {
  for (const environment of [undefined, "", "unknown", "preview:production"]) {
    assert.throws(() => createInterviewStore({ ...env, VERCEL_ENV: environment }, () => { throw new Error("Must not connect"); }), /State environment unavailable/);
  }
});
