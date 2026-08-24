import { ArrowRight, HeartHandshake, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../supabaseClient";

type AuthMode = "login" | "signup";
type LocationState = { from?: { pathname?: string } };

export default function Auth({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === "signup";
  const redirectPath = (location.state as LocationState | null)?.from?.pathname || "/student";

  /* While auth session is still resolving, show the same loading screen
     as the rest of the app so there is no flash of the login form
     for users who are already signed in. */
  if (loading) return <div className="auth-loading">Loading your wellbeing space…</div>;

  if (session) return <Navigate to="/student" replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    setSuccess("");
    if (isSignup && password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) setStatus(error.message);
      else if (!data.session) setSuccess("Account created. Check your email to confirm it, then sign in.");
      else navigate("/student", { replace: true });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setStatus(error.message);
      else navigate(redirectPath, { replace: true });
    }
    setSubmitting(false);
  }

  return <main className="auth-page"><section className="auth-intro"><div className="auth-brand"><span className="brand-mark"><HeartHandshake size={20} /></span><strong>MindSync</strong></div><p className="eyebrow">Your wellbeing space</p><h1>A little space<br />to feel heard.</h1><p>Check in with yourself, find steady support, and take each next step at your own pace.</p><div className="auth-quote">“You don&apos;t have to have it all figured out to begin.”</div></section><section className="auth-form-wrap"><div className="auth-form"><p className="eyebrow">Welcome to MindSync</p><h2>{isSignup ? "Create your space." : "Welcome back."}</h2><p className="auth-subtitle">{isSignup ? "A few details and your private space is ready." : "Sign in to continue your wellbeing journey."}</p><form onSubmit={handleSubmit}>{isSignup && <><label className="form-label" htmlFor="name">Your name</label><div className="auth-input"><UserRound size={17} /><input id="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="How should we call you?" /></div></>}<label className="form-label" htmlFor="email">Email address</label><div className="auth-input"><Mail size={17} /><input id="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div><label className="form-label" htmlFor="password">Password</label><div className="auth-input"><LockKeyhole size={17} /><input id="password" required minLength={6} type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></div>{isSignup && <><label className="form-label" htmlFor="confirm-password">Confirm password</label><div className="auth-input"><LockKeyhole size={17} /><input id="confirm-password" required minLength={6} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></div></>}{status && <p className="auth-status" role="alert">{status}</p>}{success && <p className="auth-success" role="status">{success}</p>}<button className="btn btn-primary auth-submit" disabled={submitting} type="submit">{submitting ? "Please wait…" : isSignup ? "Create account" : "Log in"} <ArrowRight size={16} /></button></form><p className="auth-switch">{isSignup ? "Already have an account?" : "New to MindSync?"} <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link></p></div></section></main>;
}
