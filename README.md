# KaziCoach TZ

A polished, offline-first Tanzanian public-service interview preparation MVP. The initial role pack prepares **Nyunyusa Twaha Mrisho** for **Radiation Safety Inspector II (Nuclear Physics)** at TAEC.

## Included

- 33 tailored oral panel questions with model answers and Kiswahili coaching hints
- 15 written role/technical/scenario checks
- Realistic five-member panel: Chairperson, Secretary, two technical members and a public-service member
- Mixed, male, female, soft and deep interviewer voice modes using the best voices available on the device
- Five-point probable answers with mnemonics and an eye-controlled blurred reveal
- Browser speech recognition with typed fallback
- Browser text-to-speech
- Explainable concept/depth/structure scoring
- XP, streaks, levels, category progress, trend and realistic score-sensitive improvement suggestions
- End-of-session repeat or performance-reset flow that preserves preparation materials
- Local TXT/MD/PDF/DOCX extraction and image-reference uploads
- Local question generation with no API
- Optional Gemini generation through a server-side Cloudflare Pages Function
- Responsive mobile/desktop UI and offline service worker
- Local JSON data export/reset
- Current CV-grounded profile plus additional field questions from the uploaded Tanzania regulation and deep-research notes

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL. The core app needs no environment variables. Vite does not emulate the Cloudflare Pages Function; local and built-in generation still work.

## Quality checks

```bash
npm test
npm run build
```

## Deploy to Cloudflare Pages

1. Push this directory to GitHub.
2. Create a Cloudflare Pages project.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Add an encrypted secret named `GEMINI_API_KEY` only if AI generation is wanted.
6. Optionally add `GEMINI_MODEL` (default: `gemini-2.5-flash`).
7. Deploy. Pages will publish `functions/api/generate.ts` at `/api/generate`.

Before broad public launch, add Cloudflare Turnstile and durable per-IP/user rate limiting to the AI route.

## Privacy model

- Core app and scoring run in the browser.
- Files are extracted locally and capped before persistence.
- Raw audio is not stored.
- AI generation sends selected text only after explicit confirmation.
- API keys remain server-side.
- Progress is stored in `localStorage`; users can export or delete it.

## Content warning

This is an independent educational tool—not an official PSRS, Ajira Portal, TAEC, or IAEA product. Review current legal and technical facts against official sources. Non-sensitive candidate facts are grounded in the current uploaded application/CV; model answers must not be used to invent duties, achievements or research results.

## Project documents

The product requirements document is at [`../PRD.md`](../PRD.md).
