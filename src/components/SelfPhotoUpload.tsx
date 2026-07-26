"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { photoSrc } from "@/lib/photo";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function SelfPhotoUpload({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Format foto harus JPG atau PNG.");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/profile/photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengunggah foto.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const src = preview ?? photoSrc(photoUrl);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16 shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-card-border bg-accent-soft shadow-inner">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-display)] text-lg text-accent">
              {initials(name)}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white">
              ...
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Ubah foto wajah"
          aria-label="Ubah foto wajah"
          className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.5 4.5l4 4L7 19H3v-4L13.5 4.5Z" />
          </svg>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="max-w-[10rem] text-center text-[11px] text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
