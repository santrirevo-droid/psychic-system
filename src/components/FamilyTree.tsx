"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { computeTreeLayout, type TreeMember } from "@/lib/tree-layout";
import { getFamilyCircle } from "@/lib/relationship";
import MemberCard from "./MemberCard";

const NODE_W = 210;
const NODE_H = 240;
const COL_W = 240;
const ROW_H = 300;
const PADDING = 60;
const BADGE_MARGIN = 26;

function initialReveal(viewer: TreeMember, members: TreeMember[]): Set<string> {
  const ids = new Set<string>([viewer.id]);
  const circle = getFamilyCircle(viewer, members);
  for (const p of circle.parents) ids.add(p.id);
  for (const s of circle.siblings) ids.add(s.id);
  for (const c of circle.children) ids.add(c.id);
  if (circle.spouse) ids.add(circle.spouse.id);
  return ids;
}

/** Shortest path between two members over parent-child and spouse-spouse edges, treated as one undirected family graph. */
function findPath(fromId: string, toId: string, members: TreeMember[]): string[] {
  const adj = new Map<string, Set<string>>();
  const addEdge = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (const m of members) {
    if (m.parent_id) addEdge(m.id, m.parent_id);
    if (m.spouse_id) addEdge(m.id, m.spouse_id);
  }

  if (fromId === toId) return [fromId];
  const prev = new Map<string, string | null>([[fromId, null]]);
  const queue = [fromId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === toId) break;
    for (const next of adj.get(cur) ?? []) {
      if (!prev.has(next)) {
        prev.set(next, cur);
        queue.push(next);
      }
    }
  }
  if (!prev.has(toId)) return [];

  const path: string[] = [];
  let cur: string | null = toId;
  while (cur !== null) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  return path.reverse();
}

function ExpandBadge({
  position,
  title,
  onClick,
}: {
  position: "up" | "down" | "side";
  title: string;
  onClick: () => void;
}) {
  const positionClass =
    position === "up"
      ? "-top-3 left-1/2 -translate-x-1/2"
      : position === "down"
        ? "-bottom-3 left-1/2 -translate-x-1/2"
        : "top-1/2 -right-3 -translate-y-1/2";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-label={title}
      className={`absolute ${positionClass} flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow transition hover:opacity-90`}
    >
      +
    </button>
  );
}

