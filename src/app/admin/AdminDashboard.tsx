"use client";

import { useMemo, useState } from "react";
import type { Member } from "@/lib/db";
import MemberForm from "./MemberForm";

const GEN_LABEL: Record<number, string> = {
  1: "Generasi 1",
  2: "Generasi 2",
  3: "Generasi 3",
  4: "Generasi 4",
  5: "Generasi 5",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AdminDashboard({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byName = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members]
  );

  const grouped = useMemo(() => {
    const groups = new Map<number, Member[]>();
    for (const m of members) {
      const list = groups.get(m.generation) ?? [];
      list.push(m);
      groups.set(m.generation, list);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [members]);

  function handleSaved(saved: Member) {
    setMembers((prev) => {
      const exists = prev.some((m) => m.id === saved.id);
      return exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved];
    });
    setEditing(null);
    setCreating(false);
  }

  async function handleDelete(member: Member) {
    if (!confirm(`Hapus ${member.name} dari pohon keluarga?`)) return;
    setError(null);
    setDeletingId(member.id);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menghapus.");
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setDeletingId(null);
    }
  }

  const formOpen = creating || editing !== null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="text-muted">{members.length} anggota terdaftar</p>
        <button
          onClick={() => setCreating(true)}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + Tambah Anggota
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-8">
        {grouped.map(([gen, list]) => (
          <section key={gen}>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
              {GEN_LABEL[gen] ?? `Generasi ${gen}`}
            </h2>
            <div className="overflow-hidden rounded-xl border border-card-border bg-card">
              <table className="w-full text-left text-sm">
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-b border-card-border last:border-0">
                      <td className="w-14 p-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-accent-soft">
                          {m.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-accent">
                              {initials(m.name)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {m.name}
                          {m.is_admin && (
                            <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {m.birth_year ? `Lahir ${m.birth_year}` : null}
                          {m.birth_year && m.city ? " · " : null}
                          {m.city}
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted">
                        {m.parent_id ? `Anak dari ${byName.get(m.parent_id) ?? "?"}` : "-"}
                      </td>
                      <td className="p-3 text-xs">
                        {m.pin_hash ? (
                          <span className="text-primary">Bisa login</span>
                        ) : (
                          <span className="text-muted">Tanpa login</span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditing(m)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={deletingId === m.id}
                          className="rounded-full px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                        >
                          {deletingId === m.id ? "..." : "Hapus"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">
              {editing ? `Edit ${editing.name}` : "Tambah Anggota"}
            </h2>
            <MemberForm
              member={editing}
              allMembers={members}
              onSaved={handleSaved}
              onCancel={() => {
                setEditing(null);
                setCreating(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
