"use client";

import { useMemo, useState } from "react";
import type { TreeMember } from "@/lib/tree-layout";
import { GENERATION_LABELS } from "@/lib/relationship";
import MemberCard from "./MemberCard";

export default function MemberCardGrid({
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
      if (q && !m.name.toLowerCase().includes(q) && !(m.city ?? "").toLowerCase().includes(q)) continue;
      if (!byGen.has(m.generation)) byGen.set(m.generation, []);
      byGen.get(m.generation)!.push(m);
    }
    return [...byGen.entries()]
      .sort(([a], [b]) => a - b)
      .map(([generation, gm]) => ({ generation, members: gm }));
  }, [members, query]);

  return (
    <div className="flex flex-col gap-10">
      <div className="mx-auto w-full max-w-md">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau kota..."
          className="w-full rounded-full border border-card-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {groups.length === 0 && (
        <p className="text-center text-muted">{emptyMessage ?? "Tidak ada anggota yang cocok."}</p>
      )}

      {groups.map((group, idx) => (
        <section
          key={group.generation}
          className="animate-fade-up"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap sm:text-2xl">
              {GENERATION_LABELS[group.generation] ?? `Generasi ${group.generation}`}
            </h2>
            <div className="h-px flex-1 bg-card-border" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {group.members.map((m) => (
              <MemberCard key={m.id} data={m} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
