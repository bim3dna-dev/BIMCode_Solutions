import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <section className="page-hero">
        <p className="eyebrow">Not found</p>
        <h1>Page not found.</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link className="button button-primary" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
