import { ArrowLeft, ArrowRight, HeartHandshake, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setStatus("");

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus("Please enter your email address.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

    if (error) {
      console.error("Reset password email error:", error);
      setStatus("We couldn't send the verification code. Please try again.");
      setSubmitting(false);
      return;
    }

    // Navigate to OTP verification screen with the email
    navigate("/verify-otp", { state: { email: normalizedEmail } });
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
          <p className="eyebrow">Password support</p>
          <h2>Forgot your password?</h2>
          <p className="auth-subtitle">
            Enter the email address connected to your MindSync account and we&apos;ll send you a verification code.
          </p>
          <form noValidate onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="reset-email">Email address</label>
            <div className="auth-input">
              <Mail size={17} />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setStatus(""); }}
                placeholder="you@example.com"
              />
            </div>
            {status && <p className="auth-status" role="alert">{status}</p>}
            <button
              className="btn btn-primary auth-submit"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Sending code…" : "Send code"} <ArrowRight size={16} />
            </button>
          </form>
          <p className="auth-switch auth-back-link">
            <Link to="/login"><ArrowLeft size={15} /> Back to login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
