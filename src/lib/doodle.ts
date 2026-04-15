import { list, put } from "@vercel/blob";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DoodleEntry = {
  // id/createdAt added in the append-always refactor; optional so
  // legacy manifest rows still parse.
  id?: string;
  createdAt?: string;
  date: string; // YYYY-MM-DD
  title: string;
  activity: string;
  /** The hidden danger the robot staged. Optional — absent on legacy entries. */
  darkMechanism?: string;
  /** How the human narrowly escaped. Optional — absent on legacy entries. */
  luckyEscape?: string;
  imageUrl: string;
  titleStyle: "plaque" | "textbook";
};

export type DoodleManifest = {
  entries: DoodleEntry[];
};

export type DailyPromptResult = {
  prompt: string;
  activity: string;
  seasonalTheme: string;
  darkMechanism: string;
  luckyEscape: string;
};

// ─── Prompt Config ────────────────────────────────────────────────────────────

/**
 * The core image prompt template. Variables are injected daily from the pools
 * below. The {dark_mechanism} and {lucky_escape} describe what's visible in
 * the composition — the human is blissfully unaware but the viewer can see it.
 */
const PROMPT_TEMPLATE = `A 1950s retro-futurist illustration in the style of Disney's Tomorrowland concept art, designed as a wide horizontal banner (16:9 aspect ratio, like a Google Doodle). A cheerful human and a friendly chrome robot are {activity} together in a {seasonal_theme} setting. Bright, optimistic mid-century design, pastel tones of teal, coral, cream, and brass. Chrome surfaces, clean lines, smiling expressions. Soft gouache texture, horizontally composed with action spread across the frame.

In the background, partially obscured, {dark_mechanism} — but {lucky_escape}. The hazard is visible in the scene but the human appears blissfully unaware, their expression cheerful and carefree.

Style: vintage advertising illustration, highly detailed, soft lighting, playful but subtly unsettling undertone, visual irony, layered storytelling. No text, no letters, no watermarks.`;

const SEASONAL_THEMES: Record<string, readonly string[]> = {
  "01": [
    "snowy retro-futurist city with heated walkways",
    "icy domed habitat with frost on the windows",
    "cozy winter interior with chrome radiators and snow outside",
  ],
  "02": [
    "Valentine's setting with hearts and gift-wrapped parcels",
    "pink-toned futuristic date scene with chrome roses",
    "cozy indoor scene with handmade decorations and soft lighting",
  ],
  "03": [
    "early spring with light rain showers and chrome umbrellas",
    "buds starting to bloom on atomic-age chrome trees",
    "windy transitional scene with kites and chrome pinwheels",
  ],
  "04": [
    "spring garden in full bloom with planting pods",
    "light rain with sleek umbrella drones and fresh greenery",
    "outdoor scene with rows of retro-futurist flower beds",
  ],
  "05": [
    "sunny park with retro-future picnic blankets and hover baskets",
    "warm spring afternoon under chrome-and-grass greenery",
    "open meadow scene with vintage flying machines in the background",
  ],
  "06": [
    "futuristic summer fair with spinning chrome attractions",
    "bright sunlight and blue skies on an elevated leisure platform",
    "outdoor festival with retro-futurist ice cream carts and bunting",
  ],
  "07": [
    "retro-futurist Independence Day with fireworks and chrome bunting",
    "summer rooftop celebration with vintage flags and atomic starbursts",
    "warm evening outdoor party with glowing lanterns and chrome decor",
  ],
  "08": [
    "heatwave scene with personal cooling devices and shade-sail structures",
    "lazy summer afternoon at a dome pool with chrome loungers",
    "outdoor workshop in strong sun with a dusty retro-futurist backdrop",
  ],
  "09": [
    "early autumn leaves on chrome branches in a futuristic campus",
    "back-to-school vibe with jet packs and atomic-age notebooks",
    "cooler weather with cozy sweaters and retro-future tinkering lab",
  ],
  "10": [
    "playful Halloween with atomic-age decorations and glowing pumpkins",
    "chrome costumes and spooky but cheerful haunted habitat",
    "carnival of curiosities with retro-futurist ghost imagery",
  ],
  "11": [
    "harvest setting with a retro-future barn and chrome cornucopia",
    "cozy amber-toned Thanksgiving kitchen prep in a space habitat",
    "autumn market with chrome produce stalls and warm lantern light",
  ],
  "12": [
    "Christmas snow domes and holiday lights strung on chrome trees",
    "cozy festive interior with robot gift-wrappers and a glowing hearth",
    "outdoor winter market with retro-futurist ornaments and falling snow",
  ],
};

const ACTIVITIES: readonly string[] = [
  "gardening together",
  "cooking in a futuristic kitchen",
  "repairing a small rocket",
  "cleaning a sleek chrome home",
  "decorating for a holiday",
  "working on a conveyor system",
  "painting a tall wall",
  "setting up a picnic",
  "assembling a robot charging station",
  "washing a flying car",
  "tending to a greenhouse",
  "building a small bridge",
  "loading supplies onto a transport pod",
  "trimming a chrome hedge",
  "adjusting a satellite dish",
];

