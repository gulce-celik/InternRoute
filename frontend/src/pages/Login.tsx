import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import BrandMark from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login, token, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-page">
        <p className="muted">Loading your session...</p>
      </div>
    );
  }

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-hero-badge">YZTA Bootcamp &apos;26</span>
          <h1>Stop losing track of applications.</h1>
          <p>
            InternRoute is your personal board for internships — save roles, tailor CVs, prep for
            interviews.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-brand">
            <BrandMark />
            <div>
              <p className="auth-brand-name">InternRoute</p>
              <p className="auth-brand-tag">student career kit</p>
            </div>
          </div>
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to continue your application journey</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="footer-link">
            New here? <Link to="/register">Create your free account</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
