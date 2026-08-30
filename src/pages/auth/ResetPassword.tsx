import { ArrowLeft, ArrowRight, HeartHandshake, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setStatus("");
    setSuccess("");

    if (password.length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // Check that a recovery session exists (set by verifyOtp)
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setStatus("Your verification has expired. Please start the password reset process again.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Update password error:", error);
      setStatus("We couldn't update your password. Please try again.");
      setSubmitting(false);
      return;
    }

    setSuccess("Password updated");
    setSubmitting(false);
  }

  function handleBackToLogin() {
    // Sign out of the recovery session so the user lands cleanly on the login page
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
    navigate("/login", { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand">
          <span className="brand-mark"><HeartHandshake size={20} /></span>
          <strong>MindSync</strong>
        </div>
        <p className="eyebrow">Your wellbeing space</p>
        <h1>A little space<br />to feel heard.</h1>
        <p>Check in with yourself, find steady support, and take each next step at your own pace.</p>
        <div className="auth-quote">&ldquo;You don&apos;t have to have it all figured out to begin.&rdquo;</div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          {success ? (
            <>
              <p className="eyebrow">Password support</p>
              <h2>Password updated</h2>
              <p className="auth-subtitle">Your MindSync password has been changed.</p>
              <div className="otp-success-state">
                <div className="otp-success-icon">✓</div>
                <button
                  className="btn btn-primary auth-submit"
                  type="button"
                  onClick={handleBackToLogin}
                >
                  Back to login <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow">Password support</p>
              <h2>Create a new password</h2>
              <p className="auth-subtitle">
                {email
                  ? <>Choose a new password for <strong>{email}</strong>.</>
                  : "Choose a new password for your MindSync account."}
              </p>
              <form noValidate onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="new-password">New password</label>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  id="new-password"
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setStatus(""); }}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label className="form-label" htmlFor="confirm-new-password">Confirm password</label>
              <div className="auth-input">
                <LockKeyhole size={17} />
                <input
                  id="confirm-new-password"
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => { setConfirmPassword(event.target.value); setStatus(""); }}
                  placeholder="Enter your new password again"
                />
              </div>

              {status && <p className="auth-status" role="alert">{status}</p>}
              <button
                className="btn btn-primary auth-submit"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Updating…" : "Update password"} <ArrowRight size={16} />
              </button>
              </form>
            </>
          )}

          {!success && (
            <p className="auth-switch auth-back-link">
              <Link to="/forgot-password"><ArrowLeft size={15} /> Back to login</Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
