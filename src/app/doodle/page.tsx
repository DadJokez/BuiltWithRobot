import Link from "next/link";
import { loadManifest } from "@/lib/doodle";

export const revalidate = 3600;

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DoodleArchive() {
  let entries: Awaited<ReturnType<typeof loadManifest>>["manifest"]["entries"] = [];
  try {
    const { manifest } = await loadManifest();
    entries = [...manifest.entries].sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    entries = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24 sm:px-8">
        <div className="mb-12">
          <Link
            href="/"
            className="mb-8 inline-block text-xs uppercase tracking-widest text-white/40 hover:text-white/70"
          >
            ← Back
          </Link>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Doodle Archive</h1>
          <p className="max-w-lg text-lg text-white/50">
            A daily retro-futurist illustration. One human, one robot, one mundane task.
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="text-white/40">No doodles yet. Check back tomorrow.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {entries.map((entry) => (
              <figure key={entry.date} className="flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.imageUrl}
                  alt={entry.title}
                  className="aspect-video w-full rounded-lg border border-white/[0.06] object-cover"
                />
                <figcaption className="mt-3">
                  <div className="text-sm font-medium text-white/80">{entry.title}</div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-white/30">
                    {formatDate(entry.date)}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
