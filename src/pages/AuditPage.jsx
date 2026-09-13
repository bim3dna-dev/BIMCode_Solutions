import { localizedFrequency } from "../i18n/locale.js";
import { useLocale } from "../i18n/LocaleProvider.jsx";
import AuditAnalysis from "../features/audit/AuditAnalysis.jsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  createInitialIntake,
  disciplines,
  frequencyOptions,
  normalizeIntake,
  softwareOptions,
  textLimits,
  validateIntake,
} from "../features/audit/workflow.js";

const inputClass =
  "mt-2 block w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-500/40";
const labelClass = "text-sm font-semibold text-slate-700 dark:text-slate-200";
const cardClass =
  "rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800/70 dark:bg-slate-950";

function Field({ name, label, errors, children, hint, required = false }) {
  const { t } = useLocale();
  return (
    <div className="min-w-0">
      <label htmlFor={`audit-${name}`} className={labelClass}>
        {t(label)}
        {required ? t(" *") : t(" (optional)")}
      </label>
      {hint && (
        <p
          id={`audit-${name}-hint`}
          className="mt-1 text-sm text-slate-500 dark:text-slate-400"
        >
          {t(hint)}
        </p>
      )}
      {children}
      {errors[name] && (
        <p
          id={`audit-${name}-error`}
          className="mt-2 text-sm text-red-700 dark:text-red-300"
        >
          {t(errors[name])}
        </p>
      )}
    </div>
  );
}

