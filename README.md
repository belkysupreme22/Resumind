<h1 align="center">Resumind</h1>

<p align="center">Resume feedback tailored to the role.</p>

<p align="center">
  <a href="https://resumindd.puter.site">Live application</a> ·
  <a href="https://github.com/belkysupreme22/Resumind/releases">Releases</a>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/images/product/dashboard-dark.jpg">
  <source media="(prefers-color-scheme: light)" srcset="public/images/product/dashboard-light.jpg">
  <img src="public/images/product/dashboard-light.jpg" alt="Sample Resumind workspace showing resumes, target roles, and review scores." width="960">
</picture>

<p align="center"><sub>Dashboard preview with sample data.</sub></p>

## Features

- Guided PDF upload with job context and a review step before analysis.
- Overall and ATS scores, plus feedback on tone, content, structure, and skills.
- Saved reviews, resume previews, and file management in a signed-in dashboard.
- Interactive sample review, responsive navigation, and light, dark, or system themes.

## Usage

1. Sign in with Puter.
2. Upload a PDF resume, up to 20 MB.
3. Enter the job title and description; the company name is optional.
4. Review your details, start analysis, and open the saved feedback.

Scores are AI-generated estimates. Review the suggestions before changing your resume.

## Local development

Use Node.js 24, as specified in `.node-version`.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.
Puter sign-in and cloud services require an internet connection.

## Validation and build

```bash
npm test
npm run typecheck
npm run build
npm run check:build
```

## Built with

React · React Router · TypeScript · Tailwind CSS · Puter · PDF.js · Lucide
