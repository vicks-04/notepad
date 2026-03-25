import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEFAULT_FORM = {
  name: "",
  email: "",
  password: ""
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fromPath = location.state?.from?.pathname || "/";

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }

      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-hero__brand">
          <div className="auth-hero__logo" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <p className="auth-hero__eyebrow">Cloud Notepad</p>
            <p className="auth-hero__kicker">Notes, tasks, history, and search in one workspace.</p>
          </div>
        </div>

        <div className="auth-hero__content">
          <h1>Calm note taking for teams and deep work.</h1>
          <p className="auth-hero__copy">
            Capture ideas, organize tasks, restore older versions, and keep everything searchable with a focused,
            premium workspace.
          </p>
        </div>

        <div className="auth-hero__metrics" aria-label="Product highlights">
          <article className="auth-metric">
            <strong>Instant search</strong>
            <span>MongoDB text indexing across titles, content, and tags.</span>
          </article>
          <article className="auth-metric">
            <strong>Version restore</strong>
            <span>Recover older note states in seconds without losing context.</span>
          </article>
          <article className="auth-metric">
            <strong>Tasks built in</strong>
            <span>Track follow-ups beside your notes with a clean Google Tasks-style flow.</span>
          </article>
        </div>

        <div className="auth-hero__panel">
          <div className="auth-hero__panel-orb auth-hero__panel-orb--green" aria-hidden="true" />
          <div className="auth-hero__panel-orb auth-hero__panel-orb--blue" aria-hidden="true" />
          <div className="auth-hero__panel-grid" aria-hidden="true" />
          <div className="auth-hero__panel-card">
            <p>Workspace snapshot</p>
            <strong>12 active notes</strong>
            <span>4 pinned · 9 tasks due this week</span>
          </div>
          <div className="auth-hero__panel-card auth-hero__panel-card--muted">
            <p>Autosaved 14s ago</p>
            <strong>Quarterly planning</strong>
            <span>Shared with the product team</span>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Secure access</p>
          <h2>{mode === "login" ? "Welcome back" : "Create your workspace"}</h2>
          <p className="auth-card__copy">
            {mode === "login"
              ? "Sign in to continue writing, reviewing tasks, and opening shared knowledge."
              : "Start with a fast, focused workspace for notes, tasks, and version history."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tabs__button ${mode === "login" ? "auth-tabs__button--active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-tabs__button ${mode === "register" ? "auth-tabs__button--active" : ""}`}
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ada Lovelace"
                required
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          {error ? <div className="auth-form__error">{error}</div> : null}

          <button className="button button--primary button--full" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>

          <p className="auth-form__footnote">
            Protected with JWT authentication and encrypted passwords using bcrypt.
          </p>
        </form>
      </section>
    </div>
  );
}
