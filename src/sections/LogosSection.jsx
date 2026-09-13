import { useLocale } from "../i18n/LocaleProvider.jsx";
import { partnerLogos } from "../data/content.js";

export default function LogosSection() {
  const { t } = useLocale();
  const logos = [...partnerLogos, ...partnerLogos];

  return (
    <section className="border-y border-slate-200/60 bg-slate-50/70 py-16 dark:border-slate-800/60 dark:bg-slate-900/30">
      <div className="section-container">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.6em] text-slate-500 dark:text-slate-400">
          {t("Trusted by forward-thinking studios & builders")}
        </p>
        <div className="relative mt-10 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-50 via-slate-50/60 to-transparent dark:from-slate-900 dark:via-slate-950/60" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 via-slate-50/60 to-transparent dark:from-slate-900 dark:via-slate-950/60" />
          <div className="flex min-w-max animate-marquee gap-12 whitespace-nowrap text-base font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            {logos.map((name, index) => (
              <span key={`${name}-${index}`} className="text-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
