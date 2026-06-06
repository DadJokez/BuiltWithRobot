export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  kind: "live" | "repo" | "private";
  statusLabel: string;
  visual:
    | {
        type: "screenshot";
        src: string;
        alt: string;
      }
    | {
        type: "artifact";
        accent: "teal" | "coral" | "brass";
        label: string;
        mark: string;
        lines: string[];
      };
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  /** Canonical destination for older consumers of this data. */
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
      "An enterprise lab for turning Jermes into the governed agent runtime behind an AI app shell, with specs, approval docs, adapters, and AWS pilot scaffolding.",
    tags: ["Agent", "Enterprise", "AWS"],
    kind: "private",
    statusLabel: "Private repo",
    visual: {
      type: "artifact",
      accent: "brass",
      label: "Enterprise lab",
      mark: "J",
      lines: ["Governed agent runtime", "Approval proof", "AWS pilot scaffold"],
    },
    primaryAction: {
      label: "Open lab repo",
      href: "https://github.com/DadJokez/jermes-enterprise-lab",
    },
    secondaryAction: {
      label: "Upstream Hermes",
      href: "https://github.com/NousResearch/hermes-agent",
    },
    url: "https://github.com/DadJokez/jermes-enterprise-lab",
    githubUrl: "https://github.com/DadJokez/jermes-enterprise-lab",
    date: "2026-05",
  },
  {
    id: "AI-workspace",
    title: "AI Hub",
    description:
      "An internal AI front door for enterprise work: one login, chat with work data, scheduled agents, shared workflows, GitHub MCP integration, and a Cursor or Bedrock-backed runtime.",
    tags: ["Next.js", "Agents", "Enterprise"],
    kind: "repo",
    statusLabel: "Source repo",
    visual: {
      type: "artifact",
      accent: "teal",
      label: "Workspace system",
      mark: "AI",
      lines: ["Unified work chat", "Scheduled agents", "Enterprise data surface"],
    },
    primaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/AI-workspace",
    },
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
    kind: "repo",
    statusLabel: "Source repo",
    visual: {
      type: "artifact",
      accent: "coral",
      label: "Model council",
      mark: "LC",
      lines: ["Multi-model prompting", "Anonymous peer review", "Chairman synthesis"],
    },
    primaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/llm-council",
    },
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
    kind: "live",
    statusLabel: "Live app",
    visual: {
      type: "artifact",
      accent: "brass",
      label: "Voice intake",
      mark: "TA",
      lines: ["Interview flow", "Transcript and audio", "Structured project brief"],
    },
    primaryAction: {
      label: "Open app",
      href: "https://talk-ai-to-me.vercel.app",
    },
    secondaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/ai-intake",
    },
    url: "https://talk-ai-to-me.vercel.app",
    githubUrl: "https://github.com/DadJokez/ai-intake",
    date: "2026-05",
  },
  {
    id: "sort-of-history",
    title: "Sort of History",
    description:
      "A Wikipedia-style generative encyclopedia that invents semi-true historical articles with total confidence, then saves them so the fake canon can grow article by article.",
    tags: ["Next.js", "Claude", "Neon"],
    kind: "live",
    statusLabel: "Live app",
    visual: {
      type: "screenshot",
      src: "/projects/sort-of-history.png",
      alt: "Sort of History homepage screenshot",
    },
    primaryAction: {
      label: "Open site",
      href: "https://sort-of-history.vercel.app",
    },
    secondaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/sort-of-history",
    },
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
    kind: "live",
    statusLabel: "Live app",
    visual: {
      type: "screenshot",
      src: "/projects/dadjokez.png",
      alt: "DadJokez homepage screenshot",
    },
    primaryAction: {
      label: "Open site",
      href: "https://hello-kappa-khaki.vercel.app/",
    },
    secondaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/hello",
    },
    url: "https://hello-kappa-khaki.vercel.app/",
    githubUrl: "https://github.com/DadJokez/hello",
    date: "2026-04",
  },
  {
    id: "vendor-spend",
    title: "Vendor Spend",
    description:
      "A vendor and contract management dashboard that tracks software spend, renewals, and vendor relationships in one place.",
    tags: ["Next.js", "Dashboard", "SaaS"],
    kind: "private",
    statusLabel: "Login required",
    visual: {
      type: "artifact",
      accent: "teal",
      label: "Private dashboard",
      mark: "VS",
      lines: ["Vendor spend tracking", "Renewal watchlist", "Contract operations"],
    },
    primaryAction: {
      label: "Open app",
      href: "https://vendor-spend-management.vercel.app/",
    },
    secondaryAction: {
      label: "View source",
      href: "https://github.com/DadJokez/vendor-spend-management",
    },
    url: "https://vendor-spend-management.vercel.app/",
    githubUrl: "https://github.com/DadJokez/vendor-spend-management",
    date: "2026-04",
  },
];
