import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createInterviewClient,
  initialInterviewState,
} from "./interview-client.js";
import { validInput, validResult } from "../../../server/audit/fixtures.js";
import { genericError } from "./analysis-errors.js";
import { translate } from "../../i18n/locale.js";

const interviewId = randomUUID(),
  questionId = randomUUID();
const ready = {
  interviewId,
  status: "ready_for_assessment",
  question: null,
  questionNumber: 0,
};
const question = {
  interviewId,
  status: "needs_clarification",
  question: { id: questionId, text: "Should corrections require approval?" },
  questionNumber: 1,
};
function harness(replies) {
  const states = [],
    calls = [],
    submission = validInput();
  const client = createInterviewClient({
    submission,
    onChange: (state) => states.push(state),
    fetcher: async (path, options) => {
      calls.push({
        path,
        body: JSON.parse(options.body),
        signal: options.signal,
      });
      const next = replies.shift();
      return typeof next === "function" ? next() : next;
    },
  });
  return { client, states, calls, submission, state: () => states.at(-1) };
}

test("client zero-question flow invokes final once with only the session ID", async () => {
  const h = harness([
    Response.json(ready),
    Response.json({ result: validResult() }),
  ]);
  await h.client.start();
  assert.deepEqual(
    h.calls.map((call) => call.path),
    ["/api/audit/interview", "/api/audit/analyze"],
  );
  assert.deepEqual(h.calls[1].body, { interviewId });
  assert.deepEqual(h.state().result, validResult());
  assert.equal(h.state().busy, false);
});

test("client answer and skip send no invented history; restart clears progress and preserves intake", async () => {
  const h = harness([
    Response.json(question),
    Response.json({
      ...question,
      question: {
        ...question.question,
        id: randomUUID(),
        text: "Which views need annotation?",
      },
      questionNumber: 2,
    }),
    Response.json({ ...ready, questionNumber: 2 }),
    Response.json({ result: validResult() }),
    Response.json(question),
  ]);
  await h.client.start();
  await h.client.answer("  BIM lead approval  ");
  assert.deepEqual(h.calls[1].body, {
    action: "answer",
    interviewId,
    questionId,
    answer: "BIM lead approval",
    skipped: false,
  });
  await h.client.answer("", true);
  assert.equal(h.calls[2].body.skipped, true);
  assert.equal(h.calls[2].body.answer, "");
  h.client.restart();
  assert.deepEqual(h.state(), initialInterviewState());
  assert.deepEqual(h.submission, validInput());
  await h.client.start();
  assert.notEqual(h.calls[0].body.requestId, h.calls[4].body.requestId);
  assert.deepEqual(h.calls[4].body.input, h.submission);
});

test("duplicate clicks blocked; restart/dispose discard late network results", async () => {
  let release;
  const h = harness([
    () =>
      new Promise((resolve) => {
        release = () => resolve(Response.json(question));
      }),
  ]);
  const pending = h.client.start();
  await h.client.start();
  assert.equal(h.calls.length, 1);
  h.client.restart();
  assert.equal(h.calls[0].signal.aborted, true);
  release();
  await pending;
  assert.deepEqual(h.state(), initialInterviewState());
});

test("HTML 429 retry reuses the same start ID; final retry does not restart interview", async () => {
  const h = harness([
    new Response("<html>WAF</html>", { status: 429 }),
    Response.json(ready),
    new Response("private provider HTML", { status: 502 }),
    Response.json({ result: validResult() }),
  ]);
  await h.client.start();
  assert.equal(
    h.state().error,
    "You've reached the analysis limit. Please wait a few minutes and try again.",
  );
  await h.client.retry();
  assert.deepEqual(h.calls[1].body, h.calls[0].body);
  assert.equal(h.state().error, genericError);
  await h.client.retry();
  assert.equal(h.calls[3].path, "/api/audit/analyze");
  assert.deepEqual(h.calls[3].body, h.calls[2].body);
  assert.deepEqual(h.state().result, validResult());
});

test("non-JSON success and invalid question/result schemas show controlled temporary error", async () => {
  for (const replies of [
    [new Response("private")],
    [Response.json({ ...question, questionNumber: 5 })],
    [Response.json({ ...ready, question: question.question })],
    [Response.json(ready), Response.json({ result: {} })],
  ]) {
    const h = harness(replies);
    await h.client.start();
    assert.equal(h.state().error, genericError);
    assert.equal(h.state().result, null);
  }
});

test("all interview controls and errors have static translations in every supported locale", () => {
  const keys = [
    "One clarification before the assessment",
    "Question {number} of up to 4",
    "I don’t know / Skip",
    "Restart interview",
    "Retry",
    "Continue",
    "AI interview questions and assessments are currently generated in English.",
    "This interview has expired or could not finish. Please restart the interview.",
    "Your previous request is still processing. Please wait a moment and retry.",
  ];
  for (const locale of ["nl", "de", "bs"])
    for (const key of keys) assert.notEqual(translate(locale, key), key);
  assert.match(translate("de", keys[1], { number: 2 }), /2/);
});
