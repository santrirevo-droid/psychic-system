"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { computeTreeLayout, type TreeMember } from "@/lib/tree-layout";
import { photoSrc } from "@/lib/photo";
import { formatBirth } from "@/lib/months";
import { GENERATION_LABELS } from "@/lib/relationship";

const NODE_W = 148;
const NODE_H = 124;
const COL_W = 210;
const COLLAPSED_COL_W = 60;
const ROW_H = 150;
const PADDING = 60;
const HEADER_H = 52;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function FamilyMindMap({
  members,
  onSelect,
}: {
  members: TreeMember[];
  onSelect?: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(1);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const positions = useMemo(() => computeTreeLayout(members), [members]);

  function toggleCollapse(gen: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(gen)) next.delete(gen);
      else next.add(gen);
      return next;
    });
  }

  const highlight = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      members
        .filter((m) => m.name.toLowerCase().includes(q) || (m.city ?? "").toLowerCase().includes(q))
        .map((m) => m.id)
    );
  }, [members, query]);

  // Generation = horizontal column (left to right); sibling order = vertical
  // row within that column. Each column's width shrinks to a thin strip when
  // that generation is collapsed.
  const { generations, genCountByGen, minOrder, maxOrder } = useMemo(() => {
    const gens = new Set<number>();
    const counts = new Map<number, number>();
    let minOrder = Infinity, maxOrder = -Infinity;
    for (const m of members) {
      gens.add(m.generation);
      counts.set(m.generation, (counts.get(m.generation) ?? 0) + 1);
      const p = positions.get(m.id);
      if (p) {
        minOrder = Math.min(minOrder, p.x);
        maxOrder = Math.max(maxOrder, p.x);
      }
    }
    if (!Number.isFinite(minOrder)) {
      minOrder = 0;
      maxOrder = 0;
    }
    return {
      generations: [...gens].sort((a, b) => a - b),
      genCountByGen: counts,
      minOrder,
      maxOrder,
    };
  }, [members, positions]);

  const genLeft = useMemo(() => {
    const left = new Map<number, number>();
    let cursor = PADDING;
    for (const gen of generations) {
      left.set(gen, cursor);
      cursor += collapsed.has(gen) ? COLLAPSED_COL_W : COL_W;
    }
    return left;
  }, [generations, collapsed]);

  function genWidth(gen: number) {
    return collapsed.has(gen) ? COLLAPSED_COL_W : COL_W;
  }
  function genCenterX(gen: number) {
    return (genLeft.get(gen) ?? PADDING) + genWidth(gen) / 2;
  }
  function px(gen: number) {
    return genCenterX(gen);
  }
  function py(order: number) {
    return HEADER_H + (order - minOrder) * ROW_H + PADDING + NODE_H / 2;
  }

  const lastGen = generations[generations.length - 1] ?? 1;
  const width = (genLeft.get(lastGen) ?? PADDING) + genWidth(lastGen) + PADDING;
  const height = HEADER_H + (maxOrder - minOrder) * ROW_H + NODE_H + PADDING * 2;

  const viewerId = members.find((m) => m.isViewer)?.id;

  function focusOnViewer(behavior: ScrollBehavior = "smooth") {
    const container = scrollRef.current;
    const viewer = viewerId && byId.get(viewerId);
    const pos = viewerId && positions.get(viewerId);
    if (!container || !pos || !viewer) return;
    container.scrollTo({
      left: px(viewer.generation) - container.clientWidth / 2,
      top: py(pos.x) - container.clientHeight / 2,
      behavior,
    });
  }

  // Center on the logged-in viewer as soon as the diagram mounts (before
  // paint, via useLayoutEffect, so there's no visible jump from top-left).
  useLayoutEffect(() => {
    focusOnViewer("instant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spouseLines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  const dropLines: { d: string; key: string }[] = [];

  for (const m of members) {
    const pos = positions.get(m.id);
    if (!pos || collapsed.has(m.generation)) continue;

    if (m.spouse_id && m.id < m.spouse_id) {
      const spouse = byId.get(m.spouse_id);
      const spousePos = spouse ? positions.get(spouse.id) : undefined;
      if (spouse && spousePos && spousePos.y === pos.y && !collapsed.has(spouse.generation)) {
        spouseLines.push({
          x1: px(m.generation),
          y1: py(pos.x),
          x2: px(spouse.generation),
          y2: py(spousePos.x),
          key: `${m.id}-${spouse.id}`,
        });
      }
    }

    if (m.parent_id) {
      const parent = byId.get(m.parent_id);
      const parentPos = parent ? positions.get(parent.id) : undefined;
      if (parent && parentPos && !collapsed.has(parent.generation)) {
        const spouse = parent.spouse_id ? byId.get(parent.spouse_id) : undefined;
        const spousePos = spouse ? positions.get(spouse.id) : undefined;
        const originY =
          spouse && spousePos && spousePos.y === parentPos.y
            ? (py(parentPos.x) + py(spousePos.x)) / 2
            : py(parentPos.x);
        const originX = px(parent.generation) + NODE_W / 2;
        const childLeftX = px(m.generation) - NODE_W / 2;
        const busX = (originX + childLeftX) / 2;
        const childY = py(pos.x);
        dropLines.push({
          d: `M ${originX} ${originY} L ${busX} ${originY} L ${busX} ${childY} L ${childLeftX} ${childY}`,
          key: `${parent.id}-${m.id}`,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari & sorot nama atau kota..."
          className="w-full rounded-full border border-card-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => focusOnViewer()}
          className="shrink-0 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium whitespace-nowrap hover:border-primary hover:text-primary"
        >
          Fokus ke Saya
        </button>
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

          {generations.map((gen) => {
            const left = genLeft.get(gen) ?? PADDING;
            const isCollapsed = collapsed.has(gen);
            const label = GENERATION_LABELS[gen] ?? `Generasi ${gen}`;
            const count = genCountByGen.get(gen) ?? 0;

            if (isCollapsed) {
              return (
                <foreignObject key={gen} x={left} y={0} width={COLLAPSED_COL_W} height={height}>
                  <button
                    onClick={() => toggleCollapse(gen)}
                    title={`Perluas ${label}`}
                    className="flex h-full w-full flex-col items-center justify-start gap-2 rounded-xl border border-dashed border-card-border bg-card/70 pt-4 text-muted transition hover:border-primary hover:text-primary"
                  >
                    <span className="text-base leading-none">+</span>
                    <span
                      className="text-[10px] font-semibold tracking-wide uppercase"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {label} · {count}
                    </span>
                  </button>
                </foreignObject>
              );
            }

            return (
              <foreignObject key={gen} x={left} y={0} width={COL_W} height={HEADER_H}>
                <div className="flex h-full w-full items-center justify-between gap-2 rounded-lg bg-card/70 px-3">
                  <span className="truncate text-xs font-semibold tracking-wide text-muted uppercase">
                    {label}
                  </span>
                  <button
                    onClick={() => toggleCollapse(gen)}
                    title={`Ciutkan ${label}`}
                    aria-label={`Ciutkan ${label}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-card-border text-sm hover:border-primary hover:text-primary"
                  >
                    −
                  </button>
                </div>
              </foreignObject>
            );
          })}

          {members.map((m) => {
            const pos = positions.get(m.id);
            if (!pos || collapsed.has(m.generation)) return null;
            const left = px(m.generation) - NODE_W / 2;
            const top = py(pos.x) - NODE_H / 2;
            const dimmed = highlight ? !highlight.has(m.id) : false;

            return (
              <foreignObject key={m.id} x={left} y={top} width={NODE_W} height={NODE_H}>
                <button
                  type="button"
                  onClick={() => onSelect?.(m.id)}
                  className={`flex h-full w-full flex-col items-center justify-start rounded-xl border bg-card p-2 text-center shadow-sm transition-opacity hover:border-primary ${
                    m.isViewer ? "border-accent ring-2 ring-accent/40" : "border-card-border"
                  } ${dimmed ? "opacity-25" : "opacity-100"}`}
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-card-border bg-accent-soft">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoSrc(m.photo_url)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-accent">
                        {initials(m.name)}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] font-semibold tracking-wide text-primary uppercase">
                    {m.term}
                  </span>
                  <span className="line-clamp-1 w-full text-xs font-semibold leading-tight">
                    {m.name}
                  </span>
                  {formatBirth(m.birth_year, m.birth_month) && (
                    <span className="text-[10px] text-muted">
                      {formatBirth(m.birth_year, m.birth_month)}
                    </span>
                  )}
                </button>
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
