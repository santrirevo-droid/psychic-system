import { redirect } from "next/navigation";
import { getAllMembers } from "@/lib/db";
import { getSessionMemberId } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const existingSession = await getSessionMemberId();
  if (existingSession) redirect("/");

  const members = await getAllMembers();
  const options = members
    .filter((m) => m.pin_hash)
    .map((m) => ({ id: m.id, name: m.name, generation: m.generation, is_guest: m.is_guest }));

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium tracking-widest text-accent uppercase">
            Pohon Keluarga
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Selamat Datang Kembali
          </h1>
          <p className="mt-3 text-muted">
            Pilih nama Anda dan masukkan PIN untuk melihat silsilah keluarga.
          </p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
          {options.length === 0 ? (
            <p className="text-center text-muted">
              Belum ada anggota keluarga yang terdaftar untuk login.
            </p>
          ) : (
            <LoginForm members={options} />
          )}
        </div>
      </div>
    </main>
  );
}
