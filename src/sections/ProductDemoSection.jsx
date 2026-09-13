import { useLocale } from "../i18n/LocaleProvider.jsx";
import { Link } from "react-router-dom";

const demo = {
  title: "Smart Piping Sheet Generator",
  videoTitle:
    "Revit Automation Demo: Smart Piping Sheet Generator (Production Workflow)",
  youtubeId: "IUdbeoPnSf8",
  description:
    "See a production Revit workflow that automates repetitive piping sheet preparation and documentation steps.",
  tags: ["Revit", "Piping", "Sheet Automation", "Production Workflow"],
};

export default function ProductDemoSection() {
  const { t } = useLocale();
  return (
    <section id="demo" className="light-section py-24">
      <div className="section-container grid gap-10 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            {t("Workflow Demo")}
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {t(demo.title)}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {t(demo.description)}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {demo.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700"
              >
                {t(tag)}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-lg dark:border-slate-800/70 dark:bg-slate-950">
          <iframe
            className="aspect-video w-full border-0"
            src={`https://www.youtube-nocookie.com/embed/${demo.youtubeId}`}
            title={t(demo.videoTitle)}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <div className="px-6 py-4">
            <Link
              to="/audit"
              className="btn-primary inline-flex px-6 py-3 text-sm font-semibold"
            >
              {t("Analyze Your Workflow")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
