import { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
        <svg
          className="h-5 w-5 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 17L17 7M17 7H7M17 7v10"
          />
        </svg>
      </div>
      <p className="text-sm leading-relaxed text-white/50">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/40"
          >
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
}
