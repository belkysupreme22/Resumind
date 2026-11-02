import type { Route } from "./+types/dashboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, CircleAlert, FileWarning, ScanText, Trash2, Upload } from "lucide-react";
import ResumeCard from "~/components/ResumeCard";
import NavBar from "~/components/Navbar";
import WorkspaceState from "~/components/WorkspaceState";
import { readSavedReview } from "~/lib/reviews";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Your reviews — Resumind" }, { name: "description", content: "Your saved resumes and feedback." }];
}

type ReviewEntry = { kvKey: string; resume?: Resume };

export default function Dashboard() {
  const { kv, fs } = usePuterStore();
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const request = useRef(0);
  const hadReviews = useRef(false);

  const loadReviews = useCallback(async () => {
    const current = ++request.current;
    setStatus("loading");
    try {
      const stored = await kv.list("resume:*", true);
      if (!Array.isArray(stored) || !stored.every((item) => typeof item === "object" && item !== null && typeof item.key === "string" && typeof item.value === "string")) throw new Error("Reviews unavailable");
      const entries: ReviewEntry[] = (stored as KVItem[]).map((item) => {
        try { return { kvKey: item.key, resume: readSavedReview(item.value) }; }
        catch { return { kvKey: item.key }; }
      });
      if (current !== request.current) return;
      if (entries.length) hadReviews.current = true;
      setReviews(entries);
      setStatus("ready");
    } catch {
      if (current === request.current) setStatus("error");
    }
  }, [kv]);

  useEffect(() => {
    void loadReviews();
    return () => { request.current++; };
  }, [loadReviews]);

  const deleteReview = async (entry: ReviewEntry) => {
    if (deletingKey) return;
    setDeletingKey(entry.kvKey);
    setDeleteError("");
    try {
      const deleted = await kv.del(entry.kvKey);
      if (!deleted) throw new Error("Delete failed");
      setReviews((current) => current.filter((item) => item.kvKey !== entry.kvKey));
      if (entry.resume) {
        const results = await Promise.allSettled([entry.resume.resumePath, entry.resume.imagePath].map((path) => fs.delete(path)));
        if (results.some((result) => result.status === "rejected")) setDeleteError("The review was removed, but some associated files couldn’t be deleted.");
      }
    } catch {
      setDeleteError("This review couldn’t be deleted. Please try again.");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <main className="app-page">
      <NavBar />
      <section className="main-section dashboard-state-section">
        <div className="workspace-heading"><h1>Your reviews</h1>{status === "ready" && reviews.length > 0 && <p>{reviews.length} saved {reviews.length === 1 ? "review" : "reviews"}</p>}</div>
        {deleteError && <div className="review-delete-error" role="alert"><p>{deleteError}</p><button className="text-button" type="button" onClick={() => setDeleteError("")}>Dismiss</button></div>}
        {status === "loading" && <div className="reviews-loading" role="status"><p>Loading your reviews…</p><div className="review-skeleton-grid" aria-hidden="true">{[0, 1, 2].map((item) => <div className="review-skeleton" key={item}><div /><div /><div /></div>)}</div></div>}
        {status === "error" && <WorkspaceState icon={CircleAlert} title="We couldn’t load your reviews" description="Your saved reviews haven’t loaded. Try again to reconnect to your workspace." role="alert"><button className="primary-button" type="button" onClick={() => void loadReviews()}>Try again</button></WorkspaceState>}
        {status === "ready" && reviews.length === 0 && <WorkspaceState icon={ScanText} title={hadReviews.current ? "Your workspace is clear" : "Your first review starts here"} description="Upload a PDF, add a role if you have one, and get feedback you can return to.">
          <Link className="primary-button button-emphasis" to="/upload"><Upload size={16} aria-hidden="true" />{hadReviews.current ? "Analyze a resume" : "Analyze your first resume"}</Link>
          <Link className="text-button" to="/#sample-review">Explore the demo <ArrowRight size={16} aria-hidden="true" /></Link>
        </WorkspaceState>}
        {status === "ready" && reviews.length > 0 && <div className="resumes-section">
          {reviews.map((entry) => <div className="resume-entry" key={entry.kvKey}>
            {entry.resume ? <ResumeCard resume={entry.resume} /> : <div className="unavailable-review"><FileWarning size={24} aria-hidden="true" /><h2>Review unavailable</h2><p>This saved review has incomplete or unreadable feedback. Start a new analysis to get a complete review.</p><Link className="text-button" to="/upload">Start a new review <ArrowRight size={16} aria-hidden="true" /></Link></div>}
            <button type="button" aria-label="Delete resume" disabled={Boolean(deletingKey)} onClick={() => void deleteReview(entry)} className="delete-resume" title={deletingKey === entry.kvKey ? "Removing…" : "Delete"}><Trash2 className="size-4 text-score-bad" aria-hidden="true" /></button>
          </div>)}
        </div>}
      </section>
    </main>
  );
}
