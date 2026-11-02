const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isScore = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

export const isFeedback = (value: unknown): value is Feedback => {
  if (!isObject(value) || !isScore(value.overallScore)) return false;
  return ["ATS", "toneAndStyle", "content", "structure", "skills"].every((key) => {
    const category = value[key];
    return isObject(category) && isScore(category.score) && Array.isArray(category.tips) && category.tips.every((tip: unknown) =>
      isObject(tip) && (tip.type === "good" || tip.type === "improve") && typeof tip.tip === "string" &&
      (key === "ATS" || typeof tip.explanation === "string")
    );
  });
};

export const parseFeedback = (response: unknown): Feedback => {
  const content = isObject(response) && isObject(response.message) ? response.message.content : undefined;
  const text = typeof content === "string" ? content : Array.isArray(content)
    ? content.filter(isObject).filter((block) => typeof block.text === "string").map((block) => block.text).join("\n")
    : "";
  let result: unknown;
  try {
    result = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    throw new Error("The analysis response couldn’t be read. Please try again.");
  }
  if (!isFeedback(result)) throw new Error("The analysis was incomplete. Please try again to get all feedback categories.");
  return result;
};

export const readSavedReview = (value: string): Resume => {
  const data: unknown = JSON.parse(value);
  if (!isObject(data) || typeof data.id !== "string" || !data.id ||
      typeof data.resumePath !== "string" || !data.resumePath || typeof data.imagePath !== "string" || !data.imagePath || !isFeedback(data.feedback)) {
    throw new Error("This review is incomplete or unreadable.");
  }
  return {
    id: data.id,
    companyName: typeof data.companyName === "string" ? data.companyName : undefined,
    jobTitle: typeof data.jobTitle === "string" ? data.jobTitle : undefined,
    resumePath: data.resumePath,
    imagePath: data.imagePath,
    feedback: data.feedback,
  };
};

export type AnalysisStage = "preparing" | "reviewing" | "saving";
export interface AnalysisDraft {
  id: string;
  imageFile?: File;
  resumePath?: string;
  imagePath?: string;
  feedback?: Feedback;
  saved?: boolean;
}

interface AnalysisInput {
  file: File;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  prompt: string;
}

interface AnalysisServices {
  convert: (file: File) => Promise<File | null>;
  upload: (files: File[]) => Promise<{ path: string } | undefined>;
  feedback: (path: string, prompt: string) => Promise<unknown>;
  save: (key: string, value: string) => Promise<boolean | undefined>;
}

// Keep completed work in the draft so Retry can resume without repeating AI calls
// after a save failure. Publish a review only when every feedback category is valid.
export const analyzeResume = async (
  input: AnalysisInput,
  draft: AnalysisDraft,
  services: AnalysisServices,
  onStage: (stage: AnalysisStage) => void,
): Promise<string> => {
  if (!draft.resumePath || !draft.imagePath) {
    onStage("preparing");
    if (!draft.imagePath && !draft.imageFile) {
      const imageFile = await services.convert(input.file);
      if (!imageFile) throw new Error("We couldn’t read this PDF. Try an unlocked PDF that opens correctly on your device.");
      draft.imageFile = imageFile;
    }
    if (!draft.resumePath) {
      const uploaded = await services.upload([input.file]);
      if (!uploaded?.path) throw new Error("Your resume couldn’t be uploaded. Please try again.");
      draft.resumePath = uploaded.path;
    }
    if (!draft.imagePath) {
      const uploaded = await services.upload([draft.imageFile!]);
      if (!uploaded?.path) throw new Error("We couldn’t prepare your resume preview. Please try again.");
      draft.imagePath = uploaded.path;
      delete draft.imageFile;
    }
  }
  if (!draft.feedback) {
    onStage("reviewing");
    const response = await services.feedback(draft.resumePath, input.prompt);
    if (!response) throw new Error("The analysis didn’t finish. Please try again.");
    draft.feedback = parseFeedback(response);
  }
  onStage("saving");
  const saved = await services.save(`resume:${draft.id}`, JSON.stringify({
    id: draft.id,
    resumePath: draft.resumePath,
    imagePath: draft.imagePath,
    companyName: input.companyName.trim(),
    jobTitle: input.jobTitle.trim(),
    jobDescription: input.jobDescription.trim(),
    feedback: draft.feedback,
    createdAt: new Date().toISOString(),
  }));
  if (!saved) throw new Error("Your feedback is ready, but couldn’t be saved. Try again to save it without repeating the analysis.");
  draft.saved = true;
  return draft.id;
};
