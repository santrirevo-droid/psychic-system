import type { RelationTerm } from "@/lib/relationship";
import { photoSrc } from "@/lib/photo";
import { formatBirth } from "@/lib/months";

export type MemberCardData = {
  id: string;
  name: string;
  birth_year: number | null;
  birth_month: number | null;
  city: string | null;
  photo_url: string | null;
  term: RelationTerm;
  isViewer: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function MemberCard({
  data,
  onSelect,
  dimmed,
}: {
  data: MemberCardData;
  onSelect?: (id: string) => void;
  dimmed?: boolean;
}) {
  const { id, name, birth_year, birth_month, city, photo_url, term, isViewer } = data;
  const birth = formatBirth(birth_year, birth_month);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={`group relative flex h-full w-full flex-col items-center rounded-2xl border bg-card p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        isViewer
          ? "border-accent ring-2 ring-accent/40"
          : "border-card-border"
      } ${dimmed ? "opacity-25" : "opacity-100"}`}
    >
      {isViewer && (
        <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white shadow">
          Anda
        </span>
      )}

      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-card-border bg-accent-soft shadow-inner sm:h-24 sm:w-24">
        {photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc(photo_url)}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-accent">
            {initials(name)}
          </div>
        )}
      </div>

      <span className="mt-3 text-xs font-semibold tracking-wide text-primary uppercase">
        {term}
      </span>
      <h3 className="mt-0.5 w-full truncate font-[family-name:var(--font-display)] text-lg font-semibold leading-snug">
        {name}
      </h3>

      <div className="mt-2 flex w-full flex-col gap-0.5 text-sm text-muted">
        {birth && <span className="truncate">Lahir {birth}</span>}
        {city && <span className="truncate">{city}</span>}
      </div>
    </button>
  );
}
