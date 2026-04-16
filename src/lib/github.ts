import Anthropic from "@anthropic-ai/sdk";
import { Project } from "@/data/projects";

const USERNAME =
  process.env.NEXT_PUBLIC_GITHUB_USERNAME || "DadJokez";

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

/** Fetch a repo's README and return plain text, or null if unavailable. */
async function fetchReadme(repo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${USERNAME}/${repo}/readme`,
      {
        headers: GH_HEADERS,
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: string };
    if (!data.content) return null;
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return stripMarkdown(decoded);
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
 * Each repo's README is fetched and summarized by Claude Haiku. The whole
 * result is cached via Next.js ISR (revalidate = 86400) so Haiku only runs
 * on a cache miss, not on every visitor request.
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
      console.error(`[github] search API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as { items?: GitHubRepo[] };
    const repos: GitHubRepo[] = data.items ?? [];

    if (repos.length === 0) return [];

    const projects = await Promise.all(
      repos.map(async (repo): Promise<Project> => {
        // Attempt to get a Haiku summary from the README.
        const readme = await fetchReadme(repo.name);
        let description = repo.description ?? "";

        if (readme && readme.length >= 50) {
          try {
            description = await summarizeReadme(readme, repo.name);
          } catch (err) {
            console.warn(`[github] Haiku summarization failed for ${repo.name}:`, err);
            // Fall back to repo description on Haiku error.
            description = repo.description ?? "";
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
