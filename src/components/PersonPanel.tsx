"use client";

import type { TreeMember } from "@/lib/tree-layout";
import { getFamilyCircle } from "@/lib/relationship";
import { photoSrc } from "@/lib/photo";
import { formatBirth } from "@/lib/months";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function PersonRow({ person, onSelect }: { person: TreeMember; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(person.id)}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-accent-soft"
    >
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-card-border bg-accent-soft">
        {person.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoSrc(person.photo_url)} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-accent">
            {initials(person.name)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{person.name}</p>
        <p className="text-[11px] tracking-wide text-primary uppercase">{person.term}</p>
      </div>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h4>
      <div className="flex flex-col rounded-xl border border-card-border">{children}</div>
    </div>
  );
}

export default function PersonPanel({
  member,
  allMembers,
  canGoBack,
  onSelect,
  onBack,
  onClose,
}: {
  member: TreeMember;
  allMembers: TreeMember[];
  canGoBack: boolean;
  onSelect: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const { parents, siblings, spouse, children } = getFamilyCircle(member, allMembers);
  const birth = formatBirth(member.birth_year, member.birth_month);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-sm flex-col gap-6 overflow-y-auto bg-card p-6 shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          {canGoBack ? (
            <button
              onClick={onBack}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Kembali
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-card-border hover:border-primary hover:text-primary"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-card-border bg-accent-soft shadow-inner">
            {member.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoSrc(member.photo_url)} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-2xl text-accent">
                {initials(member.name)}
              </div>
            )}
          </div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            {member.term}
          </span>
          <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-snug">
            {member.name}
          </h3>
          <p className="text-sm text-muted">
            {[birth, member.city].filter(Boolean).join(" · ") || "Tidak ada data lahir/kota"}
          </p>
        </div>

        {spouse && (
          <Section title="Pasangan">
            <PersonRow person={spouse} onSelect={onSelect} />
          </Section>
        )}

        {parents.length > 0 && (
          <Section title="Orang Tua">
            {parents.map((p) => (
              <PersonRow key={p.id} person={p} onSelect={onSelect} />
            ))}
          </Section>
        )}

        <Section title={`Saudara Kandung (${siblings.length})`}>
          {siblings.length > 0 ? (
            siblings.map((s) => <PersonRow key={s.id} person={s} onSelect={onSelect} />)
          ) : (
            <p className="px-2 py-2 text-sm text-muted">Tidak ada saudara tercatat.</p>
          )}
        </Section>

        <Section title={`Anak (${children.length})`}>
          {children.length > 0 ? (
            children.map((c) => <PersonRow key={c.id} person={c} onSelect={onSelect} />)
          ) : (
            <p className="px-2 py-2 text-sm text-muted">Tidak ada anak tercatat.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
