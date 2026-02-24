import { outcomes } from "../data/content.js";

export default function OutcomesSection() {
  return (
    <section className="light-section bg-white py-20 dark:bg-slate-950">
      <div className="section-container space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Proof / Outcomes
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Example automation outcomes from real delivery workflows.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {outcomes.map((item) => (
            <article
              key={item.title}
              className="space-y-4 border border-slate-200/70 bg-white/80 p-6 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Problem: </span>
                {item.challenge}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Automation: </span>
                {item.automation}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Result: </span>
                {item.result}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
