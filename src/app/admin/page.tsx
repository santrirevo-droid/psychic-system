import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllMembers } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/session";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const members = await getAllMembers();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-widest text-accent uppercase">
            Admin
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold">
            Kelola Pohon Keluarga
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
        >
          Kembali ke Pohon Keluarga
        </Link>
      </header>

      <AdminDashboard initialMembers={members} />
    </main>
  );
}
