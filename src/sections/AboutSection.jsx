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
            Founder-led BIM automation for Revit-first engineering workflows.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            BIMCode Solutions is a founder-led BIM automation studio focused on Revit-first engineering workflows. The company combines architectural/BIM domain knowledge with Python, pyRevit, Dynamo, Revit API development, and AI-assisted workflows.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            The work is built around practical production needs: documentation, tagging, QA checks, exports, model hygiene, internal toolbars, and handover that BIM teams can actually maintain.
          </p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Revit-first automation aligned with office standards</li>
            <li>• Python, pyRevit, Dynamo, and Revit API development</li>
            <li>• AI-assisted workflows used where they support BIM production</li>
            <li>• Built for BIM managers, MEP teams, and Revit production teams</li>
          </ul>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-2">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 sm:h-32 sm:w-32 md:h-40 md:w-40 dark:bg-slate-900 dark:ring-slate-700">
              <img src={photo} alt="Emin Avdović portrait" className="h-full w-full object-cover" />
            </div>
            <div className="text-center text-sm text-slate-700 dark:text-slate-200">
              <div className="text-base font-semibold">Emin Avdović</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Founder & BIM Automation Architect
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Working directly with engineering teams on Revit production automation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
