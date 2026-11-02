// Illustrative feedback for the public demo; never stored in a user's workspace.
export const sampleFeedback: Feedback = {
  overallScore: 85,
  ATS: {
    score: 90,
    tips: [
      { type: "good", tip: "Standard headings make experience, skills, and education easy to find." },
      { type: "good", tip: "A simple layout keeps the reading order clear." },
      { type: "improve", tip: "Use the exact job title where it accurately reflects your experience." },
      { type: "improve", tip: "Add relevant testing and accessibility keywords from the job description, supported by examples." },
    ],
  },
  toneAndStyle: {
    score: 82,
    tips: [
      { type: "good", tip: "Clear, direct language", explanation: "Your bullets start with actions such as ‘Built’, ‘Improved’, and ‘Developed’. This makes your contribution easy to scan." },
      { type: "improve", tip: "Make broad claims more specific", explanation: "‘Thoughtful, accessible web experiences’ gives a direction but little evidence. Name a product, the people it served, or an accessibility improvement you made." },
      { type: "improve", tip: "Lead with your strongest contribution", explanation: "Move the most relevant result to the first bullet under each role. A reader should understand your value before reaching the end of the section." },
    ],
  },
  content: {
    score: 78,
    tips: [
      { type: "good", tip: "Relevant frontend experience", explanation: "Your work with React, TypeScript, and reusable interfaces fits the frontend developer role. Keep those examples prominent." },
      { type: "improve", tip: "Show the outcome of your work", explanation: "‘Improved accessibility and reduced page load times’ would be stronger with a verified result. Include the before and after, the measurement, and your contribution. Use only numbers you can support." },
      { type: "improve", tip: "Explain the scope", explanation: "For the shared component library, mention which teams or products used it and what it helped them do. This turns a task into evidence of impact." },
    ],
  },
  structure: {
    score: 92,
    tips: [
      { type: "good", tip: "A familiar, readable structure", explanation: "Profile, Experience, Skills, and Education appear in a clear order. Consistent headings help both recruiters and parsing tools navigate the page." },
      { type: "good", tip: "Recent experience comes first", explanation: "Your current Northstar role appears before Acme, so a reader sees your most recent and relevant work first." },
      { type: "improve", tip: "Keep dates consistent", explanation: "Use one date format for every role. Adding months can clarify the timeline if the application asks for that level of detail." },
    ],
  },
  skills: {
    score: 85,
    tips: [
      { type: "good", tip: "A focused technical foundation", explanation: "React, TypeScript, CSS, testing, and accessibility form a relevant skills list for a frontend role." },
      { type: "improve", tip: "Support skills with examples", explanation: "Connect testing and accessibility to a bullet in your experience section. Describe the approach or tools you actually used and the problem they helped solve." },
      { type: "improve", tip: "Tailor the list to the opportunity", explanation: "Compare your skills with the job description. Add matching tools you have used, and put the most relevant ones first. Avoid adding technologies solely to match keywords." },
    ],
  },
};