const DARK_MECHANISMS: readonly string[] = [
  "a ladder is about to collapse beneath the human",
  "a power cable is sparking dangerously close to a puddle at the human's feet",
  "a heavy crate is swinging loose on a fraying rope directly above the human",
  "a robotic arm has broken free and is swinging toward the human's head",
  "a laser tool has misfired and its beam is tracking toward the human",
  "a rocket engine has activated unexpectedly, its exhaust aimed at the human",
  "a conveyor belt is pulling a sharp hazard directly toward the human's hands",
  "a press machine is beginning to slam shut over the human's workspace",
  "an electrical panel behind the human is sparking and about to explode",
  "a ceiling fixture has come loose and is falling toward the human",
  "a runaway cart loaded with heavy equipment is rolling silently toward the human",
];

const LUCKY_ESCAPES: readonly string[] = [
  "the human steps aside at the last second to pick up a dropped tool",
  "a passing bird startles the human into moving just out of the way",
  "the robot is interrupted mid-action by a cheerful notification chime",
  "the hazard misfires and strikes harmlessly into the distance",
  "a sudden gust of wind redirects the danger at the last moment",
  "the human unknowingly disables the threat while reaching for something else",
  "the danger misses completely as the human bends down to tie a shoelace",
  "a delivery drone flies between the human and the hazard",
  "the human turns away just in time to wave cheerfully at a neighbour",
  "a second robot accidentally bumps into the first, blocking the danger",
];

// ─── Daily Prompt Builder ─────────────────────────────────────────────────────

/**
 * Picks a deterministic item from an array using the date + a salt string as a
 * seed. The same date always produces the same result — retries are safe and
 * any day can be reproduced exactly.
 */
function seededPick<T>(arr: readonly T[], date: string, salt: string): T {
  const seed = [...(date + salt)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return arr[seed % arr.length];
}

/**
 * Build today's fully-interpolated image prompt and return the individual
 * variables so they can be stored in the manifest for display later.
 */
export function buildDailyPrompt(date: string): DailyPromptResult {
  const month = date.slice(5, 7); // "YYYY-MM-DD" → "MM"
  const seasonal = SEASONAL_THEMES[month] ?? SEASONAL_THEMES["04"];

  const seasonalTheme = seededPick(seasonal, date, "seasonal");
  const activity = seededPick(ACTIVITIES, date, "activity");
  const darkMechanism = seededPick(DARK_MECHANISMS, date, "dark");
  const luckyEscape = seededPick(LUCKY_ESCAPES, date, "escape");

  const prompt = PROMPT_TEMPLATE
    .replace("{activity}", activity)
    .replace("{seasonal_theme}", seasonalTheme)
    .replace("{dark_mechanism}", darkMechanism)
    .replace("{lucky_escape}", luckyEscape);

  return { prompt, activity, seasonalTheme, darkMechanism, luckyEscape };
}

// ─── Title Generation Helpers ─────────────────────────────────────────────────

export function pickTitleStyle(date: string): "plaque" | "textbook" {
  // Alternate daily by day-of-month parity for variety.
  const day = parseInt(date.slice(-2), 10);
  return day % 2 === 0 ? "plaque" : "textbook";
}

/**
 * Returns the LLM instruction for generating a title. The activity and dark
 * mechanism are passed in so the title can carry subtle, ironic awareness of
 * the hidden narrative without spelling it out.
 */
export function titleStyleInstruction(
  style: "plaque" | "textbook",
  activity: string,
  darkMechanism: string,
): string {
  const scene = `a cheerful human and a chrome robot ${activity} together — though, unknown to the human, ${darkMechanism}`;

  if (style === "plaque") {
    return `Write a deadpan museum-plaque-style title for this scene: ${scene}. The title should treat the mundane activity with absurd gravitas. Let the irony seep in subtly — the title hints at something ominous without stating it. Keep it 3–7 words. Examples: "Cultivation Protocol, Phase One", "Cooperative Maintenance, Final Iteration", "The Last Cheerful Adjustment". Return only the title, no quotes, no punctuation at the end.`;
  }

  return `Write a deadpan mid-century science-textbook figure caption for this scene: ${scene}. Overly formal and overly specific, as if from a 1955 engineering manual. Let the irony seep in subtly — the caption hints at something ominous without stating it. Keep it 4–8 words. Examples: "Figure 14: Standard Tool Sharing Procedure", "Diagram II: Assisted Maintenance, Vol. III", "On the Matter of Timely Departures". Return only the title, no quotes, no punctuation at the end.`;
}

// ─── Blob Helpers ─────────────────────────────────────────────────────────────

const MANIFEST_PATH = "doodle/manifest.json";

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