export default function AuditPage() {
  const { t } = useLocale();
  const [form, setForm] = useState(createInitialIntake);
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const resultHeading = useRef(null);
  const formHeading = useRef(null);
  const editing = useRef(false);

  useEffect(() => {
    if (submission) resultHeading.current?.focus();
    else if (editing.current) {
      formHeading.current?.focus();
      editing.current = false;
    }
  }, [submission]);

  const update = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };
  const controlProps = (name, required = false, hint = false) => ({
    id: `audit-${name}`,
    name,
    value: form[name],
    required,
    onChange: (event) => update(name, event.target.value),
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby":
      [hint && `audit-${name}-hint`, errors[name] && `audit-${name}-error`]
        .filter(Boolean)
        .join(" ") || undefined,
    className: inputClass,
  });
  const textField = (
    name,
    label,
    {
      required = false,
      type = "text",
      multiline = false,
      hint,
      autoComplete,
    } = {},
  ) => (
    <Field
      name={name}
      label={label}
      errors={errors}
      required={required}
      hint={hint}
    >
      {multiline ? (
        <textarea
          {...controlProps(name, required, Boolean(hint))}
          maxLength={textLimits[name]}
          rows={name === "description" ? 5 : 3}
        />
      ) : (
        <input
          {...controlProps(name, required, Boolean(hint))}
          type={type}
          autoComplete={autoComplete}
          maxLength={textLimits[name]}
        />
      )}
    </Field>
  );
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validateIntake(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document.getElementById(`audit-${Object.keys(nextErrors)[0]}`)?.focus(),
      );
      return;
    }
    setSubmission(normalizeIntake(form));
  };

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="light-section py-16 sm:py-20">
        <div className="section-container relative">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500 dark:text-brand-300">
            {t("BIMCode AI Automation Audit")}
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
            {t(
              "Find out what your BIM workflow is costing you — and whether it should be automated.",
            )}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {t(
              "Start with the work your team repeats. BIMCode reviews BIM/Revit workflows for automation potential, time consumed, technical feasibility, potential savings, and suitable implementation approaches.",
            )}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {t(
              "Describe your workflow, review your inputs, and request an assessment; technical analysis identifies opportunities and unknowns. Savings depend on your workflow and its constraints.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={submission ? "#audit-summary" : "#audit-intake"}
              className="btn-primary inline-flex px-6 py-3 text-sm font-semibold"
            >
              {t("Analyze My Workflow")}
            </a>
            <a
              href="#audit-how-it-works"
              className="btn-ghost inline-flex px-6 py-3 text-sm font-semibold"
            >
              {t("How it works")}
            </a>
          </div>
        </div>
      </section>

      <section
        id="audit-how-it-works"
        className="section-container scroll-mt-48 py-12"
      >
        <h2 className="text-2xl font-semibold">
          {t("A practical path from repetitive work to a plan")}
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {t(
            "Describe the work, request an initial technical assessment, and review possible approaches. Numerical ROI reports are planned; manual review is available.",
          )}
        </p>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            [
              "Describe the repetitive workflow",
              "Tell us what happens, how often, and how much manual effort it takes.",
            ],
            [
              "BIMCode analyzes its automation potential",
              "The analysis examines rules, constraints, and suitable tooling.",
            ],
            [
              "Review a technical assessment",
              "Review opportunities, risks, and unknowns. Financial ROI is not calculated yet.",
            ],
          ].map(([title, description], index) => (
            <li key={title} className={cardClass}>
              <p className="text-sm font-semibold text-brand-500 dark:text-brand-300">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{t(title)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(description)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id={submission ? "audit-summary" : "audit-intake"}
        className="section-container scroll-mt-48 py-12 sm:pb-20"
      >
        {submission ? (
          <div className={cardClass}>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500 dark:text-brand-300">
              {t("Workflow preview")}
            </p>
            <h2
              ref={resultHeading}
              tabIndex={-1}
              className="mt-3 scroll-mt-48 text-2xl font-semibold focus:outline-none"
            >
              {t("Review your workflow")}
            </h2>
            <p
              role="status"
              className="mt-3 text-slate-600 dark:text-slate-300"
            >
              {t(
                "Review your inputs below, then choose Analyze Workflow to request an assessment. Editing returns to the form and clears the assessment.",
              )}
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                ["Workflow", submission.workflow.title],
                ["Discipline", t(submission.workflow.discipline)],
                ["Description", submission.workflow.description],
                [
                  "Frequency",
                  localizedFrequency(submission.workflow.frequency, t),
                ],
                [
                  "Manual effort",
                  t("{duration} {unit} per person, per occurrence", {
                    duration: submission.workflow.manualEffort.duration,
                    unit: t(submission.workflow.manualEffort.unit),
                  }),
                ],
                ["Participants", submission.workflow.participants],
                [
                  "Software / tools",
                  submission.workflow.software
                    .map((tool) => t(tool))
                    .join(", ") || t("Not specified"),
                ],
                [
                  "Revit version",
                  submission.workflow.revitVersion || t("Not specified"),
                ],
                [
                  "Primary pain point",
                  submission.workflow.painPoint || t("Not specified"),
                ],
                [
                  "Desired outcome",
                  submission.workflow.desiredOutcome || t("Not specified"),
                ],
                [
                  "Contact",
                  `${submission.contact.name} · ${submission.contact.email}`,
                ],
                [
                  "Company / role",
                  `${submission.contact.company} · ${submission.contact.role}`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {t(label)}
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap break-words text-base">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <AuditAnalysis
              submission={submission}
              onBusyChange={setIsAnalyzing}
            />
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h3 className="text-lg font-semibold">
                {t("Want to discuss this workflow?")}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  "For help validating the assessment or planning implementation, request a manual review using our existing consultation form. Your intake is not transferred to that form; include the workflow details you want to discuss.",
                )}
              </p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "This preview is held only on this page. Refreshing, leaving, or closing the page clears it.",
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  className="btn-ghost px-6 py-3 text-sm font-semibold disabled:opacity-60"
                  onClick={() => {
                    editing.current = true;
                    setSubmission(null);
                  }}
                >
                  {t("Edit workflow")}
                </button>
                <Link
                  to="/?inquiry=audit#contact"
                  className="btn-primary inline-flex px-6 py-3 text-sm font-semibold"
                >
                  {t("Request a Manual Automation Review")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2
              ref={formHeading}
              tabIndex={-1}
              className="scroll-mt-48 text-3xl font-semibold focus:outline-none"
            >
              {t("Describe your workflow")}
            </h2>
            <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
              {t(
                "Estimates are fine. Focus on one repetitive workflow and avoid confidential model or customer information. Fields marked * are required.",
              )}
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "Your draft stays in memory on this page. Reviewing it does not send it. Choosing Analyze Workflow in the next step sends it for analysis. Leaving or refreshing clears the draft.",
              )}
            </p>
            <form onSubmit={submit} noValidate className="mt-8 space-y-6">
              <fieldset className={cardClass}>
                <legend className="px-2 text-lg font-semibold">
                  {t("1. You and your team")}
                </legend>
                <div className="grid gap-6 sm:grid-cols-2">
                  {textField("name", "Full name", {
                    required: true,
                    autoComplete: "name",
                  })}
                  {textField("email", "Work email", {
                    required: true,
                    type: "email",
                    autoComplete: "email",
                  })}
                  {textField("company", "Company", {
                    required: true,
                    autoComplete: "organization",
                  })}
                  {textField("role", "Role", {
                    required: true,
                    autoComplete: "organization-title",
                  })}
                  <Field
                    name="discipline"
                    label={t("Discipline")}
                    errors={errors}
                    required
                  >
                    <select {...controlProps("discipline", true)}>
                      <option value="">{t("Select a discipline")}</option>
                      {disciplines.map((value) => (
                        <option key={value} value={value}>
                          {t(value)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>
              <fieldset className={cardClass}>
                <legend className="px-2 text-lg font-semibold">
                  {t("2. The repetitive work")}
                </legend>
                <div className="space-y-6">
                  {textField("title", "Workflow title", {
                    required: true,
                    hint: "For example: tagging pipework before issuing drawings.",
                  })}
                  {textField(
                    "description",
                    "Describe the repetitive workflow",
                    {
                      required: true,
                      multiline: true,
                      hint: "What starts the task, what steps do you repeat, and what output do you need? Include rules or exceptions that matter.",
                    },
                  )}
                  <fieldset
                    id="audit-software"
                    tabIndex={-1}
                    aria-describedby={
                      errors.software ? "audit-software-error" : undefined
                    }
                  >
                    <legend className={labelClass}>
                      {t("Software / tools (optional, select all that apply)")}
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {softwareOptions.map((tool) => (
                        <label
                          key={tool}
                          className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
                        >
                          <input
                            type="checkbox"
                            name="software"
                            value={tool}
                            checked={form.software.includes(tool)}
                            onChange={(event) =>
                              update(
                                "software",
                                event.target.checked
                                  ? [...form.software, tool]
                                  : form.software.filter(
                                      (value) => value !== tool,
                                    ),
                              )
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                          />
                          {t(tool)}
                        </label>
                      ))}
                    </div>
                    {errors.software && (
                      <p
                        id="audit-software-error"
                        className="mt-2 text-sm text-red-700 dark:text-red-300"
                      >
                        {t(errors.software)}
                      </p>
                    )}
                  </fieldset>
                  {textField("revitVersion", "Revit version", {
                    hint: "If relevant, include the version or versions your team uses.",
                  })}
                </div>
              </fieldset>
              <fieldset className={cardClass}>
                <legend className="px-2 text-lg font-semibold">
                  {t("3. Frequency and manual effort")}
                </legend>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    name="frequencyType"
                    label={t("How often is it performed?")}
                    errors={errors}
                    required
                  >
                    <select {...controlProps("frequencyType", true)}>
                      <option value="">{t("Select a frequency")}</option>
                      {frequencyOptions.map((value) => (
                        <option key={value} value={value}>
                          {t(value)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    name="occurrences"
                    label={t("Occurrences in that period")}
                    errors={errors}
                    required
                    hint={t(
                      "Count workflow repetitions, not the number of people.",
                    )}
                  >
                    <input
                      {...controlProps("occurrences", true, true)}
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                    />
                  </Field>
                  {form.frequencyType === "custom" && (
                    <Field
                      name="intervalDays"
                      label={t("Custom period (days)")}
                      errors={errors}
                      required
                      hint={t("For example: 2 occurrences every 14 days.")}
                    >
                      <input
                        {...controlProps("intervalDays", true, true)}
                        type="number"
                        min="1"
                        max="3650"
                        step="1"
                      />
                    </Field>
                  )}
                  <Field
                    name="duration"
                    label={t("Time per person, per occurrence")}
                    errors={errors}
                    required
                    hint={t(
                      "Approximate active working time for one participant.",
                    )}
                  >
                    <input
                      {...controlProps("duration", true, true)}
                      type="number"
                      min="0"
                      max={form.durationUnit === "minutes" ? "60000" : "1000"}
                      step="any"
                    />
                  </Field>
                  <Field
                    name="durationUnit"
                    label={t("Time unit")}
                    errors={errors}
                    required
                  >
                    <select {...controlProps("durationUnit", true)}>
                      <option value="hours">{t("Hours")}</option>
                      <option value="minutes">{t("Minutes")}</option>
                    </select>
                  </Field>
                  <Field
                    name="participants"
                    label={t("Number of people involved")}
                    errors={errors}
                    required
                    hint={t(
                      "People participating in one occurrence of this workflow.",
                    )}
                  >
                    <input
                      {...controlProps("participants", true, true)}
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                    />
                  </Field>
                </div>
              </fieldset>
              <fieldset className={cardClass}>
                <legend className="px-2 text-lg font-semibold">
                  {t("4. What would improve the work?")}
                </legend>
                <div className="grid gap-6 sm:grid-cols-2">
                  {textField("painPoint", "Primary pain point", {
                    multiline: true,
                  })}
                  {textField("desiredOutcome", "Desired outcome", {
                    multiline: true,
                  })}
                </div>
              </fieldset>
              {Object.values(errors).some(Boolean) && (
                <p
                  role="alert"
                  className="text-sm text-red-700 dark:text-red-300"
                >
                  {t(
                    "Please correct the highlighted fields before reviewing your workflow.",
                  )}
                </p>
              )}
              <div className="flex flex-col items-start gap-3">
                <button
                  type="submit"
                  className="btn-primary px-6 py-3 text-sm font-semibold"
                >
                  {t("Review My Workflow")}
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "Next: review your inputs. This does not generate an AI audit or submit a consultation request.",
                  )}
                </p>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
