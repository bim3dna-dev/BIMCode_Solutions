import { services } from "../data/content.js";

export default function CustomizationSection() {
  return (
    <section
      id="services"
      className="light-section py-24"
    >
      <div className="section-container space-y-10">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
            Customization services
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Tailor the automation to your studio.
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Choose a sprint, integration, or enablement path. We keep delivery
            lightweight and documented so your team can own the stack.
          </p>
        </div>
        <div className="grid gap-10 divide-y divide-slate-200/60 md:grid-cols-3 md:divide-y-0 md:divide-x md:gap-10 dark:divide-slate-800/60">
          {services.map((service, index) => (
            <article
              key={service.title}
              className={`flex h-full flex-col gap-4 ${index === 0 ? "" : "pt-6 md:pt-0 md:pl-8"}`}
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {service.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {service.description}
              </p>
              <a
                href={`/?inquiry=${service.intent}#contact`}
                className="btn-primary mt-auto block w-full px-6 py-3 text-center text-xs font-semibold uppercase tracking-[0.25em]"
              >
                Talk to us
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
