import { ArrowUpRight } from "lucide-react";
import { servicePackages } from "../data/content.js";

export default function ProductsSection() {
  return (
    <section
      id="services"
      className="light-section py-24"
    >
      <div className="section-container flex flex-col gap-14">
        <div className="flex flex-col gap-4 text-left md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
              Engagement options
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
              Service packages for Revit automation delivery.
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Scoped consulting engagements delivered directly by the same engineer who defines and implements the workflow.
            </p>
          </div>
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Choose an audit, a focused build sprint, or a team enablement path.
            Every engagement is designed for clear scope, fast execution, and
            maintainable handover.
          </p>
        </div>
        <div className="grid gap-10 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-y-0 md:divide-x dark:divide-slate-800/60">
          {servicePackages.map((service) => (
            <article
              key={service.name}
              className="flex h-full flex-col gap-3 bg-transparent p-4 md:p-6 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {service.name}
                </h3>
                <span className="bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 dark:bg-[#4f6a7d] dark:text-white">
                  {service.timeline}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {service.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-none bg-brand-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <div className="flex items-center gap-3">
                  <button className="btn-primary flex-1 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em]">
                    {service.name === "Automation Audit"
                      ? "Book an audit"
                      : service.name === "Implementation Sprint"
                        ? "Start a sprint"
                        : "Plan enablement"}
                  </button>
                  <button className="inline-flex h-11 w-11 items-center justify-center rounded-none border border-slate-200 text-slate-600 transition transform duration-200 hover:-translate-y-[2px] hover:border-brand-400 hover:text-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200">
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="sr-only">Learn more</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
