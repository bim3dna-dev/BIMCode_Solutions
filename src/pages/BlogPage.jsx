import { ArrowUpRight } from "lucide-react";
import { blogPosts } from "../data/content.js";

export default function BlogPage() {
  return (
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="section-container space-y-10">
        <header className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-800/60 dark:bg-slate-950">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-brand-500 dark:text-brand-300">
            Blog & notes
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">
            Practical notes for standards-first Revit automation.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
            Early articles on office standards, sensible automation priorities, and pyRevit as an internal tooling layer.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-400/70 dark:border-slate-800/60 dark:bg-slate-950"
            >
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {post.tag}
                </span>
                <span>{post.time}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {post.title}
              </h3>
              {post.hook && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {post.hook}
                </p>
              )}
              <a
                href={post.link}
                className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 transition hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Read <ArrowUpRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
