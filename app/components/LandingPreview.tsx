import { ChevronDown, FileText, MousePointer2, ScanText } from "lucide-react";
import ReviewResults from "./ReviewResults";
import { sampleFeedback } from "~/lib/sample-review";

const LandingPreview = () => (
  <section className="product-preview" aria-labelledby="sample-review-title">
    <div className="preview-toolbar">
      <h2 className="preview-toolbar-title" id="sample-review-title"><ScanText size={16} aria-hidden="true" /> Explore a complete review.</h2>
      <span className="preview-example-label">Interactive sample</span>
    </div>
    <div className="sample-review-layout">
      <aside className="sample-context" aria-label="Sample application">
        <h3>Sample application</h3>
        <p>Explore the overall score, ATS feedback, and detailed suggestions for every category.</p>
        <dl className="sample-role">
          <div><dt>Candidate</dt><dd>Alex Morgan</dd></div>
          <div><dt>Applying for</dt><dd>Frontend Developer</dd></div>
          <div><dt>Company</dt><dd>Northstar</dd></div>
        </dl>
        <p className="sample-instruction"><MousePointer2 size={16} aria-hidden="true" /> Open any category to read what works and what to improve. You can keep several open.</p>
        <details className="sample-document">
          <summary><FileText size={16} aria-hidden="true" /> Read the sample resume <ChevronDown size={16} className="sample-document-chevron" aria-hidden="true" /></summary>
          <article className="sample-paper" aria-label="Alex Morgan’s sample resume">
            <h4>Alex Morgan</h4>
            <p>Frontend Developer · alex@example.com</p>
            <h5>Profile</h5>
            <p>Engineer building thoughtful, accessible web experiences.</p>
            <h5>Experience</h5>
            <strong>Frontend Engineer</strong>
            <p>Northstar · 2023 — Present</p>
            <ul><li>Built reusable interfaces with React and TypeScript.</li><li>Improved accessibility and reduced page load times.</li><li>Worked with design and product teams to ship features.</li></ul>
            <strong>Software Developer</strong>
            <p>Acme · 2021 — 2023</p>
            <ul><li>Developed responsive dashboards and internal tools.</li><li>Maintained a shared component library.</li></ul>
            <h5>Skills</h5>
            <p>React · TypeScript · CSS · Testing · Accessibility</p>
            <h5>Education</h5>
            <p>BSc Computer Science</p>
          </article>
        </details>
        <p className="sample-disclaimer">Illustrative sample data. Your AI feedback will depend on your resume and the role; scores are estimates.</p>
      </aside>
      <div className="sample-results" aria-label="Complete sample analysis results">
        <ReviewResults feedback={sampleFeedback} defaultOpen="tone-style" />
      </div>
    </div>
  </section>
);

export default LandingPreview;
