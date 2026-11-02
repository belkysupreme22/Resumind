import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowUpRight, CircleAlert, FileWarning } from "lucide-react";
import ReviewResults from "~/components/ReviewResults";
import WorkspaceState from "~/components/WorkspaceState";
import { usePuterStore } from "~/lib/puter";
import { readSavedReview } from "~/lib/reviews";
import ThemeToggle from "~/components/ThemeToggle";

export const meta = () => [{ title: "Resume review — Resumind" }, { name: "description", content: "Detailed feedback on your resume." }];

const Resume = () => {
  const { id } = useParams();
  const { fs, kv } = usePuterStore();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [review, setReview] = useState<Resume | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "incomplete" | "error">("loading");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    setStatus("loading");
    setPreviewLoading(true);
    setReview(null);
    setResumeUrl("");
    setImageUrl("");
    const loadReview = async () => {
      try {
        const saved = await kv.get(`resume:${id}`);
        if (!active) return;
        if (saved === null) { setStatus("missing"); return; }
        if (saved === undefined) throw new Error("Unavailable");
        let data: Resume;
        try { data = readSavedReview(saved); }
        catch { setStatus("incomplete"); return; }
        setReview(data);
        setStatus("ready");
        const files = await Promise.allSettled([fs.read(data.resumePath), fs.read(data.imagePath)]);
        if (!active) return;
        const pdf = files[0];
        const image = files[1];
        if (pdf.status === "fulfilled" && pdf.value) {
          const url = URL.createObjectURL(new Blob([pdf.value], { type: "application/pdf" }));
          urls.push(url);
          setResumeUrl(url);
        }
        if (image.status === "fulfilled" && image.value) {
          const url = URL.createObjectURL(image.value);
          urls.push(url);
          setImageUrl(url);
        }
        setPreviewLoading(false);
      } catch {
        if (active) { setStatus((current) => current === "ready" ? "ready" : "error"); setPreviewLoading(false); }
      }
    };
    void loadReview();
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [id, attempt, kv, fs]);

  return (
    <main className="app-page">
      <nav className="resume-nav">
        <Link to="/dashboard" className="back-button"><ArrowLeft size={16} aria-hidden="true" /><span>Your reviews</span></Link>
        <div className="resume-nav-actions">{resumeUrl && <a className="text-button" href={resumeUrl} target="_blank" rel="noopener noreferrer">Open PDF <ArrowUpRight size={16} aria-hidden="true" /></a>}<ThemeToggle /></div>
      </nav>
      {status === "loading" && <section className="main-section"><p className="text-muted" role="status">Loading your review…</p></section>}
      {status !== "ready" && status !== "loading" && <section className="main-section">
        <WorkspaceState icon={status === "error" ? CircleAlert : FileWarning}
          title={status === "missing" ? "Review not found" : status === "incomplete" ? "This review is incomplete" : "We couldn’t load this review"}
          description={status === "missing" ? "This review may have been removed. Return to your workspace to find your saved reviews." : status === "incomplete" ? "The saved analysis doesn’t contain all feedback categories. Start a new review to get complete results." : "Your feedback hasn’t loaded. Try again to reconnect."}
          role={status === "error" ? "alert" : undefined}>
          {status === "error" ? <button className="primary-button" type="button" onClick={() => setAttempt((current) => current + 1)}>Try again</button> : <Link className="primary-button" to={status === "incomplete" ? "/upload" : "/dashboard"}>{status === "incomplete" ? "Start a new review" : "Your reviews"}</Link>}
        </WorkspaceState>
      </section>}
      {status === "ready" && review && <div className="review-layout">
        <section className="feedback-section resume-preview" aria-label="Resume preview">
          {imageUrl ? <div className="resume-document gradient-border">{resumeUrl ? <a href={resumeUrl} target="_blank" rel="noopener noreferrer" aria-label="Open original resume PDF"><img src={imageUrl} alt="Your resume" className="w-full" onError={() => setImageUrl("")} /></a> : <img src={imageUrl} alt="Your resume" className="w-full" onError={() => setImageUrl("")} />}</div>
            : <div className="preview-unavailable"><p role={previewLoading ? "status" : undefined}>{previewLoading ? "Loading resume preview…" : "The resume preview couldn’t be loaded. Your feedback is still available."}</p>{!previewLoading && <button className="text-button" type="button" onClick={() => setAttempt((current) => current + 1)}>Try again</button>}</div>}
        </section>
        <section className="feedback-section">
          <div><h1 className="review-heading">Resume review</h1>{(review.jobTitle || review.companyName) && <p className="review-context">{[review.jobTitle, review.companyName].filter(Boolean).join(" · ")}</p>}</div>
          <ReviewResults feedback={review.feedback} />
        </section>
      </div>}
    </main>
  );
};

export default Resume;
