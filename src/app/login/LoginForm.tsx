"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MemberOption = {
  id: string;
  name: string;
  generation: number;
  is_guest: boolean;
};

const GEN_LABEL: Record<number, string> = {
  1: "Generasi 1",
  2: "Generasi 2",
  3: "Generasi 3",
  4: "Generasi 4",
  5: "Generasi 5",
};

function defaultMemberId(members: MemberOption[]): string {
  return members.find((m) => m.is_guest)?.id ?? members[0]?.id ?? "";
}

export default function LoginForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(() => defaultMemberId(members));
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const grouped = useMemo(() => {
    const byGen = new Map<number, MemberOption[]>();
    for (const m of members) {
      const list = byGen.get(m.generation) ?? [];
      list.push(m);
      byGen.set(m.generation, list);
    }
    return [...byGen.entries()].sort((a, b) => a[0] - b[0]);
  }, [members]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="member" className="text-sm font-medium text-muted">
          Nama Anda
        </label>
        <select
          id="member"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="rounded-xl border border-card-border bg-card px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {grouped.map(([gen, list]) => (
            <optgroup key={gen} label={GEN_LABEL[gen] ?? `Generasi ${gen}`}>
              {list.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="pin" className="text-sm font-medium text-muted">
          PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="rounded-xl border border-card-border bg-card px-4 py-3 text-base tracking-[0.3em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !memberId}
        className="mt-2 rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
