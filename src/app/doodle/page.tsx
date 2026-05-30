import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
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
    const { manifest } = await loadManifest(2500, { skipRemoteWhenLocal: true });
    entries = [...manifest.entries].sort((a, b) =>
      (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date),
    );
  } catch {
    entries = [];
  }

  return (
    <div className="site-shell">
      <ScrollReveal />
      <main className="archive-page">
        <Link href="/" className="back-link" data-reveal>
          <span aria-hidden="true">←</span>
          <span>Back to portfolio</span>
        </Link>

        <header className="archive-hero" data-reveal>
          <p className="eyebrow">Daily visual log</p>
          <h1>Doodle Archive</h1>
          <p>
            Retro-futurist scenes from the studio: one human, one robot, and one
            oddly formalized everyday task.
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="archive-empty" data-reveal>
            No doodles yet. Check back tomorrow.
          </p>
        ) : (
          <div className="doodle-grid">
            {entries.map((entry) => (
              <figure key={entry.id ?? entry.date} className="doodle-card" data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.imageUrl} alt={entry.title} />
                <figcaption>
                  <span>{entry.title}</span>
                  <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
