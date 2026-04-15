import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { GoogleGenAI } from "@google/genai";
import {
  buildImagePrompt,
  loadManifest,
  MONTH_THEMES,
  pickTitleStyle,
  saveManifest,
  titleStyleInstruction,
  todayKey,
  type DoodleEntry,
} from "@/lib/doodle";

// Image generation can take 20-40s; raise timeout above the default.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Nano Banana 2 — override via env if the model id changes.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image-preview";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function pickActivity(ai: GoogleGenAI, month: number, date: string): Promise<string> {
  const theme = MONTH_THEMES[month];
  const res = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `You are picking a subject for today's daily illustration (date: ${date}).
The month's vibe is: ${theme.vibe}.
Some example activities in this vibe: ${theme.examples.join(", ")}.

Pick ONE activity — it should be a gerund phrase like the examples ("planting seedlings", "flying a kite"). It can be one of the examples or a fresh variation in the same vibe. It must be something a friendly chrome robot and a human could plausibly do together in a 1950s retro-futurist illustration. Return only the gerund phrase, no punctuation, no quotes.`,
  });
  const text = res.text?.trim() ?? theme.examples[0];
  return text.replace(/^["']|["']$/g, "").toLowerCase();
}

async function generateTitle(
  ai: GoogleGenAI,
  activity: string,
  style: "plaque" | "textbook",
): Promise<string> {
  const res = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `Scene: a friendly chrome robot and a human ${activity} together in a 1950s retro-futurist style.

${titleStyleInstruction(style)}`,
  });
  return (res.text ?? "Untitled Procedure").trim().replace(/^["']|["']$/g, "");
}

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<Buffer> {
  const res = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
  });
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data) {
      return Buffer.from(inline.data, "base64");
    }
  }
  throw new Error("No image data returned from Gemini");
}

async function run(req: Request, opts: { force?: boolean } = {}) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_API_KEY not set" }, { status: 500 });
  }

  const date = todayKey();
  const { manifest } = await loadManifest();

  if (!opts.force && manifest.entries.some((e) => e.date === date)) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already generated today" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  const month = new Date(`${date}T00:00:00Z`).getUTCMonth() + 1;

  const activity = await pickActivity(ai, month, date);
  const titleStyle = pickTitleStyle(date);
  const [title, imageBytes] = await Promise.all([
    generateTitle(ai, activity, titleStyle),
    generateImage(ai, buildImagePrompt(activity)),
  ]);

  const { url } = await put(`doodle/${date}.png`, imageBytes, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  const entry: DoodleEntry = { date, title, activity, imageUrl: url, titleStyle };
  const next = {
    entries: [...manifest.entries.filter((e) => e.date !== date), entry].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  };
  await saveManifest(next);

  return NextResponse.json({ ok: true, entry });
}

// Vercel Cron calls GET with the CRON_SECRET Authorization header.
export async function GET(req: Request) {
  return run(req);
}

// Manual regen (e.g., to backfill): POST with ?force=1
export async function POST(req: Request) {
  const url = new URL(req.url);
  return run(req, { force: url.searchParams.get("force") === "1" });
}