export default function FamilyTree({
  members,
  isGuestViewer,
  onSelect,
}: {
  members: TreeMember[];
  isGuestViewer: boolean;
  onSelect?: (id: string) => void;
}) {
  const viewer = useMemo(() => members.find((m) => m.isViewer), [members]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  function computeInitial(): Set<string> {
    if (isGuestViewer || !viewer) return new Set(members.map((m) => m.id));
    return initialReveal(viewer, members);
  }

  const [revealed, setRevealed] = useState<Set<string>>(computeInitial);
  const [scale, setScale] = useState(1);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  function reveal(ids: string[]) {
    if (ids.length === 0) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  function resetView() {
    setRevealed(computeInitial());
  }

  function expandUp(personId: string) {
    const person = byId.get(personId);
    if (person) reveal(getFamilyCircle(person, members).parents.map((p) => p.id));
  }
  function expandDown(personId: string) {
    const person = byId.get(personId);
    if (person) reveal(getFamilyCircle(person, members).children.map((c) => c.id));
  }
  function expandSiblings(personId: string) {
    const person = byId.get(personId);
    if (person) reveal(getFamilyCircle(person, members).siblings.map((s) => s.id));
  }

  function canExpandUp(personId: string) {
    const person = byId.get(personId);
    return !!person && getFamilyCircle(person, members).parents.some((p) => !revealed.has(p.id));
  }
  function canExpandDown(personId: string) {
    const person = byId.get(personId);
    return !!person && getFamilyCircle(person, members).children.some((c) => !revealed.has(c.id));
  }
  function canExpandSiblings(personId: string) {
    const person = byId.get(personId);
    return !!person && getFamilyCircle(person, members).siblings.some((s) => !revealed.has(s.id));
  }

  const revealedMembers = useMemo(
    () => members.filter((m) => revealed.has(m.id)),
    [members, revealed]
  );
  const positions = useMemo(() => computeTreeLayout(revealedMembers), [revealedMembers]);

  const { minOrder, maxOrder, minGen, maxGen } = useMemo(() => {
    let minOrder = Infinity, maxOrder = -Infinity, minGen = Infinity, maxGen = -Infinity;
    for (const m of revealedMembers) {
      const p = positions.get(m.id);
      if (p) {
        minOrder = Math.min(minOrder, p.x);
        maxOrder = Math.max(maxOrder, p.x);
      }
      minGen = Math.min(minGen, m.generation);
      maxGen = Math.max(maxGen, m.generation);
    }
    if (!Number.isFinite(minOrder)) {
      minOrder = 0;
      maxOrder = 0;
      minGen = 1;
      maxGen = 1;
    }
    return { minOrder, maxOrder, minGen, maxGen };
  }, [revealedMembers, positions]);

  function px(order: number) {
    return (order - minOrder) * COL_W + PADDING + NODE_W / 2;
  }
  function py(gen: number) {
    return (gen - minGen) * ROW_H + PADDING + NODE_H / 2;
  }

  const width = (maxOrder - minOrder) * COL_W + NODE_W + PADDING * 2;
  const height = (maxGen - minGen) * ROW_H + NODE_H + PADDING * 2;

  function focusOnMember(id: string, behavior: ScrollBehavior = "smooth") {
    const container = scrollRef.current;
    const person = byId.get(id);
    const pos = positions.get(id);
    if (!container || !pos || !person) return;
    container.scrollTo({
      left: px(pos.x) - container.clientWidth / 2,
      top: py(person.generation) - container.clientHeight / 2,
      behavior,
    });
  }

  // Center on the logged-in viewer as soon as the diagram mounts (before
  // paint, via useLayoutEffect, so there's no visible jump from top-left).
  useLayoutEffect(() => {
    if (viewer) focusOnMember(viewer.id, "instant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, members]);

  function jumpTo(id: string) {
    setQuery("");
    if (!viewer) return;
    const path = findPath(viewer.id, id, members);
    reveal(path);
    requestAnimationFrame(() => requestAnimationFrame(() => focusOnMember(id)));
  }

  const spouseLines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  const dropLines: { d: string; key: string }[] = [];

  for (const m of revealedMembers) {
    const pos = positions.get(m.id);
    if (!pos) continue;

    if (m.spouse_id && m.id < m.spouse_id && revealed.has(m.spouse_id)) {
      const spouse = byId.get(m.spouse_id);
      const spousePos = spouse ? positions.get(spouse.id) : undefined;
      if (spouse && spousePos && spousePos.y === pos.y) {
        spouseLines.push({
          x1: px(pos.x),
          y1: py(m.generation),
          x2: px(spousePos.x),
          y2: py(spouse.generation),
          key: `${m.id}-${spouse.id}`,
        });
      }
    }

    if (m.parent_id && revealed.has(m.parent_id)) {
      const parent = byId.get(m.parent_id);
      const parentPos = parent ? positions.get(parent.id) : undefined;
      if (parent && parentPos) {
        const spouse = parent.spouse_id ? byId.get(parent.spouse_id) : undefined;
        const spousePos = spouse && revealed.has(spouse.id) ? positions.get(spouse.id) : undefined;
        const originX =
          spouse && spousePos && spousePos.y === parentPos.y
            ? (px(parentPos.x) + px(spousePos.x)) / 2
            : px(parentPos.x);
        const originY = py(parent.generation) + NODE_H / 2;
        const childTopY = py(m.generation) - NODE_H / 2;
        const busY = (originY + childTopY) / 2;
        const childX = px(pos.x);
        dropLines.push({
          d: `M ${originX} ${originY} L ${originX} ${busY} L ${childX} ${busY} L ${childX} ${childTopY}`,
          key: `${parent.id}-${m.id}`,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 sm:flex-row">
        <div className="relative w-full">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama untuk lompat ke sana..."
            className="w-full rounded-full border border-card-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-card-border bg-card shadow-lg">
              {suggestions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => jumpTo(m.id)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm hover:bg-accent-soft"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs tracking-wide text-primary uppercase">{m.term}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isGuestViewer && (
            <button
              onClick={resetView}
              className="shrink-0 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium whitespace-nowrap hover:border-primary hover:text-primary"
            >
              Reset Tampilan
            </button>
          )}
          {viewer && (
            <button
              onClick={() => focusOnMember(viewer.id)}
              className="shrink-0 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium whitespace-nowrap hover:border-primary hover:text-primary"
            >
              Fokus ke Saya
            </button>
          )}
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-card-border bg-card p-1">
            <button
              onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
              className="h-8 w-8 rounded-full text-lg font-medium hover:bg-accent-soft"
              aria-label="Perkecil"
            >
              −
            </button>
            <button
              onClick={() => setScale(1)}
              className="px-2 text-xs font-medium text-muted hover:text-primary"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => setScale((s) => Math.min(1.5, +(s + 0.15).toFixed(2)))}
              className="h-8 w-8 rounded-full text-lg font-medium hover:bg-accent-soft"
              aria-label="Perbesar"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="w-full max-h-[75vh] overflow-auto rounded-2xl border border-card-border bg-card/50 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width * scale}
          height={height * scale}
          className="block"
          style={{ transition: "width 0.15s, height 0.15s" }}
        >
          <g className="stroke-card-border" strokeWidth={2} fill="none">
            {dropLines.map((l) => (
              <path key={l.key} d={l.d} />
            ))}
          </g>
          <g className="stroke-accent" strokeWidth={2}>
            {spouseLines.map((l) => (
              <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            ))}
          </g>

          {revealedMembers.map((m) => {
            const pos = positions.get(m.id);
            if (!pos) return null;
            const left = px(pos.x) - NODE_W / 2;
            const top = py(m.generation) - NODE_H / 2;

            return (
              <foreignObject
                key={m.id}
                x={left - BADGE_MARGIN}
                y={top - BADGE_MARGIN}
                width={NODE_W + BADGE_MARGIN * 2}
                height={NODE_H + BADGE_MARGIN * 2}
              >
                <div className="relative" style={{ width: NODE_W, height: NODE_H, margin: BADGE_MARGIN }}>
                  <MemberCard data={m} onSelect={onSelect} />
                  {canExpandUp(m.id) && (
                    <ExpandBadge position="up" title={`Lihat orang tua ${m.name}`} onClick={() => expandUp(m.id)} />
                  )}
                  {canExpandDown(m.id) && (
                    <ExpandBadge position="down" title={`Lihat anak ${m.name}`} onClick={() => expandDown(m.id)} />
                  )}
                  {canExpandSiblings(m.id) && (
                    <ExpandBadge
                      position="side"
                      title={`Lihat saudara kandung ${m.name}`}
                      onClick={() => expandSiblings(m.id)}
                    />
                  )}
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
