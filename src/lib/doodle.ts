import { list, put } from "@vercel/blob";

export type DoodleEntry = {
  // id/createdAt added in the append-always refactor; optional so
  // legacy manifest rows still parse.
  id?: string;
  createdAt?: string;
  date: string; // YYYY-MM-DD
  title: string;
  activity: string;
  setting?: string;
  objects?: string[];
  imageUrl: string;
  titleStyle: "plaque" | "textbook";
};

export type DoodleManifest = {
  entries: DoodleEntry[];
};

export type DoodleScene = {
  activity: string;
  setting: string;
  objects: string[];
};

type MonthTheme = {
  vibe: string;
  examples: string[];
  settings: string[];
  objects: string[];
};

type LoadManifestOptions = {
  skipRemoteWhenLocal?: boolean;
};

const MANIFEST_PATH = "doodle/manifest.json";
const MANIFEST_TIMEOUT_MS = 5000;

// Month-themed scene pools. The LLM picks a richer scene packet each day,
// then checks the manifest context to avoid repeating recent subjects.
export const MONTH_THEMES: Record<number, MonthTheme> = {
  1: {
    vibe: "new beginnings, cozy indoor winter, careful calibration",
    examples: ["brewing tea", "organizing a tiny library", "ice skating on a pond", "reading by a window", "polishing brass gauges", "assembling a calendar machine"],
    settings: ["a snowlit observatory workshop", "a linen-walled planning room", "a civic invention parlor", "a glass-roofed winter laboratory"],
    objects: ["brass thermometers", "folded linen blueprints", "tiny model moons", "enameled switches", "clockwork tea service", "cobalt indicator bulbs"],
  },
  2: {
    vibe: "warmth, handmade things, late winter, affectionate machinery",
    examples: ["knitting a scarf", "baking heart-shaped cookies", "writing a letter", "pressing flowers", "repairing a music box", "tuning a radio valentine"],
    settings: ["a warm correspondence workshop", "a compact bakery lab", "a flower-press archive", "a brass postal observatory"],
    objects: ["ribbon spools", "glass cookie molds", "wax seals", "tiny radio tubes", "linen recipe cards", "coral signal lamps"],
  },
  3: {
    vibe: "early spring, thawing, renewal, small experiments",
    examples: ["planting seedlings", "flying a kite", "watching rain fall", "sweeping the porch", "testing a wind vane", "mapping puddle constellations"],
    settings: ["a rain-glossed garden lab", "a porch-sized weather station", "a greenhouse control room", "a kite-testing courtyard"],
    objects: ["seed trays", "brass wind vanes", "glass rain meters", "linen field maps", "oxide teal watering cans", "cobalt calibration dials"],
  },
  4: {
    vibe: "spring, gentle rain, gardens, civic optimism",
    examples: ["watering tulips", "sharing an umbrella", "birdwatching", "building a birdhouse", "measuring cloud shadows", "launching seed gliders"],
    settings: ["a civic greenhouse pavilion", "a soft rain transit platform", "an indoor birdwatching dome", "a brass-framed garden workshop"],
    objects: ["umbrella ribs", "tulip specimen trays", "birdhouse schematics", "glass cloud jars", "monorail models", "cobalt rain lights"],
  },
  5: {
    vibe: "blooming, outdoors, picnics, gentle spectacle",
    examples: ["having a picnic", "painting landscapes", "cycling through meadows", "catching butterflies", "calibrating a miniature sunrise machine", "cataloging tiny weather jars"],
    settings: ["a future civic workshop", "a meadow observatory pavilion", "a dark archive with a sunlit apparatus", "a picnic laboratory under clean architectural curves"],
    objects: ["brass orbit gauges", "glass weather domes", "folded linen blueprints", "a tiny model monorail", "enamel control knobs", "electric cobalt instrument lights"],
  },
  6: {
    vibe: "early summer, oceans, travel, bright navigation",
    examples: ["sailing a small boat", "collecting seashells", "reading a map", "sending a postcard", "testing a tide clock", "packing a lunar picnic basket"],
    settings: ["a seaside navigation atelier", "a harbor observatory deck", "a postcard sorting terminal", "a compact boat-building workshop"],
    objects: ["brass sextants", "shell specimen drawers", "linen route maps", "glass tide clocks", "teal compass housings", "cobalt harbor beacons"],
  },
  7: {
    vibe: "peak summer, adventure, stars, nocturnal wonder",
    examples: ["stargazing with a telescope", "roasting marshmallows", "fishing from a pier", "chasing fireflies", "assembling a backyard planetarium", "charging a comet lantern"],
    settings: ["a rooftop planetarium shed", "a night pier observatory", "a campfire instrument station", "a dark meadow launch pad"],
    objects: ["portable telescopes", "brass star charts", "glass firefly jars", "linen constellation maps", "coral warming coils", "cobalt comet lamps"],
  },
  8: {
    vibe: "late summer, exploration, heat, outdoor invention",
    examples: ["filling a bird bath", "tending a vegetable garden", "building sandcastles", "painting a mural", "testing a shade machine", "sorting meteor postcards"],
    settings: ["a sun-baked mural yard", "a vegetable observatory shed", "a sandcastle engineering table", "a shaded civic workshop"],
    objects: ["moss-painted planters", "brass shade vanes", "linen mural sketches", "glass irrigation bulbs", "oxide teal garden tools", "cobalt cooling lights"],
  },
  9: {
    vibe: "back-to-school, tinkering, early autumn, practical wonder",
    examples: ["soldering a circuit", "writing in a notebook", "flying a paper airplane", "stacking books", "cataloging invention cards", "projecting classroom constellations"],
    settings: ["a schoolroom invention lab", "a brass library annex", "a paper airplane wind tunnel", "a notebook-filled drafting studio"],
    objects: ["circuit boards", "linen notebooks", "brass bookends", "glass projector lenses", "paper airplane jigs", "cobalt desk lamps"],
  },
  10: {
    vibe: "autumn, pumpkins, warm drinks, theatrical invention",
    examples: ["carving a jack-o-lantern", "raking leaves", "apple picking", "baking a pie", "tuning a harvest automaton", "testing a leaf-color spectrometer"],
    settings: ["an autumn harvest lab", "a brass orchard kiosk", "a cozy pie-making workshop", "a leaf-sorting observatory"],
    objects: ["pumpkin templates", "brass rakes", "linen orchard maps", "glass cider flasks", "coral oven lights", "cobalt spectrometer lenses"],
  },
  11: {
    vibe: "harvest, gratitude, home, shared maintenance",
    examples: ["setting a dinner table", "mending a coat", "sharing soup", "polishing serving instruments", "balancing a gratitude scale", "warming a civic kitchen"],
    settings: ["a communal kitchen laboratory", "a dining room command table", "a repair bench by a warm window", "a harvest archive room"],
    objects: ["linen napkins", "brass serving arms", "glass soup tureens", "moss ceramic bowls", "coral heat lamps", "cobalt timer lights"],
  },
  12: {
    vibe: "winter holidays, light, wonder, ceremonial invention",
    examples: ["decorating a tree", "caroling in the snow", "wrapping a gift", "lighting candles", "assembling a solstice beacon", "sorting tiny winter stars"],
    settings: ["a solstice light workshop", "a snowy civic plaza model room", "a candlelit invention archive", "a winter gift-wrapping terminal"],
    objects: ["brass candle snuffers", "linen gift paper", "glass star ornaments", "teal ribbon reels", "coral warming bulbs", "cobalt beacon lenses"],
  },
};

