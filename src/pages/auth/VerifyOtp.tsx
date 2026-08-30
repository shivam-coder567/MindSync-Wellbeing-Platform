import { ArrowLeft, ArrowRight, HeartHandshake } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect back if no email in state
  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setStatus("");

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const code = next.join("");
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent) {
    // Handle backspace — clear current and move to previous
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const prev = [...digits];
      prev[index - 1] = "";
      setDigits(prev);
      inputRefs.current[index - 1]?.focus();
    }

    // Handle Enter
    if (event.key === "Enter") {
      event.preventDefault();
      const code = digits.join("");
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  }

  function handlePaste(event: React.ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    setStatus("");

    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (pasted.length === OTP_LENGTH) {
      handleVerify(pasted);
    }
  }

  async function handleVerify(code?: string) {
    const token = code ?? digits.join("");
    if (token.length !== OTP_LENGTH) return;
    if (submitting) return;

    setStatus("");
    setSubmitting(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (error) {
      console.error("OTP verify error:", error);
      setStatus("That code is invalid or has expired. Please try again or request a new code.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setSubmitting(false);
      return;
    }

    // OTP verified — navigate to reset password screen
    navigate("/reset-password", { state: { email } });
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    setStatus("");

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("Resend OTP error:", error);
      setStatus("We couldn't resend the code. Please try again.");
      return;
    }

    setResendSeconds(60);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  // Mask email for display: "s***@example.com"
  function maskEmail(e: string) {
    const [local, domain] = e.split("@");
    if (!domain) return e;
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***@${domain}`;
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
          <p className="eyebrow">Verify your identity</p>
          <h2>Check your email</h2>
          <p className="auth-subtitle">
            We sent a verification code to<br />
            <strong>{maskEmail(email)}</strong>
          </p>

          <div className="otp-input-group" role="group" aria-label="One-time verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                disabled={submitting}
              />
            ))}
          </div>

          {status && <p className="auth-status" role="alert">{status}</p>}

          <button
            className="btn btn-primary auth-submit"
            disabled={submitting || digits.join("").length !== OTP_LENGTH}
            type="button"
            onClick={() => handleVerify()}
          >
            {submitting ? "Verifying…" : "Verify code"} <ArrowRight size={16} />
          </button>

          <div className="otp-secondary-actions">
            <button
              className="otp-link-btn"
              type="button"
              onClick={handleResend}
              disabled={resendSeconds > 0}
            >
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </button>
            <button
              className="otp-link-btn"
              type="button"
              onClick={() => navigate("/forgot-password")}
            >
              Change email
            </button>
          </div>

          <p className="auth-switch auth-back-link">
            <Link to="/login"><ArrowLeft size={15} /> Back to login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
