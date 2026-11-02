import { ArrowLeft, ScanText } from "lucide-react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import Brand from "~/components/Brand";
import { usePuterStore } from "~/lib/puter";

const Protected = () => {
  const { auth, isLoading, puterReady, error } = usePuterStore();
  const location = useLocation();

  if (!puterReady || isLoading) {
    return (
      <main className="app-page session-page">
        <Brand />
        <div className="session-message" role={error ? "alert" : "status"}>
          <ScanText size={24} aria-hidden="true" />
          <h1>{error ? "Let’s reconnect." : "Opening your workspace…"}</h1>
          <p>{error ? "We couldn’t connect to Puter. Refresh the page to try again." : "Your saved reviews will be here in a moment."}</p>
          {error && <Link to="/" className="text-button"><ArrowLeft size={16} aria-hidden="true" /> Back to home</Link>}
        </div>
      </main>
    );
  }

  if (!auth.isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?next=${next}`} replace />;
  }

  return <Outlet />;
};

export default Protected;
