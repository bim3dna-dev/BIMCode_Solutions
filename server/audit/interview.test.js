import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAuditHandler } from "./handler.js";
import { createInterviewStore } from "./interview-store.js";
import {
  createProvider,
  toModelWorkflow,
  DECISION_MAX_OUTPUT_TOKENS,
} from "./provider.js";
import { validInput, validResult } from "./fixtures.js";

const ready = { status: "ready_for_assessment", question: null };
const question = (
  topic = "mutation_authority",
  text = "Should the tool only report issues?",
) => ({
  status: "needs_clarification",
  question: { text, topic, reason: "Correction authority affects scope" },
});
const response = (data) => ({
  status: "completed",
  output: [],
  output_parsed: data,
});
const env = {
  VERCEL: "1",
  OPENAI_API_KEY: "unit-test-placeholder",
  AUDIT_ANALYSIS_ENABLED: "true",
  AUDIT_INTERVIEW_ENABLED: "true",
  AUDIT_ALLOWED_ORIGIN: "https://example.com",
};
function harness(
  decisions = [ready],
  final = async () => response(validResult()),
) {
  const states = new Map(),
    calls = [],
    logs = [];
  // Test-only atomic fake; production never falls back to process-local storage.
  const store = {
    consumeInterviewRequest: async () => ({ allowed: true, retryAfter: 600 }),
    get: async (id) => structuredClone(states.get(id) ?? null),
    cas: async (id, old, next) => {
      if (JSON.stringify(states.get(id) ?? null) !== JSON.stringify(old))
        return false;
      states.set(id, structuredClone(next));
      return true;
    },
  };
  let count = 0;
  const provider = {
    decideNextAuditQuestion: async (...args) => {
      calls.push(["decision", ...args]);
      const next = decisions[count++];
      return typeof next === "function" ? next() : response(next);
    },
    generateAuditAssessment: async (...args) => {
      calls.push(["final", ...args]);
      return final();
    },
  };
  const options = {
    env,
    storeFactory: () => store,
    providerFactory: () => provider,
    log: (entry) => logs.push(entry),
  };
  const interview = createAuditHandler({ ...options, operation: "interview" });
  const analyze = createAuditHandler(options);
  const post = async (body, operation = "interview", headers = {}) => {
    const result = await (operation === "interview" ? interview : analyze)(
      new Request(`https://example.com/api/audit/${operation}`, {
        method: "POST",
        headers: {
          "x-vercel-forwarded-for": "192.0.2.1",
          origin: env.AUDIT_ALLOWED_ORIGIN,
          "content-type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
    return { status: result.status, body: await result.json() };
  };
  const startPayload = {
    action: "start",
    requestId: randomUUID(),
    input: validInput(),
  };
  const start = () => post(startPayload);
  const answer = (reply, text = "Report only", skipped = false) =>
    post({
      action: "answer",
      interviewId: reply.interviewId,
      questionId: reply.question.id,
      answer: text,
      skipped,
    });
  return { post, start, answer, startPayload, calls, states, logs, store };
}

test("zero questions leads to one cached final assessment; identity stripped and canonical context preserved", async () => {
  const h = harness();
  const start = await h.start();
  assert.equal(start.status, 200);
  assert.equal(start.body.status, ready.status);
  assert.equal(start.body.questionNumber, 0);
  const result = await h.post(
    { interviewId: start.body.interviewId },
    "analyze",
  );
  assert.deepEqual(result.body, { result: validResult() });
  assert.deepEqual(
    await h.post({ interviewId: start.body.interviewId }, "analyze"),
    result,
  );
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[0][1], toModelWorkflow(validInput()));
  assert.equal(h.calls[0][1].discipline, "Mechanical");
  assert.equal(h.calls[0][1].frequency.type, "weekly");
  assert.equal(h.calls[0][1].manualEffort.unit, "hours");
  assert.ok(
    !JSON.stringify([...h.states.values()]).includes("alex@example.com"),
  );
  assert.ok(!JSON.stringify(h.logs).includes("Pipe tagging"));
  assert.equal((await h.post(validInput(), "analyze")).status, 400); // no legacy bypass when M3 enabled
});

test("one question has server ID, no internal reason, validated answer reaches final", async () => {
  const h = harness([question(), ready]);
  const first = (await h.start()).body;
  assert.equal(first.questionNumber, 1);
  assert.deepEqual(Object.keys(first.question).sort(), ["id", "text"]);
  assert.equal(
    (await h.post({ interviewId: first.interviewId }, "analyze")).status,
    409,
  );
  const next = await h.answer(first);
  assert.equal(next.body.status, ready.status);
  await h.post({ interviewId: first.interviewId }, "analyze");
  const history = h.calls.at(-1)[2];
  assert.deepEqual(history, [
    {
      questionId: first.question.id,
      topic: "mutation_authority",
      question: first.question.text,
      answer: "Report only",
      skipped: false,
    },
  ]);
});

test("four distinct questions enforce four decision calls and one assessment across retries", async () => {
  const topics = [
    "connectors",
    "views_and_tags",
    "worksharing",
    "mutation_authority",
  ];
  const h = harness(
    topics.map((topic, i) =>
      question(topic, `What is the relevant constraint number ${i + 1}?`),
    ),
  );
  let current = (await h.start()).body;
  for (let i = 0; i < 4; i++) {
    assert.equal(current.questionNumber, i + 1);
    const prior = current;
    const result = await h.answer(prior);
    assert.equal(result.status, 200);
    assert.deepEqual(await h.answer(prior), result); // replay consumes no call
    current = result.body;
  }
  assert.equal(current.status, ready.status);
  await h.post({ interviewId: current.interviewId }, "analyze");
  assert.equal(h.calls.filter(([kind]) => kind === "decision").length, 4);
  assert.equal(h.calls.filter(([kind]) => kind === "final").length, 1);
  assert.equal(h.calls.at(-1)[2].length, 4);
});

test("duplicate topics and normalized duplicate question text stop without another paid selection", async () => {
  for (const second of [
    question("mutation_authority", "May corrections be applied?"),
    question("approval"),
  ]) {
    const h = harness([question(), second]);
    const next = await h.answer((await h.start()).body);
    assert.equal(next.body.status, ready.status);
    assert.equal(h.calls.length, 2);
  }
});

test("skip and natural don't-know answers become unresolved unknowns; a different topic may follow", async () => {
  for (const [answer, skipped] of [
    ["", true],
    ["I don't know", false],
    ["not sure", false],
    ["skip", false],
  ]) {
    const h = harness([
      question(),
      question("views_and_tags", "Which views need tags?"),
      ready,
    ]);
    const second = await h.answer((await h.start()).body, answer, skipped);
    assert.equal(second.body.questionNumber, 2);
    assert.deepEqual(h.calls[1][2][0].answer, "");
    assert.equal(h.calls[1][2][0].skipped, true);
    await h.answer(second.body);
    await h.post({ interviewId: second.body.interviewId }, "analyze");
    assert.equal(h.calls.at(-1)[2][0].skipped, true);
  }
});

test("invalid decisions, multiple questions, unknown topics and incomplete/refused output fail closed", async () => {
  for (const decision of [
    {},
    { ...ready, extra: true },
    { ...ready, question: question().question },
    question("other"),
    question("approval", "Who approves? Who deploys?"),
    { status: "needs_clarification", question: null },
    () => ({ status: "incomplete" }),
    () => ({
      status: "completed",
      output: [{ type: "message", content: [{ type: "refusal" }] }],
    }),
  ]) {
    const h = harness([decision]);
    assert.ok([422, 502].includes((await h.start()).status));
    assert.equal((await h.start()).status, 409);
    assert.equal(h.calls.length, 1);
  }
});

test("malformed answers, client histories, forged IDs, origin violations rejected before another call", async () => {
  const h = harness([question()]);
  const first = (await h.start()).body;
  const valid = {
    action: "answer",
    interviewId: first.interviewId,
    questionId: first.question.id,
    answer: "Report only",
    skipped: false,
  };
  for (const invalid of [
    { ...valid, answer: " " },
    { ...valid, answer: "a".repeat(2001) },
    { ...valid, skipped: "true" },
    { ...valid, answer: "secret", skipped: true },
    { ...valid, history: [] },
    { ...valid, maxQuestions: 20 },
    { ...valid, questionId: "forged" },
  ])
    assert.equal((await h.post(invalid)).status, 400);
  assert.equal(
    (await h.post({ ...valid, questionId: randomUUID() })).status,
    409,
  );
  assert.equal(
    (await h.post(valid, "interview", { origin: "https://evil.example" }))
      .status,
    403,
  );
  assert.equal(h.calls.length, 1);
});

test("atomic reservation stops concurrent starts and final calls; changed replay rejected", async () => {
  let release, began;
  const started = new Promise((resolve) => {
    began = resolve;
  });
  const h = harness([
    () =>
      new Promise((resolve) => {
        release = () => resolve(response(ready));
        began();
      }),
  ]);
  const pending = h.start();
  await started;
  assert.equal((await h.start()).status, 409);
  release();
  await pending;
  assert.equal((await h.start()).status, 200);
  assert.equal(h.calls.length, 1);
  assert.equal(
    (
      await h.post({
        ...h.startPayload,
        input: {
          ...validInput(),
          workflow: { ...validInput().workflow, title: "Changed" },
        },
      })
    ).status,
    409,
  );

  let finish, finalBegan;
  const finalStarted = new Promise((resolve) => {
    finalBegan = resolve;
  });
  const f = harness(
    [ready],
    () =>
      new Promise((resolve) => {
        finish = () => resolve(response(validResult()));
        finalBegan();
      }),
  );
  const id = (await f.start()).body.interviewId;
  const inFlight = f.post({ interviewId: id }, "analyze");
  await finalStarted;
  assert.equal((await f.post({ interviewId: id }, "analyze")).status, 409);
  finish();
  await inFlight;
  assert.equal(f.calls.length, 2);
});

test("expired sessions, provider failure and unavailable state storage never trigger unbounded retries", async () => {
  const h = harness([ready], async () => {
    throw new SyntaxError("private non-JSON provider body");
  });
  const id = (await h.start()).body.interviewId;
  const failed = await h.post({ interviewId: id }, "analyze");
  assert.equal(failed.status, 502);
  assert.ok(!JSON.stringify(failed).includes("private"));
  assert.equal((await h.post({ interviewId: id }, "analyze")).status, 409);
  assert.equal(h.calls.length, 2);
  h.states.get(id).expiresAt = 0;
  assert.equal((await h.start()).status, 410);
  const handler = createAuditHandler({
    env: { ...env, AUDIT_INTERVIEW_ENABLED: "false" },
    operation: "interview",
    providerFactory: () => {
      throw new Error("must not run");
    },
  });
  const request = new Request("https://example.com/api/audit/interview", {
    method: "POST",
    headers: {
      origin: env.AUDIT_ALLOWED_ORIGIN,
      "content-type": "application/json",
    },
    body: JSON.stringify(h.startPayload),
  });
  assert.equal((await handler(request)).status, 503);
});

test("Redis adapter uses atomic CAS with bounded expiry, rejects unsafe configuration and errors", async () => {
  const commands = [];
  const config = {
    AUDIT_STATE_REDIS_REST_URL: "https://redis.example",
    AUDIT_STATE_REDIS_REST_TOKEN: "unit-test-placeholder",
  };
  const store = createInterviewStore(config, async (_url, init) => {
    commands.push(JSON.parse(init.body));
    assert.equal(init.redirect, "error");
    return Response.json({ result: commands.length === 1 ? null : 1 });
  });
  assert.equal(await store.get("id"), null);
  assert.equal(
    await store.cas("id", null, { expiresAt: Date.now() + 1800000 }),
    true,
  );
  assert.equal(commands[1][0], "EVAL");
  assert.equal(commands[1][4], "");
  assert.ok(Number(commands[1].at(-1)) <= 1800);
  assert.throws(() =>
    createInterviewStore({
      ...config,
      AUDIT_STATE_REDIS_REST_URL: "http://redis.example",
    }),
  );
  assert.throws(() => createInterviewStore({}));
  await assert.rejects(
    createInterviewStore(config, async () =>
      Response.json({ error: "private" }),
    ).get("id"),
    /State store unavailable/,
  );
});

test("actual SDK mocked transport: decision schema/cap, low reasoning, no tools, compact final history", async () => {
  const sent = [];
  const provider = createProvider("unit-test-placeholder", {
    fetch: async (_url, options) => {
      sent.push(JSON.parse(options.body));
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
                text: JSON.stringify(sent.length === 1 ? ready : validResult()),
                annotations: [],
              },
            ],
          },
        ],
      });
    },
  });
  const answers = [
    {
      topic: "approval",
      question: "Who approves corrections?",
      answer: "BIM lead",
      skipped: false,
      questionId: "internal",
      extra: "discard",
    },
  ];
  assert.deepEqual(
    (
      await provider.decideNextAuditQuestion(
        toModelWorkflow(validInput()),
        [],
        "gpt-6-astra",
      )
    ).output_parsed,
    ready,
  );
  await provider.generateAuditAssessment(
    toModelWorkflow(validInput()),
    answers,
    "gpt-6-astra",
  );
  assert.equal(sent[0].max_output_tokens, DECISION_MAX_OUTPUT_TOKENS);
  assert.ok(sent[0].max_output_tokens < sent[1].max_output_tokens);
  for (const body of sent) {
    assert.equal(body.text.format.strict, true);
    assert.equal(body.reasoning.effort, "low");
    assert.equal(body.tools, undefined);
    assert.equal(body.store, false);
  }
  assert.deepEqual(JSON.parse(sent[1].input[0].content).diagnosticAnswers, [
    {
      topic: "approval",
      question: "Who approves corrections?",
      answer: "BIM lead",
      skipped: false,
    },
  ]);
});

