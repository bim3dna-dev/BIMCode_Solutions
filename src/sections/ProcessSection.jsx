const steps = [
  {
    number: "1",
    title: "Diagnose",
    description:
      "Review the Revit workflow, BIM standards, templates, and production bottlenecks.",
  },
  {
    number: "2",
    title: "Build",
    description:
      "Develop a focused automation tool or workflow using pyRevit, Python, Dynamo, Revit API, or AI-assisted methods where appropriate.",
  },
  {
    number: "3",
    title: "Handover",
    description:
      "Package, document, test, and hand over the tool so the team can operate it without dependency on hidden scripts.",
  },
];

export default function ProcessSection() {
  return (
    <section className="light-section py-16">
      <div className="section-container space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Process
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            How an engagement works
          </h2>
        </div>
        <div className="grid gap-6 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-slate-800/60">
          {steps.map((step, index) => (
            <article key={step.title} className={`space-y-3 ${index === 0 ? "" : "pt-6 md:pl-8 md:pt-0"}`}>
              <div className="flex h-9 w-9 items-center justify-center bg-[#4f6a7d] text-sm font-semibold text-white">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
