import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllMembers } from "@/lib/db";
import { getSessionMemberId } from "@/lib/auth";
import { GENERATION_LABELS, getRelationTerm, groupByGeneration } from "@/lib/relationship";
import type { GenerationGroup } from "@/components/FamilyTree";
import type { TreeMember } from "@/lib/tree-layout";
import FamilyView from "@/components/FamilyView";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const viewerId = await getSessionMemberId();
  if (!viewerId) redirect("/login");

  const members = await getAllMembers();
  const viewer = members.find((m) => m.id === viewerId);
  if (!viewer) redirect("/login");

  const byGeneration = groupByGeneration(members);
  const groups: GenerationGroup[] = [...byGeneration.entries()].map(
    ([generation, list]) => ({
      generation,
      label: GENERATION_LABELS[generation] ?? `Generasi ${generation}`,
      members: list.map((m) => ({
        id: m.id,
        name: m.name,
        birth_year: m.birth_year,
        birth_month: m.birth_month,
        city: m.city,
        photo_url: m.photo_url,
        term: getRelationTerm(viewer, m, members),
        isViewer: m.id === viewer.id,
      })),
    })
  );

  const treeMembers: TreeMember[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    gender: m.gender,
    birth_year: m.birth_year,
    birth_month: m.birth_month,
    city: m.city,
    photo_url: m.photo_url,
    generation: m.generation,
    parent_id: m.parent_id,
    spouse_id: m.spouse_id,
    term: getRelationTerm(viewer, m, members),
    isViewer: m.id === viewer.id,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-medium tracking-widest text-accent uppercase">
            Pohon Keluarga
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Halo, {viewer.name}
          </h1>
          <p className="mt-2 text-muted">
            Berikut keluarga besar Anda, lengkap dengan panggilannya.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {viewer.is_admin && (
            <Link
              href="/admin"
              className="rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
            >
              Kelola Data
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>

      <FamilyView groups={groups} members={treeMembers} />
    </main>
  );
}
