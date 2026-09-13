import { useLocale } from "../i18n/LocaleProvider.jsx";
import { benefits } from "../data/content.js";

export default function BenefitsSection() {
  const { t } = useLocale();
  return (
    <section
      id="benefits"
      className="light-section bg-white py-16 dark:bg-slate-950"
    >
      <div className="section-container space-y-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            {t("Why teams choose us")}
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {t("Automation that respects your standards and deadlines.")}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t(
              "Built and maintained for long-running BIM production pipelines.",
            )}
          </p>
        </div>
        <div className="grid gap-6 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-y-0 md:divide-x md:gap-8 dark:divide-slate-800/60">
          {benefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className={`text-sm ${index === 0 ? "" : "pt-6 md:pt-0 md:pl-6"}`}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t(benefit.title)}
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                {t(benefit.description)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
