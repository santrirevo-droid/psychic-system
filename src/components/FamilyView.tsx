"use client";

import { useState } from "react";
import FamilyTree from "./FamilyTree";
import PersonPanel from "./PersonPanel";
import type { TreeMember } from "@/lib/tree-layout";

export default function FamilyView({
  members,
  isGuestViewer,
}: {
  members: TreeMember[];
  isGuestViewer: boolean;
}) {
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
      <FamilyTree members={members} isGuestViewer={isGuestViewer} onSelect={selectMember} />

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
