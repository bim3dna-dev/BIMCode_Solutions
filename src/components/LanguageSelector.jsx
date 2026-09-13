import { Globe } from "lucide-react";
import { useLocale } from "../i18n/LocaleProvider.jsx";
import { locales } from "../i18n/locale.js";

export default function LanguageSelector({ id }) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label
      htmlFor={id}
      className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"
    >
      <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("Language")}</span>
      <select
        id={id}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="max-w-32 rounded-md border border-slate-300 bg-white px-2 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-950"
      >
        {Object.entries(locales).map(([code, label]) => (
          <option key={code} value={code} lang={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
