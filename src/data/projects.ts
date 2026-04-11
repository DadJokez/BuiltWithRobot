export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  date: string;
}

export const projects: Project[] = [
  {
    id: "dadjokez",
    title: "DadJokez",
    description:
      "A dad joke generator that delivers groan-worthy puns on demand. Built for laughs, powered by AI.",
    tags: ["Next.js", "AI", "Fun"],
    url: "https://dadjokez.com",
    date: "2026-04",
  },
];
