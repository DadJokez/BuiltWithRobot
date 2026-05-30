import Image from "next/image";
import { Project } from "@/data/projects";

function ExternalArrow() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M17 7H8M17 7v9" />
    </svg>
  );
}

function ProjectVisual({
  project,
  featured,
}: {
  project: Project;
  featured: boolean;
}) {
  if (project.visual.type === "screenshot") {
    return (
      <div className="project-media project-media-screenshot">
        <Image
          src={project.visual.src}
          alt={project.visual.alt}
          width={1440}
          height={1000}
          sizes={featured ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 1024px) 28vw, 100vw"}
          className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.025]"
          priority={featured}
        />
      </div>
    );
  }

  return (
    <div className="project-media project-artifact" data-accent={project.visual.accent}>
      <div className="artifact-ruler">
        <span>{project.visual.label}</span>
        <span>{project.date}</span>
      </div>
      <div className="artifact-body">
        <div className="artifact-mark">{project.visual.mark}</div>
        <div className="artifact-lines" aria-hidden="true">
          {project.visual.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectCard({
  project,
  featured = false,
}: {
  project: Project;
  featured?: boolean;
}) {
  return (
    <article
      className={featured ? "project-card group project-card-featured" : "project-card group"}
      data-reveal
    >
      <ProjectVisual project={project} featured={featured} />

      <div className="project-copy">
        <div className="project-meta">
          <span className="project-status" data-kind={project.kind}>
            {project.statusLabel}
          </span>
          <span>{project.date}</span>
        </div>

        <h3>{project.title}</h3>
        <p>{project.description}</p>

        <div className="project-tags" aria-label={`${project.title} technologies`}>
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="project-actions">
          <a
            className="project-action project-action-primary"
            href={project.primaryAction.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{project.primaryAction.label}</span>
            <ExternalArrow />
          </a>
          {project.secondaryAction ? (
            <a
              className="project-action"
              href={project.secondaryAction.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{project.secondaryAction.label}</span>
              <ExternalArrow />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
