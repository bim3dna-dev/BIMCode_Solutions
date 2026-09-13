import { useLocale } from "../i18n/LocaleProvider.jsx";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-white py-20 dark:bg-slate-950">
      <div className="section-container space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
          {t("Not found")}
        </p>
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
          {t("Page not found.")}
        </h1>
        <p className="mx-auto max-w-xl text-base text-slate-600 dark:text-slate-300">
          {t("The page you are looking for does not exist or has been moved.")}
        </p>
        <Link
          className="btn-primary inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
          to="/"
        >
          {t("Return home")}
        </Link>
      </div>
    </section>
  );
}
