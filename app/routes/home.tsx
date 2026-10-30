import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import NavBar from "~/components/Navbar";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}


type ResumeWithKey = Resume & { kvKey: string };

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<ResumeWithKey[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
   const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [auth.isAuthenticated]);

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
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <NavBar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get feedback.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback</h2>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center gap-4">
            <img src="/images/resume-scan-2.gif" className="w-200px" alt="" />
          </div>
        )}

        {!loadingResumes && resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
             <div key={resume.id} className="relative">
                <ResumeCard resume={resume} />
                <button
                  aria-label="Delete resume"
                  disabled={deletingId === resume.id}
                  onClick={() => handleDeleteResume(resume)}
                  className="delete-resume"
                  title={deletingId === resume.id ? "Removing..." : "Delete"}
                >
                  {/* tiny inline trash icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-600">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3 4v8m4-8v8" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {!loadingResumes && resumes.length == 0 && (
          <div className="flex flex-col items-center justify-center gap-4 mt-10">
            <Link
              to="/upload"
              className="primary-button w-fit text-xl font-semi-bold"
            >
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
