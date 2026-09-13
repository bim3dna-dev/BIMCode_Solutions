import test from "node:test";
import assert from "node:assert/strict";
import { analysisErrorMessage, genericError } from "./analysis-errors.js";

test("HTTP 429 displays the analysis limit message regardless of response format", async () => {
  for (const body of ["", "<html>Too Many Requests</html>", JSON.stringify({ error: { code: "RATE_LIMITED" } })]) {
    assert.equal(await analysisErrorMessage(new Response(body, { status: 429 })), "You've reached the analysis limit. Please wait a few minutes and try again.");
  }
});

test("server failures remain generic and never expose response details", async () => {
  for (const status of [500, 502, 503, 504]) {
    assert.equal(await analysisErrorMessage(Response.json({ error: { code: "RATE_LIMITED", message: "private detail" } }, { status })), genericError);
  }
  assert.equal(await analysisErrorMessage(new Response("invalid JSON", { status: 403 })), genericError);
  assert.equal(await analysisErrorMessage(Response.json({ error: { code: "toString" } }, { status: 400 })), genericError);
  assert.match(await analysisErrorMessage(Response.json({ error: { code: "INVALID_INPUT" } }, { status: 400 })), /Please edit/);
});
