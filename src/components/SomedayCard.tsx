import { SomedayProject } from "@/lib/someday";

export default function SomedayCard({ project }: { project: SomedayProject }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-baseline gap-2">
        {project.emoji && (
          <span aria-hidden="true" className="text-xl leading-none">
            {project.emoji}
          </span>
        )}
        <h3 className="text-xl font-semibold text-white/90">{project.title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-white/50">{project.description}</p>
      {project.why && (
        <p className="text-xs leading-relaxed text-white/35">
          <span className="font-medium uppercase tracking-widest text-white/40">Blocker · </span>
          {project.why}
        </p>
      )}
    </article>
  );
}
