import DailyDoodle from "@/components/DailyDoodle";
import ProjectCard from "@/components/ProjectCard";
import { fetchGitHubProjects } from "@/lib/github";
import { projects as fallbackProjects } from "@/data/projects";

// Revalidate the page every 24 hours so GitHub data stays fresh without
// calling Haiku on every visitor request.
export const revalidate = 86400;

export default async function Home() {
  const githubProjects = await fetchGitHubProjects();
  const projects = githubProjects.length > 0 ? githubProjects : fallbackProjects;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-24 sm:px-8">
        {/* Daily Doodle */}
        <DailyDoodle />

        {/* Hero */}
        <div className="mb-20">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Built With Robot
          </h1>
          <p className="max-w-lg text-lg text-white/50">
            Things we build together — one human, one AI, shipped for real.
          </p>
        </div>

        {/* Project Grid */}
        <section>
          <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-white/30">
            Projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-white/30">
              No projects tagged yet — check back soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-xs text-white/25">
        Built with curiosity and collaboration.
      </footer>
    </div>
  );
}
