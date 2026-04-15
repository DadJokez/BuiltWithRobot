export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  /** Live site URL (homepage). Falls back to GitHub URL when no homepage is set. */
  url: string;
  /** GitHub repository URL. Optional — not present on statically-defined projects. */
  githubUrl?: string;
  /** YYYY-MM of the last push / most recent activity. */
  date: string;
}

/**
 * Static fallback projects — shown if the GitHub API returns nothing.
 * In normal operation the live data from fetchGitHubProjects() takes precedence.
 */
export const projects: Project[] = [
  {
    id: "dadjokez",
    title: "DadJokez",
    description:
      "A dad joke generator that delivers groan-worthy puns on demand. Built for laughs, powered by AI.",
    tags: ["Next.js", "AI", "Fun"],
    url: "https://hello-kappa-khaki.vercel.app/",
    date: "2026-04",
  },
  {
    id: "vendor-spend",
    title: "Vendor Spend",
    description:
      "A vendor and contract management dashboard that tracks software spend, renewals, and vendor relationships in one place.",
    tags: ["Next.js", "Dashboard", "SaaS"],
    url: "https://vendor-spend-management.vercel.app/",
    date: "2026-04",
  },
];
