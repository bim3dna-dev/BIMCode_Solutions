import photo from "../assets/me.jpg";

export default function AboutSection() {
  return (
    <section id="about" className="light-section bg-white py-20 dark:bg-slate-950">
      <div className="section-container grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            About BIMCode Solutions
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Automation partners for Revit-first engineering teams.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            BIMCode Solutions designs and delivers Revit-native automation that helps engineering
            teams move faster without sacrificing standards, model health, or review discipline.
            Every solution is built to be explicit, testable, and maintainable inside real production
            environments.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            BIMCode Solutions is a founder-led automation studio, delivering senior-level Revit automation directly - no handoffs, no black boxes.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>- Revit API and pyRevit automation aligned with project standards</li>
            <li>- Python-based tooling for QA, compliance, and repeatable delivery</li>
            <li>- AI-assisted workflows that support engineers instead of replacing judgment</li>
            <li>- Designed to integrate cleanly, documented clearly, and owned by the teams that use it</li>
          </ul>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-2">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-32 sm:w-32 md:h-40 md:w-40 dark:bg-slate-900 dark:ring-slate-700">
              <img src={photo} alt="Emin Avdovic portrait" className="h-full w-full object-cover" />
            </div>
            <div className="text-center text-sm text-slate-700 dark:text-slate-200">
              <div className="text-base font-semibold">Emin Avdovic</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Founder - Revit Automation Engineer
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Working directly with engineering teams across Europe.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
