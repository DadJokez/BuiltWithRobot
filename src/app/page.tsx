import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import ScrollReveal from "@/components/ScrollReveal";
import { projects } from "@/data/projects";
import { loadManifest, type DoodleEntry } from "@/lib/doodle";

// Revalidate the page every 24 hours so GitHub data stays fresh without
// calling Haiku on every visitor request.
export const revalidate = 86400;

async function getLatestDoodle(): Promise<DoodleEntry | null> {
  try {
    const { manifest } = await loadManifest(2500, { skipRemoteWhenLocal: true });
    return manifest.entries.at(-1) ?? null;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home() {
  const latestDoodle = await getLatestDoodle();
  const featuredProjects = projects.filter((project) => project.visual.type === "screenshot");
  const featuredIds = new Set(featuredProjects.map((project) => project.id));
  const supportingProjects = projects.filter((project) => !featuredIds.has(project.id));

  return (
    <div className="site-shell">
      <ScrollReveal />
      <main>
        <section className="hero-section">
          <div className="hero-copy" data-reveal>
            <p className="eyebrow">Personal studio / AI-built experiments</p>
            <h1>Built With Robot</h1>
            <p className="hero-lede">
              A portfolio of shipped experiments, strange utilities, and serious work systems
              built through human taste and machine leverage.
            </p>

            <div className="hero-actions">
              <a className="studio-button studio-button-primary" href="#projects">
                Browse projects
              </a>
              <Link className="studio-button" href="/doodle">
                Doodle archive
              </Link>
            </div>

            <dl className="studio-stats" aria-label="Portfolio highlights">
              <div>
                <dt>{projects.length}</dt>
                <dd>portfolio pieces</dd>
              </div>
              <div>
                <dt>daily</dt>
                <dd>visual log</dd>
              </div>
              <div>
                <dt>2026</dt>
                <dd>latest build season</dd>
              </div>
            </dl>
          </div>

          <div className="doodle-hero" data-reveal>
            <div className="doodle-label">
              <span>Today&apos;s studio artifact</span>
              {latestDoodle ? <span>{formatDate(latestDoodle.date)}</span> : null}
            </div>

            {latestDoodle ? (
              <Link
                href="/doodle"
                className="doodle-frame"
                aria-label={`Daily doodle: ${latestDoodle.title}. View archive.`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={latestDoodle.imageUrl} alt={latestDoodle.title} />
                <span className="doodle-title">{latestDoodle.title}</span>
              </Link>
            ) : (
              <Link href="/doodle" className="doodle-frame doodle-frame-empty">
                <span className="doodle-title">Daily doodle warming up</span>
              </Link>
            )}
          </div>
        </section>

        <section id="projects" className="projects-section" aria-labelledby="projects-title">
          <div className="section-heading" data-reveal>
            <p className="eyebrow">Project exhibit</p>
            <h2 id="projects-title">Useful things, odd things, shipped things.</h2>
            <p>
              Public apps get real captured surfaces. Repos and private work are treated as
              project artifacts, so each link says what it actually is.
            </p>
          </div>

          <div className="featured-grid">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} featured />
            ))}
          </div>

          <div className="cabinet-grid">
            {supportingProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      </main>

      <footer className="studio-footer">
        <span>Built with curiosity, collaboration, and a little useful friction.</span>
      </footer>
    </div>
  );
}
