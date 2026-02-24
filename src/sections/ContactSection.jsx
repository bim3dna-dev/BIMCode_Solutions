import { useState } from "react";

const FORMSPREE_FORM_ID = "YOUR_FORM_ID";

const initialForm = {
  intent: "business",
  fullName: "",
  email: "",
  company: "",
  message: "",
};

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validate = () => {
    if (!form.fullName.trim()) {
      return "Please enter your full name.";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      return "Please add a short message about your workflow.";
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);

    const validationError = validate();
    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    if (FORMSPREE_FORM_ID === "YOUR_FORM_ID") {
      setStatus({
        type: "error",
        message: "Set FORMSPREE_FORM_ID in ContactSection before using live submissions.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        intent: form.intent,
        fullName: form.fullName,
        email: form.email,
        company: form.company,
        message: form.message,
      };

      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus({
        type: "success",
        message: "Thanks, message received. You will hear back within 48 hours.",
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: "Submission failed. Please try again or email bimcodesolutions@gmail.com.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="light-section bg-white py-20 transition dark:bg-slate-950"
    >
      <div className="section-container grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
            Tell us about your workflow and where automation should help.
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Whether you need a targeted pyRevit/Python automation, a scoped implementation sprint,
            or team enablement support, every engagement is aligned to measurable delivery outcomes.
          </p>
          <div className="mt-8 grid gap-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-sm text-slate-600 shadow-lg dark:border-slate-800/60 dark:bg-[#2b3338]/90 dark:text-slate-300">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Response Window
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                48 hours
              </div>
              <p className="mt-1">
                You will hear from a human specialist with domain expertise.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Preferred Channels
              </div>
              <p className="mt-2">
                bimcodesolutions@gmail.com - Revit/Python automation - Remote delivery
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200/60 bg-white/90 p-8 shadow-2xl shadow-brand-200/40 ring-1 ring-brand-100 transition dark:border-slate-800/60 dark:bg-[#2b3338]/90 dark:shadow-brand-500/20 dark:ring-brand-500/30"
        >
          <fieldset className="grid grid-cols-2 gap-3 rounded-2xl bg-gradient-to-r from-brand-50 via-white to-slate-50 p-2 text-sm font-semibold text-slate-600 shadow-inner dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-slate-200">
            <label
              className={`cursor-pointer rounded-xl px-4 py-3 text-center transition ${
                form.intent === "business"
                  ? "bg-[#4f6a7d] text-white shadow-lg shadow-brand-500/40"
                  : "bg-white text-slate-700 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="intent"
                value="business"
                checked={form.intent === "business"}
                onChange={(event) => updateField("intent", event.target.value)}
                className="sr-only"
              />
              Business Inquiry
            </label>
            <label
              className={`cursor-pointer rounded-xl px-4 py-3 text-center transition ${
                form.intent === "career"
                  ? "bg-[#4f6a7d] text-white shadow-lg shadow-brand-400/40"
                  : "bg-white text-slate-700 hover:bg-brand-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="intent"
                value="career"
                checked={form.intent === "career"}
                onChange={(event) => updateField("intent", event.target.value)}
                className="sr-only"
              />
              Careers
            </label>
          </fieldset>

          <div className="mt-6 grid gap-5">
            <div>
              <label
                htmlFor="fullName"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
              >
                Full Name
              </label>
              <input
                required
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
              >
                Email
              </label>
              <input
                required
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label
                htmlFor="company"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
              >
                {form.intent === "business" ? "Company / Studio" : "Portfolio or LinkedIn"}
              </label>
              <input
                id="company"
                type="text"
                value={form.company}
                onChange={(event) => updateField("company", event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400"
              >
                How can we help?
              </label>
              <textarea
                required
                id="message"
                rows="4"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Tell us about your current workflow, your standards, and the delivery outcome you want."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-brand-300 dark:focus:ring-brand-500/40"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-6 w-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Start a conversation"}
          </button>
          {status && (
            <p
              className={`mt-4 text-center text-sm ${
                status.type === "success"
                  ? "text-brand-600 dark:text-brand-300"
                  : "text-red-600 dark:text-red-300"
              }`}
            >
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
