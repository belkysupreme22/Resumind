import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { FileText } from "lucide-react";

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
}: {
  resume: Resume;
}) => {
  const [resumeUrl, setResumeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const { fs } = usePuterStore();
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setLoading(true);
    setResumeUrl("");
    const loadResume = async () => {
      try {
        const blob = await fs.read(imagePath);
        if (!blob || !active) return;
        objectUrl = URL.createObjectURL(blob);
        setResumeUrl(objectUrl);
      } catch {
        // The review remains usable when its thumbnail is unavailable.
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadResume();
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [imagePath, fs]);

  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-150"
    >
      <div className="resume-card-header">
        <div className="flex flex-col gap-2">
          {companyName && (
            <h2 className="text-ink font-semibold break-words">{companyName}</h2>
          )}
          {jobTitle && (
            <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>
          )}
          {!companyName && !jobTitle && (
            <h2 className="text-ink font-semibold">Resume</h2>
          )}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback.overallScore} />
        </div>
      </div>
      {resumeUrl ? (
        <div className="resume-thumbnail gradient-border animate-in fade-in duration-150">
          <div className="w-full h-full">
            <img
              src={resumeUrl}
              alt="resume"
              className="w-full"
              onError={() => setResumeUrl("")}
            />
          </div>
        </div>
      ) : <div className="resume-thumbnail-placeholder"><FileText size={32} strokeWidth={1.5} aria-hidden="true" /><span>{loading ? "Loading preview…" : "Open saved feedback"}</span></div>}
    </Link>
  );
};
export default ResumeCard;