test("state outage and lost reservation prevent any provider call", async () => {
  for (const store of [
    {
      get: async () => {
        throw new Error("private store outage");
      },
    },
    { get: async () => null, cas: async () => false },
  ]) {
    let calls = 0;
    const handler = createAuditHandler({
      env,
      operation: "interview",
      storeFactory: () => ({ ...store, consumeInterviewRequest: async () => ({ allowed: true, retryAfter: 600 }) }),
      providerFactory: () => ({
        decideNextAuditQuestion: async () => {
          calls++;
          return response(ready);
        },
      }),
      log: () => {},
    });
    const result = await handler(
      new Request("https://example.com/api/audit/interview", {
        method: "POST",
        headers: {
          origin: env.AUDIT_ALLOWED_ORIGIN,
          "x-vercel-forwarded-for": "192.0.2.1",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          requestId: randomUUID(),
          input: validInput(),
        }),
      }),
    );
    assert.ok([409, 502].includes(result.status));
    assert.equal(calls, 0);
    assert.ok(!(await result.text()).includes("private"));
  }
});

test("decision rate limit and non-JSON provider errors stay controlled and consume one reservation", async () => {
  for (const error of [
    Object.assign(new Error("private provider"), { status: 429 }),
    new SyntaxError("private provider HTML"),
  ]) {
    const h = harness([
      async () => {
        throw error;
      },
    ]);
    const failed = await h.start();
    assert.equal(failed.status, error.status === 429 ? 429 : 502);
    assert.ok(!JSON.stringify(failed).includes("private"));
    await h.start();
    assert.equal(h.calls.length, 1);
  }
});
