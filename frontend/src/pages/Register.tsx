import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import BrandMark from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";

type Step = "details" | "verify";

const PASSWORD_MIN_LENGTH = 8;

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
  const { startRegister, completeRegister, resendRegisterCode, token, user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleStart(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setHint(null);

    if (!syncPasswordValidation(password, confirmPassword, true)) {
      return;
    }

    setSubmitting(true);

    try {
      const started = await startRegister({
        email,
        password,
        full_name: fullName || undefined,
      });
      setDebugCode(started.debug_code ?? null);
      setHint(started.message);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start registration");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await completeRegister(email, code.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setSubmitting(true);
    setError(null);

    try {
      const started = await resendRegisterCode(email);
      setDebugCode(started.debug_code ?? null);
      setHint(started.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
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
          {step === "details" ? (
            <>
              <h2>Create account</h2>
              <form onSubmit={handleStart} className="auth-form" noValidate>
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
                  {submitting ? "Sending code..." : "Send verification code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>Check your inbox</h2>
              <p className="subtitle">
                Enter the code sent to <strong>{email}</strong>
              </p>
              <form onSubmit={handleVerify} className="auth-form">
                <label>
                  Verification code
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    required
                    autoFocus
                  />
                </label>
                {hint && <p className="auth-verify-hint">{hint}</p>}
                {debugCode ? (
                  <p className="auth-debug-code">
                    Your code: <strong>{debugCode}</strong>
                  </p>
                ) : null}
                {error && (
                  <p className="error" role="alert" aria-live="polite">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={submitting || code.length !== 6}>
                  {submitting ? "Verifying..." : "Verify & create account"}
                </button>
              </form>
              <div className="auth-verify-actions">
                <button type="button" className="linkish" onClick={handleResend} disabled={submitting}>
                  Resend code
                </button>
                <button
                  type="button"
                  className="linkish"
                  onClick={() => {
                    setStep("details");
                    setCode("");
                    setError(null);
                    setPasswordError(null);
                    setConfirmError(null);
                    setHint(null);
                    setDebugCode(null);
                  }}
                  disabled={submitting}
                >
                  Edit details
                </button>
              </div>
            </>
          )}
          <p className="footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
