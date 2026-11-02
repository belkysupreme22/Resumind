import { prepareInstructions } from "../../constants";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, CircleAlert, FileText, LoaderCircle, ScanText } from "lucide-react";
import FileUploader from "~/components/FileUploader";
import NavBar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { formatSize, generateUUID } from "~/lib/utils";
import { analyzeResume, validateJobContext, type AnalysisDraft, type AnalysisStage, type JobContextErrors } from "~/lib/reviews";

const steps = ["Resume", "Job context", "Review"];
const stages: { key: AnalysisStage; title: string; description: string }[] = [
  { key: "preparing", title: "Preparing your resume", description: "Checking your PDF and getting it ready for review." },
  { key: "reviewing", title: "Reviewing your experience", description: "Looking at ATS suitability, content, structure, tone, and skills." },
  { key: "saving", title: "Saving your feedback", description: "Adding the completed review to your workspace." },
];

export const meta = () => [{ title: "Analyze your resume — Resumind" }];

const Upload = () => {
  const { ai, fs, kv } = usePuterStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [context, setContext] = useState({ companyName: "", jobTitle: "", jobDescription: "" });
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>("preparing");
  const [error, setError] = useState("");
  const [contextErrors, setContextErrors] = useState<JobContextErrors>({});
  const jobTitleInput = useRef<HTMLInputElement>(null);
  const jobDescriptionInput = useRef<HTMLTextAreaElement>(null);
  const focusInvalidContext = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorPanel = useRef<HTMLDivElement>(null);
  const previousStep = useRef(0);
  const draft = useRef<AnalysisDraft | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);
  useEffect(() => { if (error) errorPanel.current?.focus(); }, [error]);
  useEffect(() => {
    if (step === 1 && focusInvalidContext.current) {
      focusInvalidContext.current = false;
      if (contextErrors.jobTitle) jobTitleInput.current?.focus();
      else if (contextErrors.jobDescription) jobDescriptionInput.current?.focus();
    }
  }, [step, contextErrors]);

  const checkContext = () => {
    const errors = validateJobContext(context);
    setContextErrors(errors);
    if (!Object.keys(errors).length) return true;
    focusInvalidContext.current = true;
    setStep(1);
    return false;
  };

  const selectFile = (next: File | null) => {
    if (next !== file) {
      const old = draft.current;
      draft.current = null;
      // Only discard uploads created by this unfinished attempt, never saved reviews.
      if (old && !old.saved) {
        void Promise.allSettled([old.resumePath, old.imagePath].filter((path): path is string => Boolean(path)).map((path) => fs.delete(path)));
      }
    }
    setFile(next);
    setError("");
  };

  const updateContext = (key: keyof typeof context, value: string) => {
    setContext((current) => ({ ...current, [key]: value }));
    if (key !== "companyName") {
      setContextErrors((current) => current[key] ? { ...current, [key]: validateJobContext({ ...context, [key]: value })[key] } : current);
    }
    if (draft.current) delete draft.current.feedback;
    setError("");
  };

  const startAnalysis = async () => {
    if (!file || busy.current) return;
    if (!checkContext()) return;
    busy.current = true;
    setProcessing(true);
    setError("");
    const currentDraft = draft.current || { id: generateUUID() };
    draft.current = currentDraft;
    setStage(currentDraft.feedback ? "saving" : currentDraft.imagePath ? "reviewing" : "preparing");
    try {
      const id = await analyzeResume({ file, ...context, prompt: prepareInstructions(context) }, currentDraft, {
        convert: async (pdf) => {
          const converted = await convertPdfToImage(pdf);
          if (converted.imageUrl) URL.revokeObjectURL(converted.imageUrl);
          return converted.file;
        },
        upload: fs.upload,
        feedback: ai.feedback,
        save: kv.set,
      }, (next) => { if (mounted.current) setStage(next); });
      if (mounted.current) navigate(`/resume/${id}`);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "We couldn’t finish the review. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setProcessing(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || processing) return;
    if (step > 0 && !checkContext()) return;
    if (step < 2) setStep(step + 1);
    else void startAnalysis();
  };
  const stageIndex = stages.findIndex((item) => item.key === stage);

  return (
    <main className="app-page upload-page">
      <NavBar />
      <section className="main-section wizard-section">
        <div className="workspace-heading"><h1>Analyze your resume</h1><p>Upload your resume and add the role’s requirements for targeted feedback.</p></div>
        <div className="wizard-panel">
          {processing ? (
            <div className="analysis-progress" role="status" aria-live="polite" aria-atomic="true">
              <ScanText size={32} strokeWidth={1.5} aria-hidden="true" />
              <h2>{stages[stageIndex].title}</h2>
              <p>{stages[stageIndex].description}</p>
              <ol aria-label="Analysis progress">
                {stages.map((item, index) => <li key={item.key} data-status={index < stageIndex ? "complete" : index === stageIndex ? "active" : "pending"}>
                  {index < stageIndex ? <Check size={16} aria-hidden="true" /> : index === stageIndex ? <LoaderCircle size={16} className="progress-spinner" aria-hidden="true" /> : <span className="progress-dot" />}
                  {item.title}{index < stageIndex && <span className="sr-only">: complete</span>}{index === stageIndex && <span className="sr-only">: in progress</span>}
                </li>)}
              </ol>
              <p className="analysis-keep-open">You can leave this page open while we work. Your completed review will open automatically.</p>
            </div>
          ) : (
            <>
              <ol className="wizard-steps" aria-label="Resume analysis steps">
                {steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} data-complete={step > index}>
                  <span className="wizard-step-number">{step > index ? <Check size={16} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
                </li>)}
              </ol>
              <form className="wizard-form" onSubmit={submit} noValidate>
                <div className="wizard-step-heading"><span>Step {step + 1} of 3</span><h2 ref={heading} tabIndex={-1}>{["Choose your resume", "Add job context", "Review your details"][step]}</h2><p>{["Upload a PDF of your resume to get started.", "Add the job title and description so feedback matches the role.", "Check the file and context before starting your analysis."][step]}</p></div>
                {step === 0 && <FileUploader file={file} onFileSelect={selectFile} />}
                {step === 1 && <div className="wizard-fields">
                  <div className="form-div"><label htmlFor="job-title">Job title <span className="field-requirement">Required</span></label><input ref={jobTitleInput} id="job-title" name="job-title" required value={context.jobTitle} aria-invalid={Boolean(contextErrors.jobTitle)} aria-describedby={contextErrors.jobTitle ? "job-title-error" : undefined} onChange={(event) => updateContext("jobTitle", event.target.value)} placeholder="e.g. Frontend Developer" />{contextErrors.jobTitle && <p className="field-validation-error" id="job-title-error">{contextErrors.jobTitle}</p>}</div>
                  <div className="form-div"><label htmlFor="company-name">Company <span className="field-requirement">Optional</span></label><input id="company-name" name="company-name" value={context.companyName} onChange={(event) => updateContext("companyName", event.target.value)} placeholder="e.g. Northstar" /></div>
                  <div className="form-div"><label htmlFor="job-description">Job description <span className="field-requirement">Required</span></label><textarea ref={jobDescriptionInput} id="job-description" name="job-description" rows={6} required value={context.jobDescription} aria-invalid={Boolean(contextErrors.jobDescription)} aria-describedby={contextErrors.jobDescription ? "job-description-error" : undefined} onChange={(event) => updateContext("jobDescription", event.target.value)} placeholder="Paste the job description" />{contextErrors.jobDescription && <p className="field-validation-error" id="job-description-error">{contextErrors.jobDescription}</p>}</div>
                </div>}
                {step === 2 && <div className="wizard-review">
                  <div className="wizard-review-group"><div className="wizard-review-label"><h3>Resume</h3><button className="text-button" type="button" onClick={() => setStep(0)}>Change file</button></div><div className="wizard-file-summary"><FileText size={24} aria-hidden="true" /><div><p>{file?.name}</p><span>{file && formatSize(file.size)}</span></div></div></div>
                  <div className="wizard-review-group"><div className="wizard-review-label"><h3>Job context</h3><button className="text-button" type="button" onClick={() => setStep(1)}>Edit context</button></div>
                      <dl className="wizard-context-summary">{context.companyName.trim() && <div><dt>Company</dt><dd>{context.companyName}</dd></div>}{context.jobTitle.trim() && <div><dt>Role</dt><dd>{context.jobTitle}</dd></div>}</dl>
                      {context.jobDescription.trim() && <details className="wizard-job-description"><summary>Read job description</summary><p>{context.jobDescription}</p></details>}
                  </div>
                  <p className="wizard-score-note">You’ll receive an overall score, ATS feedback, and suggestions for tone, content, structure, and skills. Scores are AI estimates.</p>
                </div>}
                {error && <div className="analysis-error" ref={errorPanel} role="alert" tabIndex={-1}><CircleAlert size={20} aria-hidden="true" /><div><h3>We couldn’t finish this review</h3><p>{error}</p><p>Your file and details are kept on this page.</p></div></div>}
                <div className="wizard-actions">
                  {step > 0 ? <button className="text-button" type="button" onClick={() => setStep(step - 1)}><ArrowLeft size={16} aria-hidden="true" /> Back</button> : <Link className="text-button" to="/dashboard"><ArrowLeft size={16} aria-hidden="true" /> Your reviews</Link>}
                  <button type="submit" className="primary-button button-emphasis" disabled={!file}>{step === 0 ? "Continue" : step === 1 ? "Review details" : error ? "Try again" : "Analyze resume"}<ArrowRight size={16} aria-hidden="true" /></button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
