"use client";

import { useMemo, useState } from "react";
import type { TreeMember } from "@/lib/tree-layout";
import { GENERATION_LABELS } from "@/lib/relationship";

export default function NameListView({
  members,
  onSelect,
  emptyMessage,
}: {
  members: TreeMember[];
  onSelect?: (id: string) => void;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byGen = new Map<number, TreeMember[]>();
    for (const m of members) {
      if (q && !m.name.toLowerCase().includes(q)) continue;
      if (!byGen.has(m.generation)) byGen.set(m.generation, []);
      byGen.get(m.generation)!.push(m);
    }
    return [...byGen.entries()]
      .sort(([a], [b]) => a - b)
      .map(([generation, gm]) => ({
        generation,
        members: [...gm].sort((a, b) => a.name.localeCompare(b.name, "id")),
      }));
  }, [members, query]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama..."
        className="w-full rounded-full border border-card-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />

      {groups.length === 0 && (
        <p className="text-center text-muted">{emptyMessage ?? "Tidak ada anggota yang cocok."}</p>
      )}

      {groups.map((group) => (
        <section key={group.generation}>
          <div className="mb-2 flex items-center gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-accent uppercase">
              {GENERATION_LABELS[group.generation] ?? `Generasi ${group.generation}`}
            </h2>
            <div className="h-px flex-1 bg-card-border" />
          </div>

          <ul className="divide-y divide-card-border overflow-hidden rounded-xl border border-card-border bg-card">
            {group.members.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(m.id)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-accent-soft ${
                    m.isViewer ? "bg-accent-soft/60 font-semibold" : ""
                  }`}
                >
                  <span className="truncate">
                    {m.name}
                    {m.isViewer && <span className="ml-2 text-xs font-medium text-accent">(Anda)</span>}
                  </span>
                  <span className="shrink-0 text-xs font-medium tracking-wide text-primary uppercase">
                    {m.term}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
