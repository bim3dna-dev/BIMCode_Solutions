import { Instagram, Linkedin } from "lucide-react";
import { socialLinks } from "../data/social-links.js";
import { useLocale } from "../i18n/LocaleProvider.jsx";

function Icon({ name }) {
  if (name === "linkedin") return <Linkedin size={19} aria-hidden="true" />;
  if (name === "instagram") return <Instagram size={19} aria-hidden="true" />;
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d={
          name === "x"
            ? "M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-6.5L6.4 22H3.2l7.4-8.5L.8 2h6.4l4.5 6L18.9 2ZM17.8 20h1.7L6.3 3.9H4.5L17.8 20Z"
            : "M15.3 2h4.2l-7.3 12.6L17 23h-4.2L8 14.6 15.3 2ZM4.5 6H.4l2.8 4.8L0 16.4h4.2l3.2-5.6L4.5 6Z"
        }
      />
    </svg>
  );
}
export default function SocialLinks() {
  const { t } = useLocale();
  return (
    <nav aria-label={t("Social media")} className="flex items-center gap-2">
      {socialLinks.map(({ name, url, icon }) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("{name} (opens in a new tab)", { name })}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-slate-100 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-slate-800 dark:hover:text-brand-300"
        >
          <Icon name={icon} />
        </a>
      ))}
    </nav>
  );
}
