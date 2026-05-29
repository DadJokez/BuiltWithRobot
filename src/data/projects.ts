export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  /** Live site, case study, demo, or write-up URL. */
  url: string;
  /** GitHub repository URL. Optional — not present on statically-defined projects. */
  githubUrl?: string;
  /** YYYY-MM of the last push / most recent activity. */
  date: string;
}

/**
 * Manual portfolio projects. Add private/client work here without making the
 * underlying repository public.
 */
export const projects: Project[] = [
  {
    id: "jermes",
    title: "Jermes",
    description:
      "A personal fork of Hermes Agent shaped around a custom agent identity, local workflows, skills, and product direction. It keeps close to upstream while carving out a place for a more opinionated AI operating environment.",
    tags: ["Agent", "CLI", "Skills"],
    url: "https://github.com/NousResearch/hermes-agent",
    date: "2026-05",
  },
  {
    id: "AI-workspace",
    title: "AI Workspace",
    description:
      "An internal AI front door for enterprise work: one login, chat with work data, scheduled agents, shared workflows, GitHub MCP integration, and a Cursor or Bedrock-backed runtime.",
    tags: ["Next.js", "Agents", "Enterprise"],
    url: "https://github.com/DadJokez/AI-workspace",
    githubUrl: "https://github.com/DadJokez/AI-workspace",
    date: "2026-05",
  },
  {
    id: "llm-council",
    title: "LLM Council",
    description:
      "A local web app that sends one prompt to several models, lets them review each other's answers anonymously, and asks a chairman model to synthesize the final response.",
    tags: ["FastAPI", "React", "OpenRouter"],
    url: "https://github.com/DadJokez/llm-council",
    githubUrl: "https://github.com/DadJokez/llm-council",
    date: "2026-05",
  },
  {
    id: "ai-intake",
    title: "Talk AI To Me",
    description:
      "A voice-first intake app where someone talks through a project idea with an AI interviewer, then gets a structured brief with the audio, transcript, and next-step summary saved to a dashboard.",
    tags: ["Next.js", "Voice AI", "Briefs"],
    url: "https://ai-intake-peach.vercel.app",
    githubUrl: "https://github.com/DadJokez/ai-intake",
    date: "2026-04",
  },
  {
    id: "sort-of-history",
    title: "Sort of History",
    description:
      "A Wikipedia-style generative encyclopedia that invents semi-true historical articles with total confidence, then saves them so the fake canon can grow article by article.",
    tags: ["Next.js", "Claude", "Neon"],
    url: "https://sort-of-history.vercel.app",
    githubUrl: "https://github.com/DadJokez/sort-of-history",
    date: "2026-05",
  },
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
