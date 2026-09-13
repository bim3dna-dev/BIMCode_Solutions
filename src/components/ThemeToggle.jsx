import { useLocale } from "../i18n/LocaleProvider.jsx";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider.jsx";

export default function ThemeToggle() {
  const { t } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("Toggle dark mode")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-none text-slate-600 transition hover:text-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-slate-300 dark:hover:text-brand-300"
    >
      {theme === "dark" ? (
        <SunMedium className="h-5 w-5" strokeWidth={1.5} />
      ) : (
        <MoonStar className="h-5 w-5" strokeWidth={1.5} />
      )}
    </button>
  );
}
