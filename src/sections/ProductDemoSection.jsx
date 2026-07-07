export default function ProductDemoSection() {
  return (
    <section id="demo" className="light-section py-24">
      <div className="section-container grid gap-10 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Workflow demos
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Revit automation demo coming soon
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Short workflow demos will show how BIMCode Solutions approaches sheet automation, tagging, QA checks, exports, and AI-assisted BIM tasks.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
              Sheet automation
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
              QA checks
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700">
              AI-assisted BIM tasks
            </span>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-800/70 dark:bg-slate-950">
          <div className="relative flex aspect-video w-full items-center justify-center bg-slate-100 p-8 text-center dark:bg-slate-900">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Revit automation demo coming soon
              </h3>
              <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
                Short workflow demos will show how BIMCode Solutions approaches sheet automation, tagging, QA checks, exports, and AI-assisted BIM tasks.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
            <span>Production workflow previews</span>
            <span className="text-xs uppercase tracking-[0.25em] text-brand-600 dark:text-brand-300">
              Soon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
