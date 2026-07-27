"use client";

import { useMemo, useState } from "react";
import FamilyTree from "./FamilyTree";
import MemberCardGrid from "./MemberCardGrid";
import NameListView from "./NameListView";
import PersonPanel from "./PersonPanel";
import { isMahram } from "@/lib/relationship";
import type { TreeMember } from "@/lib/tree-layout";

type View = "nasab" | "kartu" | "nama" | "mahram";

const VIEW_TABS: { id: View; label: string }[] = [
  { id: "nasab", label: "Nasab" },
  { id: "kartu", label: "Kartu" },
  { id: "nama", label: "Nama" },
  { id: "mahram", label: "Mahram" },
];

export default function FamilyView({
  members,
  isGuestViewer,
}: {
  members: TreeMember[];
  isGuestViewer: boolean;
}) {
  const [view, setView] = useState<View>("nasab");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  function selectMember(id: string) {
    setHistory((h) => (selectedId ? [...h, selectedId] : h));
    setSelectedId(id);
  }
  function goBack() {
    setHistory((h) => {
      if (h.length === 0) {
        setSelectedId(null);
        return h;
      }
      const next = [...h];
      const prev = next.pop()!;
      setSelectedId(prev);
      return next;
    });
  }
  function closePanel() {
    setSelectedId(null);
    setHistory([]);
  }

  const selectedMember = selectedId ? members.find((m) => m.id === selectedId) : undefined;

  const mahramMembers = useMemo(
    () => members.filter((m) => !m.isViewer && isMahram(m.term)),
    [members]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex items-center gap-1 rounded-full border border-card-border bg-card p-1">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              view === tab.id ? "bg-primary text-primary-foreground" : "text-muted hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "nasab" && (
        <FamilyTree members={members} isGuestViewer={isGuestViewer} onSelect={selectMember} />
      )}
      {view === "kartu" && <MemberCardGrid members={members} onSelect={selectMember} />}
      {view === "nama" && <NameListView members={members} onSelect={selectMember} />}
      {view === "mahram" && (
        <MemberCardGrid
          members={mahramMembers}
          onSelect={selectMember}
          emptyMessage="Tidak ada mahram lain yang tercatat."
        />
      )}

      {selectedMember && (
        <PersonPanel
          member={selectedMember}
          allMembers={members}
          canGoBack={history.length > 0}
          onSelect={selectMember}
          onBack={goBack}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
