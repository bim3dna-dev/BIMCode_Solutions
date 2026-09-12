import { z } from "zod";
import {
  disciplines,
  softwareOptions,
  frequencyOptions,
  textLimits,
  numericLimits,
} from "./audit-options.js";

const text = (key, required = true) =>
  z
    .string()
    .max(textLimits[key])
    .trim()
    .min(required ? 1 : 0);
const count = z.number().int().min(1).max(numericLimits.count);
export const workflowSchema = z.strictObject({
  title: text("title"),
  description: text("description"),
  discipline: z.enum(disciplines),
  software: z
    .array(z.enum(softwareOptions))
    .max(softwareOptions.length)
    .transform((items) => [...new Set(items)]),
  revitVersion: text("revitVersion", false)
    .nullable()
    .transform((value) => value || null),
  frequency: z
    .strictObject({
      type: z.enum(frequencyOptions),
      occurrences: count,
      intervalDays: z
        .number()
        .int()
        .min(1)
        .max(numericLimits.intervalDays)
        .nullable(),
    })
    .superRefine((value, context) => {
      if ((value.type === "custom") !== (value.intervalDays !== null))
        context.addIssue({
          code: "custom",
          path: ["intervalDays"],
          message:
            "Custom frequency requires a day interval; other frequencies require null.",
        });
    }),
  manualEffort: z
    .strictObject({
      duration: z.number().positive().max(numericLimits.minutes),
      unit: z.enum(["hours", "minutes"]),
      basis: z.literal("per-person-per-occurrence"),
    })
    .superRefine((value, context) => {
      if (value.duration > numericLimits[value.unit])
        context.addIssue({
          code: "custom",
          path: ["duration"],
          message: "Duration exceeds the allowed limit.",
        });
    }),
  participants: count,
  painPoint: text("painPoint", false),
  desiredOutcome: text("desiredOutcome", false),
});

export const auditInputSchema = z.strictObject({
  schemaVersion: z.literal(1),
  contact: z.strictObject({
    name: text("name"),
    email: text("email").regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    company: text("company"),
    role: text("role"),
  }),
  workflow: workflowSchema,
});
