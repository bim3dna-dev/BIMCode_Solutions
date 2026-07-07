import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const contactEmail = "bimcodesolutions@gmail.com";
const validIntents = ["audit", "tool", "retainer"];

const initialForm = {
  intent: "audit",
  fullName: "",
  email: "",
  company: "",
  message: "",
};

const intentLabels = {
  audit: "BIM Automation Audit",
  tool: "Custom Tool Development",
  retainer: "Automation Retainer",
};

const buildPayload = (form) => ({
  inquiryType: intentLabels[form.intent] || form.intent,
  intent: form.intent,
  fullName: form.fullName,
  email: form.email,
  company: form.company,
  workflowToAutomate: form.message,
  timestamp: new Date().toISOString(),
  source: "BIMCode Solutions website",
});

const buildMailtoHref = (payload) => {
  const subject = `BIMCode Solutions inquiry: ${payload.inquiryType}`;
  const body = [
    `Inquiry type: ${payload.inquiryType}`,
    `Full name: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Company / team: ${payload.company || "Not provided"}`,
    `Timestamp: ${payload.timestamp}`,
    `Source: ${payload.source}`,
    "",
    "Workflow to automate:",
    payload.workflowToAutomate,
  ].join("\n");

  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export default function ContactSection() {
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const inquiry = new URLSearchParams(location.search).get("inquiry");
    if (validIntents.includes(inquiry)) {
      updateField("intent", inquiry);
    }
  }, [location.search]);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const payload = buildPayload(form);
    const endpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT;

    if (!endpoint) {
      window.location.href = buildMailtoHref(payload);
      setStatus({
        type: "success",
        message: "Your email app should open with the inquiry prefilled. Please send it to complete the request.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Form endpoint responded with ${response.status}`);
      }

      setStatus({
        type: "success",
        message: "Thanks. Your request was sent successfully. We will respond within 2 business days.",
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          "We could not send the form automatically. Please email bimcodesolutions@gmail.com or try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="light-section bg-white py-20 transition dark:bg-slate-950">
      <div className="section-container grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
            Request an automation consultation for your Revit workflow.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            BIMCode Solutions works with BIM Managers, MEP engineering teams, and Revit production teams that need automation audits, custom tool development, or ongoing retainer support.
          </p>
          <div className="mt-8 grid gap-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-sm text-slate-600 shadow-lg dark:border-slate-800/60 dark:bg-[#2b3338]/90 dark:text-slate-300">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Best fit
              </div>
              <p className="mt-2">
                Repetitive documentation, tagging, QA, exports, model checks, internal BIM standards, and team-specific Revit tooling.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Contact
              </div>
              <p className="mt-2">
                bimcodesolutions@gmail.com / Remote delivery / Python, Dynamo, pyRevit, Revit API, and AI-assisted workflows
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200/60 bg-white/90 p-8 shadow-2xl shadow-brand-200/40 ring-1 ring-brand-100 transition dark:border-slate-800/60 dark:bg-[#2b3338]/90 dark:shadow-brand-500/20 dark:ring-brand-500/30"
        >
          <fieldset className="grid grid-cols-3 gap-3 rounded-2xl bg-gradient-to-r from-brand-50 via-white to-slate-50 p-2 text-sm font-semibold text-slate-600 shadow-inner dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-slate-200">
            {[
              ["audit", "Audit"],
              ["tool", "Custom Tool"],
              ["retainer", "Retainer"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl px-3 py-3 text-center transition ${
                  form.intent === value
                    ? "bg-[#4f6a7d] text-white shadow-lg shadow-brand-500/40"
                    : "bg-white text-slate-700 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <input
                  type="radio"
                  name="intent"
                  value={value}
                  checked={form.intent === value}
                  onChange={(event) => updateField("intent", event.target.value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </fieldset>

          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Full Name
              </label>
              <input
                required
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                required
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label htmlFor="company" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Company / Team
              </label>
              <input
                id="company"
                type="text"
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Workflow to automate
              </label>
              <textarea
                required
                id="message"
                rows="5"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                disabled={isSubmitting}
                placeholder="Describe the Revit workflow, production bottleneck, or BIM standard you want to automate. Include the Revit version, team size, and current process if relevant."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-6 w-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Request Automation Consultation"}
          </button>
          {status && (
            <p className={`mt-4 text-center text-sm ${status.type === "error" ? "text-red-600 dark:text-red-300" : "text-brand-600 dark:text-brand-300"}`}>
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
