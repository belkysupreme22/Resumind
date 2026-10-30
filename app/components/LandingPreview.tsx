import { Check, FileText, Lightbulb, ScanText } from "lucide-react";
import ScoreGauge from "./ScoreGauge";

const sampleScores = [
  { label: "Tone & style", score: 84 },
  { label: "Content", score: 76 },
  { label: "Structure", score: 90 },
  { label: "Skills", score: 82 },
];

const LandingPreview = () => (
  <figure className="product-preview">
    <div className="preview-toolbar">
      <span className="preview-toolbar-title"><ScanText size={16} aria-hidden="true" /> A little perspective.</span>
      <span className="preview-example-label">Example review</span>
    </div>
    <div className="preview-body">
      <div className="preview-document-wrap" aria-hidden="true">
        <div className="preview-document-label"><FileText size={16} /> Your experience</div>
        <div className="preview-paper">
          <div className="preview-paper-heading">Alex Morgan</div>
          <p className="preview-paper-role">Frontend Engineer</p>
          <div className="preview-paper-rule" />
          <h3>Profile</h3>
          <p>Building thoughtful, accessible experiences for the web.</p>
          <h3>Experience</h3>
          <strong>Frontend Engineer</strong>
          <p className="preview-paper-meta">Northstar · 2023 — Present</p>
          <ul>
            <li>Built a shared component library for 12 product teams.</li>
            <li>Improved page performance and keyboard accessibility.</li>
          </ul>
          <h3>Skills</h3>
          <p>React · TypeScript · Accessibility · Design systems</p>
          <h3>Education</h3>
          <p>BSc Computer Science</p>
        </div>
      </div>
      <div className="preview-feedback">
        <div className="preview-score-heading">
          <ScoreGauge score={82} />
          <div>
            <span className="eyebrow">The bigger picture</span>
            <h3>A strong foundation.</h3>
            <p>A few focused changes can make your experience clearer.</p>
          </div>
        </div>
        <div className="preview-categories">
          {sampleScores.map(({ label, score }) => (
            <div key={label}>
              <span>{label}</span>
              <span className="preview-category-score">{score}<span>/100</span></span>
            </div>
          ))}
        </div>
        <div className="preview-tip preview-tip-good">
          <Check size={16} aria-hidden="true" />
          <div><strong>Keep the relevant experience.</strong><p>Your recent work tells a clear story.</p></div>
        </div>
        <div className="preview-tip preview-tip-improve">
          <Lightbulb size={16} aria-hidden="true" />
          <div><strong>Make your impact measurable.</strong><p>Add the outcome, not just the responsibility.</p></div>
        </div>
      </div>
    </div>
    <figcaption>Illustrative feedback. Your review is based on your resume and the job details you provide.</figcaption>
  </figure>
);

export default LandingPreview;
