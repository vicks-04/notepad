import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="app-status">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="button button--primary" to="/">
        Go home
      </Link>
    </div>
  );
}

