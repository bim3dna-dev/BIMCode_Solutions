const implementedWorkflows = [
  "Pipe and duct tagging automation",
  "Sheet and PDF export tooling",
  "Model QA checks",
  "Scope-based model extraction and testing",
  "AI-assisted drawing scanner prototype",
  "Internal toolbar deployment workflow",
];

const technicalStack = [
  "Revit API",
  "pyRevit",
  "Python",
  "Dynamo",
  "Git/GitHub release workflow",
  "YOLO/OpenCV experiments for drawing recognition",
];

const automationModules = [
  "Smart pipe and duct tagging",
  "Sheet and PDF export automation",
  "Model QA and parameter checks",
  "Scope-based extraction and testing",
  "AI-assisted drawing scanner prototype",
  "Internal pyRevit toolbar deployment",
];

export default function CaseStudyPage() {
  return (
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="section-container space-y-12">
        <header className="max-w-4xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Case Study
          </p>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
            Internal BIM Automation Toolkit for Revit Production Teams
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            A standards-first automation approach for repetitive Revit production workflows.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-2">
          <article className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Problem
            </h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              BIM teams lose time on repetitive production tasks: tagging, checking, exports, sheet setup, and model hygiene. These tasks often depend on manual consistency, project-specific standards, and senior staff attention.
            </p>
          </article>
          <article className="space-y-3">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Solution
            </h2>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
              BIMCode Solutions developed a Revit-native automation approach using a custom pyRevit-based toolbar and supporting Python workflows. The focus was not generic automation, but production tools aligned with BIM standards, project templates, and repeatable delivery processes.
            </p>
          </article>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <article>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Implemented workflows
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {implementedWorkflows.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 bg-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Technical stack
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {technicalStack.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 bg-brand-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <section className="space-y-5 border-t border-slate-200/70 pt-10 dark:border-slate-800/70">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Automation modules represented in this toolkit
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {automationModules.map((module) => (
              <article
                key={module}
                className="border border-slate-200/70 bg-white p-5 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-800/70 dark:bg-slate-950 dark:text-slate-100"
              >
                {module}
              </article>
            ))}
          </div>
        </section>

        <article className="max-w-4xl space-y-3 border-t border-slate-200/70 pt-10 dark:border-slate-800/70">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Outcome
          </h2>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Reduced repetitive production steps, improved workflow consistency, and created a reusable automation framework for future BIM workflows.
          </p>
          <a href="/?inquiry=tool#contact" className="btn-primary inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]">
            Request Automation Consultation
          </a>
        </article>
      </div>
    </section>
  );
}
