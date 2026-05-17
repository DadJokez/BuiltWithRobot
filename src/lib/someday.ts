import { promises as fs } from "node:fs";
import path from "node:path";

export interface SomedayProject {
  /** Slugified id derived from the title. */
  id: string;
  /** Leading emoji from the heading, if any (e.g. "🎙️"). */
  emoji: string | null;
  /** Title without emoji. */
  title: string;
  /** First descriptive paragraph. */
  description: string;
  /** The "Why it's someday" reason — what's blocking it from being built now. */
  why: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Split an `## Heading` into a leading emoji (if present) and the rest.
function splitHeading(raw: string): { emoji: string | null; title: string } {
  const trimmed = raw.trim();
  // Match a leading emoji-ish token followed by whitespace then the title.
  const match = trimmed.match(/^(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic})*)\s+(.*)$/u);
  if (match) return { emoji: match[1], title: match[2].trim() };
  return { emoji: null, title: trimmed };
}

/**
 * Parse `someday.md` into structured entries. Each entry is delimited by `---`
 * and contains an `## Heading`, a description paragraph, and a
 * `**Why it's someday:**` paragraph.
 *
 * Read at build time / on ISR cache miss — the file is checked into the repo
 * so there's no I/O on the hot path under cached requests.
 */
export async function loadSomeday(): Promise<SomedayProject[]> {
  const file = path.join(process.cwd(), "someday.md");
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf-8");
  } catch {
    return [];
  }

  // Split into sections by `---` delimiters, drop the leading intro section
  // (which has the H1 + tagline but no entry).
  const sections = raw
    .split(/^---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

  const entries: SomedayProject[] = [];

  for (const section of sections) {
    const headingMatch = section.match(/^##\s+(.+)$/m);
    if (!headingMatch) continue;

    const { emoji, title } = splitHeading(headingMatch[1]);

    // Everything after the heading line, split on blank lines into paragraphs.
    const afterHeading = section.slice(headingMatch.index! + headingMatch[0].length).trim();
    const paragraphs = afterHeading
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (paragraphs.length === 0) continue;

    let description = "";
    let why = "";
    for (const p of paragraphs) {
      const whyMatch = p.match(/^\*\*Why it's someday:\*\*\s*(.+)$/i);
      if (whyMatch) {
        why = whyMatch[1].trim();
      } else if (!description) {
        description = p;
      }
    }

    if (!description) continue;
    entries.push({ id: slugify(title), emoji, title, description, why });
  }

  return entries;
}
