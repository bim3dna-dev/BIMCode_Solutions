import { processSteps } from "../data/content.js";

export default function ProcessSection() {
  return (
    <section id="process" className="light-section py-20">
      <div className="section-container space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Process
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            A simple delivery model designed to keep scope clear and implementation fast.
          </h2>
        </div>
        <div className="grid gap-6 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-slate-800/60">
          {processSteps.map((step, index) => (
            <article
              key={step.title}
              className={`space-y-3 text-sm ${index === 0 ? "" : "pt-6 md:pl-6 md:pt-0"}`}
            >
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-300">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
