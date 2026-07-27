"use client";

import { useState } from "react";
import FamilyTree, { type GenerationGroup } from "./FamilyTree";
import FamilyMindMap from "./FamilyMindMap";
import PersonPanel from "./PersonPanel";
import type { TreeMember } from "@/lib/tree-layout";

type View = "cards" | "map";

export default function FamilyView({
  groups,
  members,
}: {
  groups: GenerationGroup[];
  members: TreeMember[];
}) {
  const [view, setView] = useState<View>("cards");
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

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex items-center gap-1 rounded-full border border-card-border bg-card p-1">
        <button
          onClick={() => setView("cards")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            view === "cards" ? "bg-primary text-primary-foreground" : "text-muted hover:text-primary"
          }`}
        >
          Kartu
        </button>
        <button
          onClick={() => setView("map")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            view === "map" ? "bg-primary text-primary-foreground" : "text-muted hover:text-primary"
          }`}
        >
          Peta Keluarga
        </button>
      </div>

      {view === "cards" ? (
        <FamilyTree groups={groups} onSelect={selectMember} />
      ) : (
        <FamilyMindMap members={members} onSelect={selectMember} />
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
