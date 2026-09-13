import { useLocale } from "../../i18n/LocaleProvider.jsx";
import { useEffect, useRef, useState } from "react";
import {
  createInterviewClient,
  initialInterviewState,
} from "./interview-client.js";

const engagementLabels = {
  audit: "Automation Audit",
  sprint: "Automation Sprint",
  retainer: "Automation Retainer",
  not_recommended: "Automation is not recommended at this stage",
};

export default function AuditAnalysis({ submission, onBusyChange }) {
  const { t, locale } = useLocale();
  const [state, setState] = useState(initialInterviewState);
  const { busy, error, result, question, questionNumber, started } = state;
  const [answer, setAnswer] = useState("");
  const client = useRef(null);
  const resultHeading = useRef(null);
  const questionHeading = useRef(null);
  useEffect(() => {
    client.current = createInterviewClient({ submission, onChange: setState });
    return () => {
      client.current?.dispose();
      onBusyChange(false);
    };
  }, [submission, onBusyChange]);
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);
  useEffect(() => {
    setAnswer("");
    if (question) questionHeading.current?.focus();
  }, [question?.id]);
  const analyze = () => client.current?.start();
  const restart = () => {
    client.current?.restart();
    setAnswer("");
  };

  return (
    <section
      className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"
      aria-busy={busy}
    >
      {locale !== "en" && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t(
            "AI interview questions and assessments are currently generated in English.",
          )}
        </p>
      )}
      {!result ? (
        <>
          {question ? (
            <div className="max-w-3xl">
              <h3
                ref={questionHeading}
                tabIndex={-1}
                className="scroll-mt-48 text-xl font-semibold focus:outline-none"
              >
                {t("One clarification before the assessment")}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {t("Question {number} of up to 4", { number: questionNumber })}
              </p>
              <label
                htmlFor="diagnostic-answer"
                className="mt-4 block whitespace-pre-wrap break-words font-medium"
                lang="en"
              >
                {question.text}
              </label>
              <textarea
                id="diagnostic-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                maxLength={2000}
                disabled={busy || !!error}
                rows={4}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-600"
              />
              <p className="mt-2 text-sm text-slate-500">
                {t(
                  "Include only workflow details. Leave out confidential or personal information.",
                )}
              </p>
              {!error && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primary px-5 py-3 disabled:opacity-60"
                    disabled={busy || !answer.trim()}
                    onClick={() => client.current?.answer(answer)}
                  >
                    {t("Continue")}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 px-5 py-3 disabled:opacity-60 dark:border-slate-600"
                    disabled={busy}
                    onClick={() => client.current?.answer("", true)}
                  >
                    {t("I don’t know / Skip")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold">
                {t("Get an automation assessment")}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(
                  "Analyze this workflow for technical feasibility, possible approaches, risks, and unknowns. This is a first-pass assessment, not a guarantee or an ROI calculation.",
                )}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "Choosing Analyze Workflow sends your intake to BIMCode's analysis endpoint. Your name, email, company, and role are excluded from the OpenAI request. Workflow text is sent to OpenAI for analysis, so remove confidential or personal information from it first. This does not submit a lead or email anyone.",
                )}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {t(
                  "Workflow details and interview answers are held temporarily for this assessment, for up to 30 minutes.",
                )}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                {t(
                  "We may ask up to four focused questions before generating your assessment. If your workflow is clear, we will proceed directly.",
                )}
              </p>
              <button
                type="button"
                onClick={analyze}
                disabled={busy || !!error}
                className="btn-primary mt-5 px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? t("Analyzing workflow…") : t("Analyze Workflow")}
              </button>
            </>
          )}
          {busy && (
            <p
              role="status"
              className="mt-3 text-sm text-slate-600 dark:text-slate-300"
            >
              {t("Reviewing your workflow. This can take up to a minute.")}
            </p>
          )}
          {error && (
            <button
              type="button"
              disabled={busy}
              onClick={() => client.current?.retry()}
              className="btn-primary mt-4 px-5 py-3"
            >
              {t("Retry")}
            </button>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-700 dark:text-red-300"
            >
              {t(error)}
            </p>
          )}
        </>
      ) : (
        <>
          <h3
            ref={resultHeading}
            tabIndex={-1}
            className="scroll-mt-48 text-2xl font-semibold focus:outline-none"
          >
            {t("Your automation assessment")}
          </h3>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "AI-generated first-pass assessment based on your inputs. Feasibility and the score are estimates, not guarantees or probabilities. No financial ROI has been calculated. A technical review is needed before implementation.",
            )}
          </p>
          <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">
            <span lang="en">{result.summary}</span>
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
            <h4 className="text-lg font-semibold">
              {t("Automation feasibility:")}{" "}
              <span className="capitalize">
                {result.automationFeasibility.level}
              </span>{" "}
              · {result.automationFeasibility.score}/100
            </h4>
            <p className="mt-3 whitespace-pre-wrap break-words">
              <span lang="en">{result.automationFeasibility.rationale}</span>
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {t("Category:")}{" "}
              <span lang="en">{result.workflowClassification.category}</span>
              {t("· Determinism:")} {result.workflowClassification.determinism}{" "}
              {t("· Repetition:")}{" "}
              {result.workflowClassification.repetitionLevel}
            </p>
          </div>
          <h4 className="mt-8 text-xl font-semibold">
            {t("Automation opportunities")}
          </h4>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.automationOpportunities.map((item, index) => (
              <li
                key={index}
                className="min-w-0 rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
              >
                <h5 className="break-words font-semibold">
                  <span lang="en">{item.task}</span>
                </h5>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  <span lang="en">{item.approach}</span>
                </p>
                <p className="mt-3 break-words text-sm text-slate-600 dark:text-slate-300">
                  <span lang="en">{item.technology}</span> {t("· Confidence:")}{" "}
                  {item.confidence}
                </p>
              </li>
            ))}
          </ul>
          {!result.automationOpportunities.length && (
            <p className="mt-3">
              {t(
                "No suitable automation opportunity was identified from these inputs.",
              )}
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">
            {t("Technical approach")}
          </h4>
          <dl className="mt-4 space-y-4">
            {[
              ["Primary approach", "recommendedPrimaryApproach"],
              ["Revit API", "revitApiRole"],
              ["Python / pyRevit", "pythonRole"],
              ["AI reasoning", "aiRole"],
              ["External processing", "externalProcessingRole"],
            ].map(([label, key]) => (
              <div key={key}>
                <dt className="font-semibold">{t(label)}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
                  <span lang="en">{result.technicalArchitecture[key]}</span>
                </dd>
              </div>
            ))}
          </dl>
          <h4 className="mt-8 text-xl font-semibold">
            {t("Risks and mitigations")}
          </h4>
          <ul className="mt-4 space-y-4">
            {result.risks.map((item, index) => (
              <li key={index} className="break-words">
                <p className="font-semibold">
                  <span lang="en">{item.risk}</span> {t("· Severity:")}{" "}
                  {item.severity}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  <span lang="en">{item.mitigation}</span>
                </p>
              </li>
            ))}
          </ul>
          {!result.risks.length && (
            <p className="mt-3">
              {t(
                "No specific risks were identified; this does not mean the workflow is risk-free.",
              )}
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">
            {t("Unknowns to resolve")}
          </h4>
          <ul className="mt-4 list-inside list-disc space-y-2">
            {result.questionsOrUnknowns.map((question, index) => (
              <li key={index} className="break-words">
                <span lang="en">{question}</span>
              </li>
            ))}
          </ul>
          {!result.questionsOrUnknowns.length && (
            <p className="mt-3">
              {t("No further unknowns were identified in this first pass.")}
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">
            {t("Recommended engagement")}
          </h4>
          <p className="mt-3 font-semibold">
            {t(engagementLabels[result.recommendedEngagement.type])}
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
            <span lang="en">{result.recommendedEngagement.rationale}</span>
          </p>
        </>
      )}
      {started && (
        <button
          type="button"
          disabled={busy}
          onClick={restart}
          className="mt-5 rounded-xl border border-slate-300 px-5 py-3 text-sm disabled:opacity-60 dark:border-slate-600"
        >
          {t("Restart interview")}
        </button>
      )}
    </section>
  );
}
