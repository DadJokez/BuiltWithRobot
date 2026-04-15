import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const msg = String((err as { message?: string })?.message ?? "");
  return /UNAVAILABLE|overloaded|rate limit|temporarily/i.test(msg);
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      // Exponential backoff with jitter: 2s, 4s, 8s, 16s
      const base = 2000 * 2 ** i;
      const delay = base + Math.floor(Math.random() * 1000);
      console.warn(`[doodle] ${label} attempt ${i + 1} failed (${(err as { status?: number })?.status ?? "?"}), retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function pickActivity(ai: GoogleGenAI, month: number, date: string): Promise<string> {
  const theme = MONTH_THEMES[month];
  const res = await withRetry("pickActivity", () =>
    ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `You are picking a subject for today's daily illustration (date: ${date}).
The month's vibe is: ${theme.vibe}.
Some example activities in this vibe: ${theme.examples.join(", ")}.

Pick ONE activity — it should be a gerund phrase like the examples ("planting seedlings", "flying a kite"). It can be one of the examples or a fresh variation in the same vibe. It must be something a friendly chrome robot and a human could plausibly do together in a 1950s retro-futurist illustration. Return only the gerund phrase, no punctuation, no quotes.`,
    }),
  );
  const text = res.text?.trim() ?? theme.examples[0];
  return text.replace(/^["']|["']$/g, "").toLowerCase();
}

async function generateTitle(
  ai: GoogleGenAI,
  activity: string,
  style: "plaque" | "textbook",
): Promise<string> {
  const res = await withRetry("generateTitle", () =>
    ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Scene: a friendly chrome robot and a human ${activity} together in a 1950s retro-futurist style.

${titleStyleInstruction(style)}`,
    }),
  );
  return (res.text ?? "Untitled Procedure").trim().replace(/^["']|["']$/g, "");
}

async function generateImage(ai: GoogleGenAI, prompt: string): Promise<Buffer> {
  const res = await withRetry("generateImage", () =>
    ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
      config: {
        imageConfig: { aspectRatio: "16:9" },
      },
    }),
  );
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data) {
      return Buffer.from(inline.data, "base64");
    }
  }
  throw new Error("No image data returned from Gemini");
}

async function run(req: Request, opts: { force?: boolean; monthOverride?: number } = {}) {
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
  const month = opts.monthOverride ?? new Date(`${date}T00:00:00Z`).getUTCMonth() + 1;

  const activity = await pickActivity(ai, month, date);
  const titleStyle = pickTitleStyle(date);
  const [title, imageBytes] = await Promise.all([
    generateTitle(ai, activity, titleStyle),
    generateImage(ai, buildImagePrompt(activity)),
  ]);

  // addRandomSuffix keeps each regen on a unique URL so CDN caches can't
  // serve yesterday's bytes at today's path.
  const { url } = await put(`doodle/${date}.png`, imageBytes, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: true,
  });

  const createdAt = new Date().toISOString();
  const entry: DoodleEntry = {
    id: createdAt,
    date,
    createdAt,
    title,
    activity,
    imageUrl: url,
    titleStyle,
  };
  const next = {
    entries: [...manifest.entries, entry].sort((a, b) =>
      (a.createdAt ?? a.date).localeCompare(b.createdAt ?? b.date),
    ),
  };
  await saveManifest(next);

  // Invalidate cached pages so the new doodle appears immediately.
  revalidatePath("/");
  revalidatePath("/doodle");

  return NextResponse.json({ ok: true, entry });
}

async function handle(req: Request, opts: { force?: boolean; monthOverride?: number } = {}) {
  try {
    return await run(req, opts);
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    const message = (err as { message?: string })?.message ?? "unknown error";
    console.error("[doodle] regen failed", err);
    return NextResponse.json({ error: message, upstreamStatus: status }, { status: 500 });
  }
}

// Vercel Cron calls GET with the CRON_SECRET Authorization header.
export async function GET(req: Request) {
  return handle(req);
}

// Manual regen (e.g., to backfill): POST with ?force=1&month=N
export async function POST(req: Request) {
  const url = new URL(req.url);
  const monthRaw = url.searchParams.get("month");
  const monthNum = monthRaw ? parseInt(monthRaw, 10) : NaN;
  const monthOverride =
    Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12 ? monthNum : undefined;
  return handle(req, {
    force: url.searchParams.get("force") === "1",
    monthOverride,
  });
}
