import logoPng from "../assets/Logo BIMCode Solutions 4 Final.png";

export default function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />
      <div className="section-container relative flex flex-col-reverse items-center gap-12 py-20 lg:flex-row lg:gap-16 lg:py-28">
        <div className="flex-1">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
            Revit Automation for Engineers
          </p>
          <h1 className="text-4xl font-semibold leading-snug text-slate-900 dark:text-white md:text-5xl lg:text-[3.25rem]">
            Revit automation for engineering teams that need certainty and speed.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Revit-native automation, pyRevit/Python tooling, and AI-assisted workflows that reduce manual work without compromising standards.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="btn-primary px-6 py-3 text-sm font-semibold tracking-wide"
            >
              Talk to an engineer
            </a>
            <a
              href="/#services"
              className="btn-ghost px-6 py-3 text-sm font-semibold tracking-wide"
            >
              See services
            </a>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-6 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-4">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                150+ hours
              </dt>
              <dd>Manual drafting saved each month</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                12x ROI
              </dt>
              <dd>Average automation payback</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                25 countries
              </dt>
              <dd>Projects delivered across the globe</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                BIM-first
              </dt>
              <dd>Deep Revit and automation expertise</dd>
            </div>
          </dl>
        </div>
        <div className="flex w-full max-w-2xl flex-1 items-center justify-end pr-8 md:pr-16 lg:pr-24 xl:pr-32">
          <div className="relative flex h-[26rem] w-[26rem] translate-x-6 items-center justify-center sm:h-[28rem] sm:w-[28rem] sm:translate-x-10 lg:translate-x-14 xl:translate-x-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500/18 via-indigo-400/14 to-slate-900/22 blur-[80px] dark:from-slate-800/28 dark:via-slate-700/22 dark:to-slate-900/38" />
            <img
              src={logoPng}
              alt="BIMCode Solutions logo"
              className="relative h-80 w-80 object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,0.35)] sm:h-96 sm:w-96"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
