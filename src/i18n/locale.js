import { translations } from "./translations.js";

export const locales = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  bs: "Bosanski",
};
export const localeKey = "bimcode_locale";
export const validLocale = (value) =>
  Object.hasOwn(locales, value) ? value : "en";
export function readLocale(storage) {
  try {
    return validLocale(storage?.getItem(localeKey));
  } catch {
    return "en";
  }
}
export function persistLocale(storage, value) {
  const locale = validLocale(value);
  try {
    storage?.setItem(localeKey, locale);
  } catch {
    /* Storage may be blocked. */
  }
  return locale;
}
export function translate(locale, text, values = {}) {
  if (typeof text !== "string") return text;
  // The existing intake validator returns English messages with numeric limits.
  // Localize those presentation strings without changing its contract or form data.
  let match;
  if ((match = /^Use (\d+) characters or fewer\.$/.exec(text)))
    return translate(locale, "Use {limit} characters or fewer.", {
      limit: match[1],
    });
  if ((match = /^Enter a whole number from 1 to ([\d,]+)\.$/.exec(text)))
    return translate(locale, "Enter a whole number from 1 to {max}.", {
      max: match[1],
    });
  if (
    (match =
      /^Enter a duration greater than 0 and no more than ([\d,]+) (hours|minutes)\.$/.exec(
        text,
      ))
  )
    return translate(
      locale,
      "Enter a duration greater than 0 and no more than {max} {unit}.",
      { max: match[1], unit: translate(locale, match[2]) },
    );
  const dictionary = translations[validLocale(locale)];
  const result = Object.hasOwn(dictionary, text) ? dictionary[text] : text;
  return result.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

export function localizedFrequency(frequency, t) {
  if (frequency.type === "custom")
    return t("Repetitions: {count}; period (days): {days}", {
      count: frequency.occurrences,
      days: frequency.intervalDays,
    });
  const periods = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    "per project": "project",
  };
  return t("Repetitions: {count}; period: {period}", {
    count: frequency.occurrences,
    period: t(periods[frequency.type]),
  });
}
