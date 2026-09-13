import test from "node:test";
import assert from "node:assert/strict";
import {
  locales,
  localeKey,
  readLocale,
  persistLocale,
  translate,
  localizedFrequency,
} from "./locale.js";
import { translations } from "./translations.js";
import { socialLinks } from "../data/social-links.js";
import {
  createInitialIntake,
  normalizeIntake,
  disciplines,
  frequencyOptions,
  softwareOptions,
} from "../features/audit/workflow.js";
import * as content from "../data/content.js";

test("locale defaults, switching, persistence and invalid/stale storage are safe", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(readLocale(storage), "en");
  for (const locale of Object.keys(locales)) {
    assert.equal(persistLocale(storage, locale), locale);
    assert.equal(values.get(localeKey), locale);
    assert.equal(readLocale(storage), locale);
  }
  values.set(localeKey, "invalid");
  assert.equal(readLocale(storage), "en");
  assert.equal(persistLocale(storage, "toString"), "en");
  const blocked = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
  };
  assert.equal(readLocale(blocked), "en");
  assert.equal(persistLocale(blocked, "de"), "de");
});

test("translation fallback, interpolation and validation messages use static copy", () => {
  assert.equal(translate("unknown", "Home"), "Home");
  assert.equal(
    translate("de", "Unlisted technical term"),
    "Unlisted technical term",
  );
  assert.equal(
    translate("de", "Use 120 characters or fewer."),
    "Verwenden Sie höchstens 120 Zeichen.",
  );
  assert.equal(
    translate("nl", "Enter a whole number from 1 to 10,000."),
    "Vul een geheel getal van 1 tot 10,000 in.",
  );
  assert.match(
    translate(
      "bs",
      "Enter a duration greater than 0 and no more than 1,000 hours.",
    ),
    /1,000 sati/,
  );
  assert.equal(
    translate("bs", "{name} (opens in a new tab)", { name: "LinkedIn" }),
    "LinkedIn (otvara se u novoj kartici)",
  );
});

test("all dictionaries have the same nonempty static entries", () => {
  for (const locale of Object.keys(locales)) {
    assert.deepEqual(
      Object.keys(translations[locale]),
      Object.keys(translations.en),
    );
    assert.ok(
      Object.values(translations[locale]).every(
        (text) => typeof text === "string" && text.trim(),
      ),
    );
  }
});

test("shared public content has translations while identifiers and technology names stay stable", () => {
  const ignoredKeys = new Set(["intent", "slug", "link"]);
  const unchanged = new Set(["pyRevit"]);
  function visit(value, key) {
    if (ignoredKeys.has(key)) return;
    if (typeof value === "string") {
      assert.ok(
        unchanged.has(value) || Object.hasOwn(translations.nl, value),
        `Missing public copy: ${value}`,
      );
    } else if (Array.isArray(value)) value.forEach((entry) => visit(entry));
    else if (value)
      Object.entries(value).forEach(([k, entry]) => visit(entry, k));
  }
  visit(content);
});

test("localized audit labels and summaries never mutate canonical payload values", () => {
  const form = {
    ...createInitialIntake(),
    name: "Test User",
    email: "test@example.com",
    company: "Test",
    role: "BIM Manager",
    title: "Weekly QA",
    description: "Inspect pipes",
    discipline: "Mechanical",
    software: ["Revit", "Other"],
    frequencyType: "weekly",
    duration: "3",
    participants: "6",
  };
  const expected = normalizeIntake(form);
  for (const locale of Object.keys(locales)) {
    const t = (text, values) => translate(locale, text, values);
    for (const options of [disciplines, frequencyOptions, softwareOptions]) {
      const localized = options.map((value) => ({ value, label: t(value) }));
      assert.deepEqual(
        localized.map((option) => option.value),
        options,
      );
    }
    assert.ok(localizedFrequency(expected.workflow.frequency, t));
    assert.deepEqual(normalizeIntake(form), expected);
    assert.equal(expected.workflow.frequency.type, "weekly");
    assert.equal(expected.workflow.manualEffort.unit, "hours");
  }
});

test("footer destinations match the supplied public links without a guessed YouTube channel", () => {
  assert.deepEqual(
    socialLinks.map(({ name }) => name),
    ["LinkedIn", "X", "Instagram", "XING"],
  );
  assert.deepEqual(
    socialLinks.map(({ url }) => url),
    [
      "https://www.linkedin.com/in/emin-avdovic-90210/",
      "https://x.com/bimcodesolution",
      "https://www.instagram.com/bimcode_solutions_/",
      "https://www.xing.com/discover/your-posts",
    ],
  );
  for (const { url } of socialLinks) {
    const parsed = new URL(url);
    assert.equal(parsed.protocol, "https:");
    assert.equal(parsed.username, "");
  }
});
