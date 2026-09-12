import { useEffect, useRef, useState } from "react";
import { auditResultSchema } from "../../../shared/audit-result.js";

const genericError =
  "Analysis is temporarily unavailable. Your workflow details have not been lost; please try again.";
const errorMessages = {
  INVALID_INPUT:
    "Please edit your workflow and check the required fields and numeric values.",
  PAYLOAD_TOO_LARGE: "Please shorten your workflow description and try again.",
  RATE_LIMITED: "Analysis is busy. Please wait a minute before trying again.",
  ANALYSIS_REFUSED:
    "We could not assess this workflow. Please edit its description or request a manual review.",
};
const engagementLabels = {
  audit: "Automation Audit",
  sprint: "Automation Sprint",
  retainer: "Automation Retainer",
  not_recommended: "Automation is not recommended at this stage",
};

export default function AuditAnalysis({ submission, onBusyChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const controller = useRef(null);
  const resultHeading = useRef(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      onBusyChange(false);
    },
    [onBusyChange],
  );
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  const analyze = async () => {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    onBusyChange(true);
    setError("");
    const timer = setTimeout(() => request.abort(), 55000);
    try {
      const response = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: request.signal,
      });
      const body = await response.json();
      if (!response.ok) {
        setError(errorMessages[body?.error?.code] || genericError);
        return;
      }
      const parsed = auditResultSchema.safeParse(body?.result);
      if (!parsed.success) throw new Error("Invalid assessment");
      setResult(parsed.data);
    } catch {
      setError(genericError);
    } finally {
      clearTimeout(timer);
      controller.current = null;
      setBusy(false);
      onBusyChange(false);
    }
  };

  return (
    <section
      className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800"
      aria-busy={busy}
    >
      {!result ? (
        <>
          <h3 className="text-xl font-semibold">
            Get an automation assessment
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Analyze this workflow for technical feasibility, possible
            approaches, risks, and unknowns. This is a first-pass assessment,
            not a guarantee or an ROI calculation.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Choosing Analyze Workflow sends your intake to BIMCode's analysis
            endpoint. Your name, email, company, and role are excluded from the
            OpenAI request. Workflow text is sent to OpenAI for analysis, so
            remove confidential or personal information from it first. This does
            not submit a lead or email anyone.
          </p>
          <button
            type="button"
            onClick={analyze}
            disabled={busy}
            className="btn-primary mt-5 px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Analyzing workflow…" : "Analyze Workflow"}
          </button>
          {busy && (
            <p
              role="status"
              className="mt-3 text-sm text-slate-600 dark:text-slate-300"
            >
              Reviewing your workflow. This can take up to a minute.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-3 text-sm text-red-700 dark:text-red-300"
            >
              {error}
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
            Your automation assessment
          </h3>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            AI-generated first-pass assessment based on your inputs. Feasibility
            and the score are estimates, not guarantees or probabilities. No
            financial ROI has been calculated. A technical review is needed
            before implementation.
          </p>
          <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">
            {result.summary}
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
            <h4 className="text-lg font-semibold">
              Automation feasibility:{" "}
              <span className="capitalize">
                {result.automationFeasibility.level}
              </span>{" "}
              · {result.automationFeasibility.score}/100
            </h4>
            <p className="mt-3 whitespace-pre-wrap break-words">
              {result.automationFeasibility.rationale}
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Category: {result.workflowClassification.category} · Determinism:{" "}
              {result.workflowClassification.determinism} · Repetition:{" "}
              {result.workflowClassification.repetitionLevel}
            </p>
          </div>
          <h4 className="mt-8 text-xl font-semibold">
            Automation opportunities
          </h4>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.automationOpportunities.map((item, index) => (
              <li
                key={index}
                className="min-w-0 rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
              >
                <h5 className="break-words font-semibold">{item.task}</h5>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {item.approach}
                </p>
                <p className="mt-3 break-words text-sm text-slate-600 dark:text-slate-300">
                  {item.technology} · Confidence: {item.confidence}
                </p>
              </li>
            ))}
          </ul>
          {!result.automationOpportunities.length && (
            <p className="mt-3">
              No suitable automation opportunity was identified from these
              inputs.
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">Technical approach</h4>
          <dl className="mt-4 space-y-4">
            {[
              ["Primary approach", "recommendedPrimaryApproach"],
              ["Revit API", "revitApiRole"],
              ["Python / pyRevit", "pythonRole"],
              ["AI reasoning", "aiRole"],
              ["External processing", "externalProcessingRole"],
            ].map(([label, key]) => (
              <div key={key}>
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
                  {result.technicalArchitecture[key]}
                </dd>
              </div>
            ))}
          </dl>
          <h4 className="mt-8 text-xl font-semibold">Risks and mitigations</h4>
          <ul className="mt-4 space-y-4">
            {result.risks.map((item, index) => (
              <li key={index} className="break-words">
                <p className="font-semibold">
                  {item.risk} · Severity: {item.severity}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                  {item.mitigation}
                </p>
              </li>
            ))}
          </ul>
          {!result.risks.length && (
            <p className="mt-3">
              No specific risks were identified; this does not mean the workflow
              is risk-free.
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">Unknowns to resolve</h4>
          <ul className="mt-4 list-inside list-disc space-y-2">
            {result.questionsOrUnknowns.map((question, index) => (
              <li key={index} className="break-words">
                {question}
              </li>
            ))}
          </ul>
          {!result.questionsOrUnknowns.length && (
            <p className="mt-3">
              No further unknowns were identified in this first pass.
            </p>
          )}
          <h4 className="mt-8 text-xl font-semibold">Recommended engagement</h4>
          <p className="mt-3 font-semibold">
            {engagementLabels[result.recommendedEngagement.type]}
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-slate-600 dark:text-slate-300">
            {result.recommendedEngagement.rationale}
          </p>
        </>
      )}
    </section>
  );
}
