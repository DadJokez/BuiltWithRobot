import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { GoogleGenAI } from "@google/genai";
import {
  buildImagePrompt,
  loadManifest,
  MONTH_THEMES,
  pickTitleStyle,
  recentDoodleContext,
  saveManifest,
  titleStyleInstruction,
  todayKey,
  type DoodleEntry,
  type DoodleManifest,
  type DoodleScene,
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

function normalizeScenePart(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ");
  return cleaned || fallback;
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function fallbackScene(month: number, recentEntries: DoodleEntry[]): DoodleScene {
  const theme = MONTH_THEMES[month];
  const recentActivities = new Set(
    recentEntries.map((entry) => normalizedKey(entry.activity)),
  );
  const activity =
    theme.examples.find((example) => !recentActivities.has(normalizedKey(example))) ??
    theme.examples[Math.floor(Math.random() * theme.examples.length)];
  const setting = theme.settings[Math.floor(Math.random() * theme.settings.length)];
  const shuffledObjects = [...theme.objects].sort(() => Math.random() - 0.5);

  return {
    activity,
    setting,
    objects: shuffledObjects.slice(0, 4),
  };
}

function parseSceneResponse(text: string, fallback: DoodleScene): DoodleScene {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? text) as Partial<DoodleScene>;
    const objects = Array.isArray(parsed.objects)
      ? parsed.objects
          .filter((item): item is string => typeof item === "string")
          .map((item) => normalizeScenePart(item, ""))
          .filter(Boolean)
          .slice(0, 5)
      : fallback.objects;

    return {
      activity: normalizeScenePart(parsed.activity ?? "", fallback.activity).toLowerCase(),
      setting: normalizeScenePart(parsed.setting ?? "", fallback.setting).toLowerCase(),
      objects: objects.length > 0 ? objects : fallback.objects,
    };
  } catch {
    return fallback;
  }
}

function formatRecentEntries(entries: DoodleEntry[]): string {
  if (entries.length === 0) return "None yet.";
  return entries
    .map((entry) => {
      const setting = entry.setting ? `; setting: ${entry.setting}` : "";
      const objects =
        entry.objects && entry.objects.length > 0
          ? `; objects: ${entry.objects.join(", ")}`
          : "";
      return `- ${entry.date}: ${entry.title}; activity: ${entry.activity}${setting}${objects}`;
    })
    .join("\n");
}

function repeatsRecentActivity(scene: DoodleScene, recentEntries: DoodleEntry[]): boolean {
  const activityKey = normalizedKey(scene.activity);
  return recentEntries.some((entry) => normalizedKey(entry.activity) === activityKey);
}

async function pickScene(
  ai: GoogleGenAI,
  month: number,
  date: string,
  manifest: DoodleManifest,
): Promise<DoodleScene> {
  const theme = MONTH_THEMES[month];
  const recentEntries = recentDoodleContext(manifest);
  const fallback = fallbackScene(month, recentEntries);
  const res = await withRetry("pickScene", () =>
    ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `You are picking a scene for today's daily illustration (date: ${date}).
The month's vibe is: ${theme.vibe}.
Some example activities in this vibe: ${theme.examples.join(", ")}.
Useful settings in this vibe: ${theme.settings.join(", ")}.
Useful objects in this vibe: ${theme.objects.join(", ")}.

Recent manifest entries to avoid repeating:
${formatRecentEntries(recentEntries)}

Pick one fresh scene. The activity must be a gerund phrase like "calibrating a miniature sunrise machine" or "cataloging tiny weather jars". Avoid recent activities, titles, settings, and obvious subject repeats from the manifest above. Prefer a surprising but plausible human-and-robot collaboration that still fits the month. Use a setting and 3-5 concrete objects that create visual variety.

Return only minified JSON in this shape:
{"activity":"gerund phrase","setting":"specific place","objects":["object one","object two","object three"]}`,
    }),
  );
  const scene = parseSceneResponse(res.text?.trim() ?? "", fallback);
  return repeatsRecentActivity(scene, recentEntries) ? fallback : scene;
}

async function generateTitle(
  ai: GoogleGenAI,
  scene: DoodleScene,
  style: "plaque" | "textbook",
): Promise<string> {
  const res = await withRetry("generateTitle", () =>
    ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Scene: a friendly chrome robot and a human ${scene.activity} together in ${scene.setting}, surrounded by ${scene.objects.join(", ")}. The style is optimistic 1950s World's Fair futurism with a dark workshop exhibit palette.

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

  const scene = await pickScene(ai, month, date, manifest);
  const titleStyle = pickTitleStyle(date);
  const [title, imageBytes] = await Promise.all([
    generateTitle(ai, scene, titleStyle),
    generateImage(ai, buildImagePrompt(scene)),
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
    activity: scene.activity,
    setting: scene.setting,
    objects: scene.objects,
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
