import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import ReviewResults from "~/components/ReviewResults";
import LoadingVisual from "~/components/LoadingVisual";
import { usePuterStore } from "~/lib/puter";
import ThemeToggle from "~/components/ThemeToggle";

export const meta = () => [
  { title: "Resumind - Review" },
  { name: "description", content: "Detailed Overview of your resume" },
];

const Resume = () => {
  const { id } = useParams();
  const { fs, kv } = usePuterStore();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;

      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl);

      setFeedback(data.feedback);
      console.log({ resumeUrl, imageUrl, feedback: data.feedback });
    };

    loadResume();
  }, [id]);

  console.log("feedback ", feedback);

  return (
    <main className="app-page">
      <nav className="resume-nav">
        <Link to="/dashboard" className="back-button">
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="text-ink text-sm font-medium">
            Back to Dashboard
          </span>
        </Link>
        <ThemeToggle />
      </nav>
      <div className="review-layout">
        <section className="feedback-section resume-preview">
          {imageUrl && resumeUrl && (
            <div className="resume-document animate-in fade-in duration-150 gradient-border">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full"
                  title="resume"
                  alt="Resume preview"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="review-heading">Resume Review</h2>
          {feedback ? (
            <ReviewResults feedback={feedback} />
          ) : (
            <LoadingVisual src="/images/resume-scan-2.gif" />
          )}
        </section>
      </div>
    </main>
  );
};
export default Resume;
