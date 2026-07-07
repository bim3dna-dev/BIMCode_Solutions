import logoPng from "../assets/Logo BIMCode Solutions 4 Final.png";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/80 py-8 text-sm text-slate-500 transition dark:border-slate-800/70 dark:bg-slate-950/80 dark:text-slate-400">
      <div className="section-container flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <a href="/#hero" className="flex items-center gap-3 transition hover:text-brand-600 dark:hover:text-brand-300">
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
        </a>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-center md:justify-start">
          <a href="/#hero" className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]">
            Home
          </a>
          <a href="/solutions" className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]">
            Solutions
          </a>
          <a href="/case-study" className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]">
            Case Study
          </a>
          <a href="/#about" className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]">
            About
          </a>
          <a href="/#contact" className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]">
            Contact
          </a>
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:bimcodesolutions@gmail.com"
            className="transition hover:text-[#4f6a7d] dark:hover:text-[#9bb6c9]"
          >
            bimcodesolutions@gmail.com
          </a>
        </div>
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} BIMCode Solutions. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
