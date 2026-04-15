import DailyDoodle from "@/components/DailyDoodle";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export const revalidate = 3600;

export default function Home() {
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-xs text-white/25">
        Built with curiosity and collaboration.
      </footer>
    </div>
  );
}
