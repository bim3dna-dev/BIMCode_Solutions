import { ArrowUpRight } from "lucide-react";
import { solutions } from "../data/content.js";

export default function ProductsPage() {
  return (
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="section-container space-y-10">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Solutions
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
            Solutions for Revit production teams.
          </h1>
          <p className="max-w-3xl text-base text-slate-600 dark:text-slate-300">
            BIMCode Solutions builds workflow-specific automation around the way engineering teams document, check, export, and maintain Revit models.
          </p>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          {solutions.map((solution) => (
            <article
              key={solution.name}
              className="flex h-full flex-col gap-4 bg-transparent p-2 transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {solution.name}
                  </h2>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {solution.description}
                  </p>
                </div>
                <a href="/?inquiry=tool#contact" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-none border border-slate-200 text-slate-600 transition duration-200 hover:-translate-y-[2px] hover:border-brand-400 hover:text-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="sr-only">Discuss {solution.name}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
