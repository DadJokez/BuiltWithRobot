import { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  // If a separate homepage URL is set, surface both Live + Code. Otherwise the
  // single URL is the GitHub repo and the secondary link would be redundant.
  const hasDistinctLive =
    Boolean(project.githubUrl) && project.url !== project.githubUrl;
  const primaryHref = project.url;
  const primaryLabel = hasDistinctLive ? "Live" : "Code";

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-1">
      <a
        href={primaryHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 rounded-2xl"
        aria-label={`${project.title} — ${primaryLabel.toLowerCase()}`}
      />
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
      {project.tags.length > 0 && (
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
      )}
      {hasDistinctLive && (
        <div className="relative z-10 mt-auto flex gap-3 pt-2 text-xs uppercase tracking-widest">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 transition hover:text-white"
          >
            Live ↗
          </a>
          <span aria-hidden="true" className="text-white/15">
            ·
          </span>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 transition hover:text-white"
          >
            Code ↗
          </a>
        </div>
      )}
    </div>
  );
}
