import Link from "next/link";
import { loadManifest } from "@/lib/doodle";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DailyDoodle() {
  let latest = null as Awaited<ReturnType<typeof loadManifest>>["manifest"]["entries"][number] | null;
  try {
    const { manifest } = await loadManifest();
    latest = manifest.entries.at(-1) ?? null;
  } catch {
    latest = null;
  }

  if (!latest) return null;

  return (
    <Link
      href="/doodle"
      className="group mb-16 block"
      aria-label={`Daily doodle: ${latest.title}. View archive.`}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={latest.imageUrl}
          alt={latest.title}
          className="aspect-video w-full rounded-lg border border-white/[0.06] object-cover transition group-hover:border-white/20"
        />
        <div className="mt-3 text-center">
          <div className="text-sm font-medium text-white/80">{latest.title}</div>
          <div className="mt-1 text-xs uppercase tracking-widest text-white/30">
            {formatDate(latest.date)}
          </div>
        </div>
      </div>
    </Link>
  );
}