const STYLE_PROMPT = `A wide 16:9 dark workshop exhibit illustration with optimistic 1950s World's Fair futurism. A friendly chrome robot and a human $ACTIVITY together in $SETTING, surrounded by $OBJECTS. The scene feels hopeful, inventive, and quietly ceremonial, like a future being built by hand. Near-black ink (#0b0a08), warm linen paper glow (#eee2cf), aged linen shadows (#d8c7ad), brass technical linework (#caa66a), oxide teal instruments (#5aa296), muted coral indicator lights (#d47b65), moss undertones (#9ba77a), with a sparing pop of electric cobalt blue (#2f6fff) used only for small glowing instrument details or one focal reflection. Add upward orbit arcs, atomic starbursts, clean architectural curves, and a soft dawn-like glow from the central artifact. Matte gouache, risograph grain, tactile paper texture, elegant negative space. Not glossy, not neon, not plastic, not corporate sci-fi. No text, no letters, no watermark.`;

export function buildImagePrompt(scene: DoodleScene): string {
  return STYLE_PROMPT.replace("$ACTIVITY", scene.activity)
    .replace("$SETTING", scene.setting)
    .replace("$OBJECTS", scene.objects.join(", "));
}

export function recentDoodleContext(manifest: DoodleManifest, limit = 18): DoodleEntry[] {
  return [...manifest.entries]
    .sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date))
    .slice(0, limit);
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

function timeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (typeof AbortSignal === "undefined" || !("timeout" in AbortSignal)) {
    return undefined;
  }
  return AbortSignal.timeout(timeoutMs);
}

function hasVercelRuntimeUrl(): boolean {
  return Boolean(
    process.env.VERCEL_URL ||
      process.env.VERCEL_BRANCH_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
}

export async function loadManifest(
  timeoutMs = MANIFEST_TIMEOUT_MS,
  options: LoadManifestOptions = {},
): Promise<{ manifest: DoodleManifest; url: string | null }> {
  if (
    options.skipRemoteWhenLocal &&
    !hasVercelRuntimeUrl() &&
    process.env.BUILT_WITH_ROBOT_LOAD_REMOTE_BLOB !== "1"
  ) {
    return { manifest: { entries: [] }, url: null };
  }

  const { blobs } = await list({
    prefix: "doodle/manifest",
    abortSignal: timeoutSignal(timeoutMs),
  });
  const existing = blobs.find((b) => b.pathname === MANIFEST_PATH);
  if (!existing) return { manifest: { entries: [] }, url: null };

  const manifestUrl = new URL(existing.url);
  manifestUrl.searchParams.set("read", Date.now().toString());
  const res = await fetch(manifestUrl, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
    signal: timeoutSignal(timeoutMs),
  });
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
