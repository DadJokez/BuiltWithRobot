import Anthropic from "@anthropic-ai/sdk";
import { Project } from "@/data/projects";

const USERNAME = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "DadJokez";

const GH_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "BuiltWithRobot/1.0",
};

/** Convert a kebab-case repo name to a human-readable title. */
function formatTitle(name: string): string {
  return name
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Strip markdown syntax down to plain prose for LLM input. */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
    .replace(/`[^`]+`/g, "") // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/#{1,6}\s+/g, "") // ATX headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/^\s*[-*+]\s+/gm, "") // unordered list items
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list items
    .replace(/\n{3,}/g, "\n\n") // collapse excessive blank lines
    .trim();
}

/**
 * Return true if the text looks like a Haiku error/confusion response rather
 * than an actual summary (e.g. "I don't have access to…", "I'm unable to…").
 */
function looksLikeHaikuError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.startsWith("i don't") ||
    lower.startsWith("i do not") ||
    lower.startsWith("i'm unable") ||
    lower.startsWith("i am unable") ||
    lower.startsWith("i cannot") ||
    lower.startsWith("i can't") ||
    lower.includes("don't have access") ||
    lower.includes("do not have access") ||
    lower.includes("no readme") ||
    lower.includes("no content") ||
    lower.includes("?") // ends with a question — almost certainly confusion
  );
}

/**
 * Fetch a repo's README and return plain text with markdown stripped.
 * Returns null if the fetch fails, the response is non-200, or there is no
 * meaningful content (< 50 chars after stripping).
 *
 * NOTE: revalidate is set to 3600 (1 h) during development so a stale README
 * doesn't persist for a full day. Bump this back to 86400 for production.
 */
async function fetchReadme(repo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${USERNAME}/${repo}/readme`,
      {
        headers: GH_HEADERS,
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: string };
    if (!data.content) return null;
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const plain = stripMarkdown(decoded);
    // Require meaningful content before bothering Haiku.
    if (plain.length < 50) return null;
    return plain;
  } catch {
    return null;
  }
}

/** Ask Claude Haiku to summarize a README into 2-3 sentences. */
async function summarizeReadme(
  plainText: string,
  repoName: string,
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Summarize this README for the "${formatTitle(repoName)}" project in 2-3 concise sentences. Focus on what it does and who it's for. Return only the summary, no preamble.\n\n${plainText.slice(0, 3000)}`,
      },
    ],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

interface GitHubRepo {
  name: string;
  html_url: string;
  homepage: string | null;
  topics: string[];
  pushed_at: string;
  description: string | null;
}

/**
 * Fetch all public repos for the configured username that are tagged with
 * the "built-with-robot" topic, sorted newest-pushed first.
 *
 * Each repo's README is fetched and summarized by Claude Haiku — but only
 * when there is at least 50 characters of meaningful plain-text content.
 * Empty, stub, or unreadable READMEs fall back to the repo description.
 */
export async function fetchGitHubProjects(): Promise<Project[]> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=user:${USERNAME}+topic:built-with-robot&sort=pushed&order=desc`,
      {
        headers: GH_HEADERS,
        next: { revalidate: 86400 },
      },
    );

    if (!res.ok) {
      console.error(
        `[github] search API error: ${res.status} ${res.statusText}`,
      );
      return [];
    }

    const data = (await res.json()) as { items?: GitHubRepo[] };
    const repos: GitHubRepo[] = data.items ?? [];

    if (repos.length === 0) return [];

    const projects = await Promise.all(
      repos.map(async (repo): Promise<Project> => {
        const fallback = repo.description?.trim() || "";

        // fetchReadme already returns null when content is too short (<50 chars).
        const readme = await fetchReadme(repo.name);

        let description = fallback;

        if (readme) {
          try {
            const summary = await summarizeReadme(readme, repo.name);
            // Reject responses that look like Haiku confusion rather than summaries.
            if (summary && !looksLikeHaikuError(summary)) {
              description = summary;
            } else {
              console.warn(
                `[github] Haiku returned a suspicious response for ${repo.name}, using fallback`,
              );
            }
          } catch (err) {
            console.warn(
              `[github] Haiku summarization failed for ${repo.name}:`,
              err,
            );
          }
        }

        return {
          id: repo.name,
          title: formatTitle(repo.name),
          description: description || "No description available.",
          tags: repo.topics.filter((t) => t !== "built-with-robot"),
          url: repo.homepage || repo.html_url,
          githubUrl: repo.html_url,
          date: repo.pushed_at.slice(0, 7), // YYYY-MM
        };
      }),
    );

    return projects;
  } catch (err) {
    console.error("[github] fetchGitHubProjects failed:", err);
    return [];
  }
}
