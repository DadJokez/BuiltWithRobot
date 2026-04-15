# Stack

## Framework

- **Next.js 15** (App Router, TypeScript) — page routing, server components, ISR
- **React 19** — UI
- **Tailwind CSS 4** — styling

## AI / ML

- **@anthropic-ai/sdk** — Anthropic client used server-side to call **Claude Haiku** (`claude-haiku-4-5-20251001`). Runs on ISR cache miss (every 24 h) to summarize each repo's README into 2-3 sentences for the portfolio tiles.
- **@google/genai** — Google Gemini client used to generate the daily doodle image (`gemini-3-pro-image-preview`) and pick activity/title text (`gemini-2.5-flash`).

## Storage

- **@vercel/blob** — stores the daily doodle manifest JSON and generated PNG images.

## Data

- **GitHub REST API** — fetches public repos tagged with the `built-with-robot` topic and their READMEs. Results are cached via Next.js ISR (24 h revalidation).
