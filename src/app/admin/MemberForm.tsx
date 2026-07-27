"use client";

import { useMemo, useState } from "react";
import type { Member } from "@/lib/db";
import { photoSrc } from "@/lib/photo";
import { MONTH_LABELS } from "@/lib/months";

type MemberFormProps = {
  member: Member | null;
  allMembers: Member[];
  onSaved: (member: Member) => void;
  onCancel: () => void;
};

const GEN_LABEL: Record<number, string> = {
  1: "Generasi 1",
  2: "Generasi 2",
  3: "Generasi 3",
  4: "Generasi 4",
  5: "Generasi 5",
};

export default function MemberForm({ member, allMembers, onSaved, onCancel }: MemberFormProps) {
  const isEdit = !!member;

  const [name, setName] = useState(member?.name ?? "");
  const [gender, setGender] = useState<"L" | "P">(member?.gender ?? "L");
  const [birthYear, setBirthYear] = useState(member?.birth_year?.toString() ?? "");
  const [birthMonth, setBirthMonth] = useState(member?.birth_month?.toString() ?? "");
  const [city, setCity] = useState(member?.city ?? "");
  const [generation, setGeneration] = useState(member?.generation ?? 1);
  const [parentId, setParentId] = useState(member?.parent_id ?? "");
  const [spouseId, setSpouseId] = useState(member?.spouse_id ?? "");
  const [isAdmin, setIsAdmin] = useState(member?.is_admin ?? false);

  const [photoUrl, setPhotoUrl] = useState(member?.photo_url ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(photoSrc(member?.photo_url ?? null) ?? "");

  const [changePin, setChangePin] = useState(!isEdit);
  const [pin, setPin] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const candidateParents = useMemo(
    () => allMembers.filter((m) => m.id !== member?.id && m.generation < generation),
    [allMembers, member?.id, generation]
  );
  const candidateSpouses = useMemo(
    () => allMembers.filter((m) => m.id !== member?.id),
    [allMembers, member?.id]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      let finalPhotoUrl = photoUrl;

      if (photoFile) {
        const form = new FormData();
        form.set("file", photoFile);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Gagal mengunggah foto.");
        finalPhotoUrl = uploadData.url;
      }

      const payload: Record<string, unknown> = {
        name,
        gender,
        birth_year: birthYear ? Number(birthYear) : null,
        birth_month: birthMonth ? Number(birthMonth) : null,
        city: city || null,
        photo_url: finalPhotoUrl || null,
        generation,
        parent_id: parentId || null,
        spouse_id: spouseId || null,
        is_admin: isAdmin,
      };

      if (changePin) {
        payload.changePin = true;
        payload.pin = pin;
      }

      const url = isEdit ? `/api/admin/members/${member!.id}` : "/api/admin/members";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan.");

      onSaved(data.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-card-border bg-accent-soft">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-muted">Foto</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full max-w-full text-sm"
          />
          <input
            value={photoFile ? "" : photoUrl}
            onChange={(e) => {
              setPhotoFile(null);
              setPhotoUrl(e.target.value);
              setPhotoPreview(e.target.value);
            }}
            placeholder="atau tempel URL foto"
            disabled={!!photoFile}
            className="w-full rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Jenis Kelamin</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "L" | "P")}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Generasi</label>
          <select
            value={generation}
            onChange={(e) => setGeneration(Number(e.target.value))}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                {GEN_LABEL[g]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Tahun Lahir</label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Bulan Lahir</label>
          <select
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tidak diketahui</option>
            {Object.entries(MONTH_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Kota</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Orang Tua</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tidak ada</option>
            {candidateParents.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({GEN_LABEL[m.generation]})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Pasangan</label>
          <select
            value={spouseId}
            onChange={(e) => setSpouseId(e.target.value)}
            className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tidak ada</option>
            {candidateSpouses.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({GEN_LABEL[m.generation]})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-card-border p-3">
        {isEdit && !changePin ? (
          <button
            type="button"
            onClick={() => setChangePin(true)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ubah PIN login
          </button>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted">
              {isEdit ? "PIN baru (kosongkan untuk menonaktifkan login)" : "PIN (kosongkan jika tidak perlu login)"}
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="mis. 1234"
              className="rounded-lg border border-card-border bg-card px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
        Jadikan admin (bisa mengelola semua data)
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-card-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
