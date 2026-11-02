import { ArrowRight, Check, FileSearch, FileText, History, ScanText, Target } from "lucide-react";
import { Link } from "react-router";
import BackToTop from "~/components/BackToTop";
import LandingPreview from "~/components/LandingPreview";
import PublicNavbar from "~/components/PublicNavbar";
import ProductScreenshot from "~/components/ProductScreenshot";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "Resumind — A clearer next step" },
  { name: "description", content: "Understand what’s working in your resume and what to improve. Get focused AI feedback for the role you want." },
];

const features = [
  { icon: FileSearch, title: "See the bigger picture.", text: "Get an AI estimate of ATS suitability, plus a closer look at your content, structure, tone, and skills.", label: "Thoughtful analysis" },
  { icon: Target, title: "Keep the role in view.", text: "Add a job title and description so your feedback considers the opportunity you’re applying for.", label: "Relevant context" },
  { icon: History, title: "Pick up where you left off.", text: "Keep your resumes and reviews together. Return to your feedback whenever you’re ready for the next application.", label: "A personal workspace" },
];

const steps = [
  { title: "Bring your experience.", text: "Upload your resume as a PDF. One file, up to 20 MB." },
  { title: "Add a little context.", text: "Include the role and job description for more relevant feedback." },
  { title: "Find your next step.", text: "Review your scores, see what works, and focus on what to improve." },
];

const Landing = () => {
  const isAuthenticated = usePuterStore((state) => state.auth.isAuthenticated);
  const analyzePath = isAuthenticated ? "/upload" : "/auth?next=/upload";

  return (
    <main className="app-page landing-page" id="top">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <PublicNavbar isAuthenticated={isAuthenticated} />

      <section className="landing-hero page-container" id="main-content" aria-labelledby="hero-title" tabIndex={-1}>
        <span className="hero-label"><ScanText size={16} aria-hidden="true" /> A fresh perspective on your resume</span>
        <h1 id="hero-title">A stronger resume.<br /><span>A clearer next step.</span></h1>
        <p className="hero-description">Understand what’s working. Know what to improve.<br className="desktop-break" /> Get focused AI feedback for the role you want.</p>
        <div className="hero-actions">
          <Link className="primary-button button-emphasis" to={analyzePath}>Analyze my resume <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <p className="hero-note"><FileText size={14} aria-hidden="true" /> Your experience. A little more clarity.</p>
      </section>

      <section className="landing-preview-section page-container" id="sample-review" aria-label="Sample resume feedback">
        <LandingPreview />
      </section>

      <section className="landing-features page-container" id="features" aria-labelledby="features-title">
        <div className="section-intro">
          <span className="eyebrow">A little clarity goes a long way</span>
          <h2 id="features-title">Less guesswork.<br />More direction.</h2>
          <p>You have the experience. Get a clearer view of how to present it.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text, label }) => (
            <article className="feature-item" key={title}>
              <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
              <span className="eyebrow">{label}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-workspace page-container" aria-label="Explore the Resumind workspace">
        <div className="workflow-row">
          <figure className="workflow-shot">
            <ProductScreenshot view="dashboard" alt="The Resumind dashboard showing saved resumes, job titles, and overall review scores." />
            <figcaption>Your workspace · sample resumes</figcaption>
          </figure>
          <div className="workflow-copy">
            <span className="eyebrow"><History size={16} aria-hidden="true" /> A place for every application</span>
            <h2>Different roles.<br />One clear view.</h2>
            <p>Keep your resumes and their reviews together. See the company, the role, and your overall score at a glance.</p>
            <ul>
              <li><Check size={16} aria-hidden="true" /> Save resumes for different opportunities.</li>
              <li><Check size={16} aria-hidden="true" /> Reopen your feedback when you need it.</li>
              <li><Check size={16} aria-hidden="true" /> Keep your next application in view.</li>
            </ul>
            <Link className="text-button" to={isAuthenticated ? "/dashboard" : "/auth?next=/dashboard"}>Open your workspace <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="landing-process page-container" id="how-it-works" aria-labelledby="process-title">
        <div className="process-intro">
          <span className="eyebrow">Simple, from the start</span>
          <h2 id="process-title">Your next move.<br />In three steps.</h2>
          <p>No blank page. No guessing where to begin.</p>
          <Link className="text-button process-link" to={analyzePath}>Start your review <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <ol className="process-steps">
          {steps.map(({ title, text }, index) => (
            <li key={title}>
              <span className="step-number">0{index + 1}</span>
              <div><h3>{title}</h3><p>{text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-closing page-container" aria-labelledby="closing-title">
        <span className="closing-icon"><Check size={24} strokeWidth={1.5} aria-hidden="true" /></span>
        <h2 id="closing-title">Good experience.<br />Better presented.</h2>
        <p>Make your next application a little more considered.</p>
        <Link className="primary-button button-emphasis" to={analyzePath}>Analyze my resume <ArrowRight size={16} aria-hidden="true" /></Link>
        <span className="closing-note">Sign in with Puter to analyze your resume and save your reviews.</span>
      </section>

      <footer className="public-footer page-container">
        <p>Made for your next move.</p>
      </footer>
      <BackToTop />
    </main>
  );
};

export default Landing;
