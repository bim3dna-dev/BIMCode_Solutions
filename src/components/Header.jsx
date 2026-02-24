import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import ThemeToggle from "./ThemeToggle.jsx";
import logoPng from "../assets/Logo BIMCode Solutions 4 Final.png";

const navItems = [
  { label: "Services", to: "/#services" },
  { label: "Process", to: "/#process" },
  { label: "About", to: "/#about" },
  { label: "Contact", to: "/#contact" },
];

export default function Header() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md transition dark:border-slate-800/70 dark:bg-slate-950/85">
      <div className="section-container flex items-center justify-between py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <img
            src={logoPng}
            alt="BIMCode Solutions logo"
            className="h-10 w-10 rounded-xl border border-slate-200 shadow-sm dark:border-slate-700"
          />
          <div className="leading-tight text-sm font-semibold tracking-[0.08em] text-slate-700 dark:text-slate-200">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              BIMCode <span className="font-semibold text-slate-600 dark:text-slate-300">Solutions</span>
            </span>
            <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              Revit + Python + AI automation
            </div>
          </div>
        </NavLink>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.to}
              className="px-3 py-2 transition hover:text-[#4f6a7d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:hover:text-[#9bb6c9]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
