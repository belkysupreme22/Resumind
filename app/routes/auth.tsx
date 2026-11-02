import { ArrowLeft, ArrowRight, CircleAlert, LogIn, ScanText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Brand from "~/components/Brand";
import ThemeToggle from "~/components/ThemeToggle";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind — Log In" },
  { name: "description", content: "Sign in to your resume workspace with Puter." },
];

const Auth = () => {
  const { isLoading, puterReady, auth, error, clearError } = usePuterStore();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const requestedNext = new URLSearchParams(location.search).get("next") || "/dashboard";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\") && !/^\/auth(?:[/?#]|$)/.test(requestedNext)
    ? requestedNext
    : "/dashboard";
  const reconnect = !puterReady && Boolean(error);
  const waiting = isLoading || !puterReady || isSigningIn;

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next, { replace: true });
  }, [auth.isAuthenticated, next, navigate]);

  const handleSignIn = async () => {
    clearError();
    setIsSigningIn(true);
    try {
      await auth.signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="app-page signin-page">
      <header className="public-header signin-header page-container">
        <Link className="text-button" to="/"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>
        <ThemeToggle />
      </header>
      <div className="signin-layout page-container">
        <section className="signin-brand-panel" aria-label="Resumind">
          <ScanText className="signin-brand-symbol" size={88} strokeWidth={1.25} aria-hidden="true" />
          <Brand />
        </section>
        <section className="signin-card" aria-labelledby="welcome-title">
          <h1 id="welcome-title">Welcome back</h1>
          <p className="signin-description">Sign in to your Resumind workspace.</p>
          <button
            type="button"
            className="auth-button button-emphasis"
            disabled={waiting && !reconnect}
            aria-busy={waiting && !reconnect}
            onClick={reconnect ? () => window.location.reload() : handleSignIn}
          >
            <LogIn size={16} aria-hidden="true" />
            {reconnect ? "Try again" : isSigningIn ? "Signing you in…" : waiting ? "Connecting to Puter…" : "Continue with Puter"}
            {!waiting && <ArrowRight size={16} aria-hidden="true" />}
          </button>
          {error && <p className="signin-error" role="alert"><CircleAlert size={16} aria-hidden="true" /> {reconnect ? "We couldn’t connect to Puter. Please try again." : error}</p>}
          <div className="signin-provider-note"><ShieldCheck size={16} aria-hidden="true" /><p>Puter handles your sign-in. Resumind never asks for your password.</p></div>
          <div className="signin-card-footer"><p>New here? You can create a Puter account in the sign-in window.</p><Link to="/#sample-review">See a sample review <ArrowRight size={14} aria-hidden="true" /></Link></div>
        </section>
      </div>
    </main>
  );
};

export default Auth;
