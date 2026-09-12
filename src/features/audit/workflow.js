export const disciplines = [
  "Architecture",
  "Structural",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "BIM/VDC",
  "General Contractor / Construction",
  "Other",
];
export const softwareOptions = [
  "Revit",
  "AutoCAD",
  "Navisworks",
  "Dynamo",
  "Excel",
  "BIM 360 / Autodesk Construction Cloud",
  "Other",
];
export const frequencyOptions = [
  "daily",
  "weekly",
  "monthly",
  "per project",
  "custom",
];
export const textLimits = {
  name: 120,
  email: 254,
  company: 160,
  role: 120,
  title: 160,
  description: 4000,
  revitVersion: 40,
  painPoint: 1000,
  desiredOutcome: 1000,
};

export const createInitialIntake = () => ({
  name: "",
  email: "",
  company: "",
  role: "",
  discipline: "",
  title: "",
  description: "",
  software: [],
  revitVersion: "",
  frequencyType: "",
  occurrences: "1",
  intervalDays: "",
  duration: "",
  durationUnit: "hours",
  participants: "1",
  painPoint: "",
  desiredOutcome: "",
});

/**
 * @typedef {Object} WorkflowIntake
 * @property {1} schemaVersion
 * @property {{name: string, email: string, company: string, role: string}} contact
 * @property {{title: string, description: string, discipline: string, software: string[],
 * revitVersion: string|null, frequency: {type: string, occurrences: number, intervalDays: number|null},
 * manualEffort: {duration: number, unit: 'hours'|'minutes', basis: 'per-person-per-occurrence'},
 * participants: number, painPoint: string, desiredOutcome: string}} workflow
 */

// Client-side UX validation only. M2 must independently validate requests on the server.
export function validateIntake(form) {
  const errors = {};
  for (const [field, limit] of Object.entries(textLimits)) {
    const value = typeof form[field] === "string" ? form[field].trim() : "";
    if (
      ["name", "email", "company", "role", "title", "description"].includes(
        field,
      ) &&
      !value
    )
      errors[field] = "Please complete this field.";
    else if (value.length > limit)
      errors[field] = `Use ${limit} characters or fewer.`;
  }
  if (
    form.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  )
    errors.email = "Enter a valid work email address.";
  if (!disciplines.includes(form.discipline))
    errors.discipline = "Select a discipline.";
  if (!frequencyOptions.includes(form.frequencyType))
    errors.frequencyType = "Select a frequency.";
  if (!["hours", "minutes"].includes(form.durationUnit))
    errors.durationUnit = "Select minutes or hours.";
  if (
    !Array.isArray(form.software) ||
    form.software.some((tool) => !softwareOptions.includes(tool))
  )
    errors.software = "Select tools from the list.";
  for (const [field, max] of [
    ["occurrences", 10000],
    ["participants", 10000],
    ...(form.frequencyType === "custom" ? [["intervalDays", 3650]] : []),
  ]) {
    const value = Number(form[field]);
    if (!Number.isSafeInteger(value) || value < 1 || value > max)
      errors[field] =
        `Enter a whole number from 1 to ${max.toLocaleString("en")}.`;
  }
  const duration = Number(form.duration);
  const maxDuration = form.durationUnit === "minutes" ? 60000 : 1000;
  if (!Number.isFinite(duration) || duration <= 0 || duration > maxDuration)
    errors.duration = `Enter a duration greater than 0 and no more than ${maxDuration.toLocaleString("en")} ${form.durationUnit}.`;
  return errors;
}

/** @returns {WorkflowIntake} Validated, allowlisted data; contains no derived ROI assumptions. */
export function normalizeIntake(form) {
  if (Object.keys(validateIntake(form)).length)
    throw new Error("Invalid workflow intake");
  const trimmed = (key) => form[key].trim();
  return {
    schemaVersion: 1,
    contact: {
      name: trimmed("name"),
      email: trimmed("email"),
      company: trimmed("company"),
      role: trimmed("role"),
    },
    workflow: {
      title: trimmed("title"),
      description: trimmed("description"),
      discipline: form.discipline,
      software: [...new Set(form.software)],
      revitVersion: trimmed("revitVersion") || null,
      frequency: {
        type: form.frequencyType,
        occurrences: Number(form.occurrences),
        intervalDays:
          form.frequencyType === "custom" ? Number(form.intervalDays) : null,
      },
      manualEffort: {
        duration: Number(form.duration),
        unit: form.durationUnit,
        basis: "per-person-per-occurrence",
      },
      participants: Number(form.participants),
      painPoint: trimmed("painPoint"),
      desiredOutcome: trimmed("desiredOutcome"),
    },
  };
}

export function describeFrequency(frequency) {
  const periods = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    "per project": "project",
  };
  return `${frequency.occurrences} occurrence${frequency.occurrences === 1 ? "" : "s"} ${frequency.type === "custom" ? `every ${frequency.intervalDays} days` : `per ${periods[frequency.type]}`}`;
}
