import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialIntake,
  describeFrequency,
  normalizeIntake,
  validateIntake,
} from "./workflow.js";

const valid = () => ({
  ...createInitialIntake(),
  name: " Alex Example ",
  email: " alex@example.com ",
  company: " Example AEC ",
  role: " BIM manager ",
  discipline: "BIM/VDC",
  title: " Pipe tagging ",
  description: " Tag pipes and check each drawing before issue. ",
  software: ["Revit", "Excel"],
  frequencyType: "weekly",
  occurrences: "3",
  duration: "1.5",
  participants: "2",
});

test("normalizes a valid intake without mutating inputs or inferring annual effort", () => {
  const form = valid();
  form.untrustedExtra = "discard";
  const before = structuredClone(form);
  const data = normalizeIntake(form);
  assert.deepEqual(form, before);
  assert.equal(data.contact.name, "Alex Example");
  assert.equal(data.contact.email, "alex@example.com");
  assert.deepEqual(data.workflow.frequency, {
    type: "weekly",
    occurrences: 3,
    intervalDays: null,
  });
  assert.deepEqual(data.workflow.manualEffort, {
    duration: 1.5,
    unit: "hours",
    basis: "per-person-per-occurrence",
  });
  assert.equal(data.workflow.participants, 2);
  assert.equal(data.workflow.revitVersion, null);
  assert.equal(data.untrustedExtra, undefined);
  assert.notEqual(data.workflow.software, form.software);
});

test("rejects blank required fields, invalid email, excessive text and unknown choices", () => {
  for (const field of [
    "name",
    "email",
    "company",
    "role",
    "title",
    "description",
  ])
    assert.ok(validateIntake({ ...valid(), [field]: "   " })[field]);
  for (const [field, value] of [
    ["email", "not-an-email"],
    ["title", "x".repeat(161)],
    ["description", "x".repeat(4001)],
    ["discipline", "unknown"],
    ["software", ["unknown"]],
    ["frequencyType", "sometimes"],
    ["durationUnit", "days"],
  ]) {
    assert.ok(validateIntake({ ...valid(), [field]: value })[field]);
    assert.throws(() => normalizeIntake({ ...valid(), [field]: value }));
  }
});

test("rejects nonpositive/nonfinite effort and fractional or excessive counts", () => {
  for (const duration of ["", "0", "-1", "Infinity", "NaN", "1001"])
    assert.ok(validateIntake({ ...valid(), duration }).duration);
  for (const field of ["participants", "occurrences"])
    for (const value of ["", "0", "-2", "1.5", "Infinity", "10001"])
      assert.ok(validateIntake({ ...valid(), [field]: value })[field]);
  assert.deepEqual(
    validateIntake({ ...valid(), duration: "90", durationUnit: "minutes" }),
    {},
  );
});

test("custom periods require days and stale custom values do not leak into other frequencies", () => {
  assert.ok(
    validateIntake({ ...valid(), frequencyType: "custom", intervalDays: "" })
      .intervalDays,
  );
  const data = normalizeIntake({
    ...valid(),
    frequencyType: "custom",
    occurrences: "2",
    intervalDays: "14",
  });
  assert.deepEqual(data.workflow.frequency, {
    type: "custom",
    occurrences: 2,
    intervalDays: 14,
  });
  assert.equal(
    describeFrequency(data.workflow.frequency),
    "2 occurrences every 14 days",
  );
  assert.deepEqual(
    normalizeIntake({
      ...valid(),
      frequencyType: "per project",
      intervalDays: "14",
    }).workflow.frequency,
    { type: "per project", occurrences: 3, intervalDays: null },
  );
});
