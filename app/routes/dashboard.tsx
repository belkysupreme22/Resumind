import type { Route } from "./+types/dashboard";
import ResumeCard from "~/components/ResumeCard";
import NavBar from "~/components/Navbar";
import LoadingVisual from "~/components/LoadingVisual";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { Trash2, Upload } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}


type ResumeWithKey = Resume & { kvKey: string };

export default function Dashboard() {
  const { kv, fs } = usePuterStore();
  const [resumes, setResumes] = useState<ResumeWithKey[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
   const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const storedResumes = (await kv.list("resume:*", true)) as KVItem[];

     const parsedResumes: ResumeWithKey[] = storedResumes?.map((item) => {
      const data = JSON.parse(item.value) as Resume;
      return { ...data, kvKey: item.key };
    });

    setResumes(parsedResumes || []);
    setLoadingResumes(false);
    };

    loadResumes();
  }, [kv]);

   const handleDeleteResume = async (resume: ResumeWithKey) => {
    try {
      setDeletingId(resume.id);
      
      await kv.del(resume.kvKey); 
      if ((resume as any).filePath) {
        try { await fs.delete((resume as any).filePath); } catch { }
      }
      setResumes((prev) => prev.filter((r) => r.id !== resume.id));
    } catch (e) {
      console.error("Failed to delete resume:", e);
    } finally {
      setDeletingId(null);
    }
  };



  return (
    <main className="app-page">
      <NavBar />

      <section className="main-section">
        <div className="page-heading">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback</h2>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center gap-4">
            <LoadingVisual src="/images/resume-scan-2.gif" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
             <div key={resume.id} className="resume-entry">
                <ResumeCard resume={resume} />
                <button
                  aria-label="Delete resume"
                  disabled={deletingId === resume.id}
                  onClick={() => handleDeleteResume(resume)}
                  className="delete-resume"
                  title={deletingId === resume.id ? "Removing..." : "Delete"}
                >
                  <Trash2 className="size-4 text-score-bad" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loadingResumes && resumes.length == 0 && (
          <div className="flex flex-col items-center justify-center gap-4 mt-10">
            <Link
              to="/upload"
              className="primary-button w-fit"
            >
              <Upload className="size-4" aria-hidden="true" />
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
