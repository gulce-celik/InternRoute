import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import BrandMark from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";

const PASSWORD_MIN_LENGTH = 8;
const SUCCESS_REDIRECT_MS = 2500;

function getPasswordError(password: string, force: boolean): string | null {
  if (!force && password.length === 0) {
    return null;
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

function getConfirmError(password: string, confirmPassword: string, force: boolean): string | null {
  if (!force && confirmPassword.length === 0) {
    return null;
  }
  if (confirmPassword.length === 0) {
    return "Confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}

export default function RegisterPage() {
  const { register, token, user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  function syncPasswordValidation(
    nextPassword: string,
    nextConfirm: string,
    force = false,
  ): boolean {
    const nextPasswordError = getPasswordError(nextPassword, force);
    const nextConfirmError = getConfirmError(nextPassword, nextConfirm, force);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    return !nextPasswordError && !nextConfirmError;
  }

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, SUCCESS_REDIRECT_MS);
    return () => window.clearTimeout(timer);
  }, [showSuccess, navigate]);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <section className="auth-hero">
            <span className="auth-hero-badge">Free for students</span>
            <h1>Your first step toward the offer letter.</h1>
            <p>
              Create an account, pin your target roles, and build a pipeline that actually makes
              sense.
            </p>
          </section>
          <section className="auth-card" aria-busy="true">
            <div className="auth-brand">
              <BrandMark />
              <div>
                <p className="auth-brand-name">InternRoute</p>
                <p className="auth-brand-tag">student career kit</p>
              </div>
            </div>
            <h2>Create account</h2>
            <p className="subtitle muted">Loading your session...</p>
          </section>
        </div>
      </div>
    );
  }

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!syncPasswordValidation(password, confirmPassword, true)) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        email,
        password,
        full_name: fullName || undefined,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-hero-badge">Free for students</span>
          <h1>Your first step toward the offer letter.</h1>
          <p>
            Create an account, pin your target roles, and build a pipeline that actually makes
            sense.
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
          <h2>Create account</h2>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </label>
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
                onChange={(e) => {
                  const next = e.target.value;
                  setPassword(next);
                  syncPasswordValidation(next, confirmPassword);
                }}
                onBlur={() => syncPasswordValidation(password, confirmPassword)}
                minLength={PASSWORD_MIN_LENGTH}
                required
                aria-invalid={passwordError ? true : undefined}
                aria-describedby={passwordError ? "register-password-error" : undefined}
              />
              {passwordError ? (
                <span id="register-password-error" className="field-error" role="alert">
                  {passwordError}
                </span>
              ) : null}
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  const next = e.target.value;
                  setConfirmPassword(next);
                  syncPasswordValidation(password, next);
                }}
                onBlur={() => syncPasswordValidation(password, confirmPassword)}
                minLength={PASSWORD_MIN_LENGTH}
                required
                aria-invalid={confirmError ? true : undefined}
                aria-describedby={confirmError ? "register-confirm-error" : undefined}
              />
              {confirmError ? (
                <span id="register-confirm-error" className="field-error" role="alert">
                  {confirmError}
                </span>
              ) : null}
            </label>
            {error && (
              <p className="error" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </div>

      {showSuccess ? (
        <div className="auth-success-overlay" role="presentation">
          <div
            className="auth-success-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-success-title"
            aria-describedby="register-success-body"
          >
            <h2 id="register-success-title">Account created</h2>
            <p id="register-success-body">
              Your account is ready. You will be taken to the sign-in page so you can log in.
            </p>
            <button type="button" onClick={() => navigate("/login", { replace: true })}>
              Continue to sign in
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
