import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-white py-20 dark:bg-slate-950">
      <div className="section-container space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
          Not found
        </p>
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
          Page not found.
        </h1>
        <p className="mx-auto max-w-xl text-base text-slate-600 dark:text-slate-300">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          className="btn-primary inline-flex px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
          to="/"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
