"use client";

import { useMemo, useState } from "react";
import MemberCard, { type MemberCardData } from "./MemberCard";

export type GenerationGroup = {
  generation: number;
  label: string;
  members: MemberCardData[];
};

export default function FamilyTree({ groups }: { groups: GenerationGroup[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;

    return groups
      .map((g) => ({
        ...g,
        members: g.members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.city ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [groups, query]);

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

      {filtered.length === 0 && (
        <p className="text-center text-muted">Tidak ada anggota yang cocok.</p>
      )}

      {filtered.map((group, idx) => (
        <section
          key={group.generation}
          className="animate-fade-up"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap sm:text-2xl">
              {group.label}
            </h2>
            <div className="h-px flex-1 bg-card-border" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {group.members.map((m) => (
              <MemberCard key={m.id} data={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
