import { list, put } from "@vercel/blob";

export type DoodleEntry = {
  date: string; // YYYY-MM-DD
  title: string;
  activity: string;
  imageUrl: string;
  titleStyle: "plaque" | "textbook";
};

export type DoodleManifest = {
  entries: DoodleEntry[];
};

const MANIFEST_PATH = "doodle/manifest.json";

// Month-themed activity pools. The LLM picks one each day (with its own
// variation) so we get fresh-but-on-brand prompts.
export const MONTH_THEMES: Record<number, { vibe: string; examples: string[] }> = {
  1: { vibe: "new beginnings, cozy indoor winter", examples: ["brewing tea", "organizing a tiny library", "ice skating on a pond", "reading by a window"] },
  2: { vibe: "warmth, handmade things, late winter", examples: ["knitting a scarf", "baking heart-shaped cookies", "writing a letter", "pressing flowers"] },
  3: { vibe: "early spring, thawing, renewal", examples: ["planting seedlings", "flying a kite", "watching rain fall", "sweeping the porch"] },
  4: { vibe: "spring, gentle rain, gardens", examples: ["watering tulips", "sharing an umbrella", "birdwatching", "building a birdhouse"] },
  5: { vibe: "blooming, outdoors, picnics", examples: ["having a picnic", "painting landscapes", "cycling through meadows", "catching butterflies"] },
  6: { vibe: "early summer, oceans, travel", examples: ["sailing a small boat", "collecting seashells", "reading a map", "sending a postcard"] },
  7: { vibe: "peak summer, adventure, stars", examples: ["stargazing with a telescope", "roasting marshmallows", "fishing from a pier", "chasing fireflies"] },
  8: { vibe: "late summer, exploration, heat", examples: ["filling a bird bath", "tending a vegetable garden", "building sandcastles", "painting a mural"] },
  9: { vibe: "back-to-school, tinkering, early autumn", examples: ["soldering a circuit", "writing in a notebook", "flying a paper airplane", "stacking books"] },
  10: { vibe: "autumn, pumpkins, warm drinks", examples: ["carving a jack-o-lantern", "raking leaves", "apple picking", "baking a pie"] },
  11: { vibe: "harvest, gratitude, home", examples: ["setting a dinner table", "feeding pigeons", "mending a coat", "sharing soup"] },
  12: { vibe: "winter holidays, light, wonder", examples: ["decorating a tree", "caroling in the snow", "wrapping a gift", "lighting candles"] },
};

const STYLE_PROMPT = `A 1950s retro-futurist illustration in the style of Disney's Tomorrowland concept art, designed as a wide horizontal banner (16:9 aspect ratio, like a Google Doodle). A friendly chrome robot and a human $ACTIVITY together. Atomic-age aesthetic, muted palette of teal, coral, cream, and brass. Soft gouache texture, optimistic mid-century mood, horizontally composed with action spread across the frame, clean background with subtle starbursts or geometric flourishes. No text, no letters, no watermarks.`;

export function buildImagePrompt(activity: string): string {
  return STYLE_PROMPT.replace("$ACTIVITY", activity);
}

export function pickTitleStyle(date: string): "plaque" | "textbook" {
  // Alternate daily by day-of-month parity for variety.
  const day = parseInt(date.slice(-2), 10);
  return day % 2 === 0 ? "plaque" : "textbook";
}

export function titleStyleInstruction(style: "plaque" | "textbook"): string {
  if (style === "plaque") {
    return `Write a deadpan museum-plaque-style title for this scene. Treat the mundane activity with absurd gravitas. Keep it 3-7 words. Examples: "Cultivation Protocol, Phase One", "The Morning Ritual, Circa 2087", "On the Dignity of Shared Labor". Return only the title, no quotes.`;
  }
  return `Write a deadpan mid-century science-textbook figure caption for this scene. Overly formal, overly specific, as if from a 1955 engineering manual. Keep it 4-8 words. Examples: "Figure 14: Proper Hand-Cranking of the Domestic Apparatus", "On the Matter of Shared Sandwiches", "Diagram II: Collaborative Leaf Displacement". Return only the title, no quotes.`;
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function loadManifest(): Promise<{ manifest: DoodleManifest; url: string | null }> {
  const { blobs } = await list({ prefix: "doodle/manifest" });
  const existing = blobs.find((b) => b.pathname === MANIFEST_PATH);
  if (!existing) return { manifest: { entries: [] }, url: null };
  const res = await fetch(existing.url, { cache: "no-store" });
  if (!res.ok) return { manifest: { entries: [] }, url: existing.url };
  const manifest = (await res.json()) as DoodleManifest;
  return { manifest, url: existing.url };
}

export async function saveManifest(manifest: DoodleManifest): Promise<string> {
  const { url } = await put(MANIFEST_PATH, JSON.stringify(manifest, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return url;
}
