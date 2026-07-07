import { Navigate, useParams } from "react-router-dom";
import { blogPosts } from "../data/content.js";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="section-container space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-500 dark:text-brand-300">
          {post.tag} / {post.time}
        </p>
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
          {post.title}
        </h1>
        {post.hook && (
          <p className="text-base text-slate-600 dark:text-slate-300">{post.hook}</p>
        )}
        <div className="space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
          {post.body?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
