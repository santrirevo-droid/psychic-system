"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { computeTreeLayout, type TreeMember } from "@/lib/tree-layout";
import { GENERATION_LABELS } from "@/lib/relationship";
import MemberCard from "./MemberCard";

const NODE_W = 210;
const NODE_H = 240;
const COL_W = 240;
const HEADER_H = 44;
const ROW_GAP = 70;
const COLLAPSED_ROW_H = 56;
const PADDING = 50;

export default function FamilyTree({
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

  // Generation = row (top to bottom, like a classic nasab chart); sibling
  // order = horizontal position within that row. A collapsed generation
  // shrinks to a thin full-width strip instead of taking its normal height.
  const { generations, genCountByGen, genOrderRange, minOrder, maxOrder } = useMemo(() => {
    const gens = new Set<number>();
    const counts = new Map<number, number>();
    const orderRange = new Map<number, { min: number; max: number }>();
    let minOrder = Infinity, maxOrder = -Infinity;
    for (const m of members) {
      gens.add(m.generation);
      counts.set(m.generation, (counts.get(m.generation) ?? 0) + 1);
      const p = positions.get(m.id);
      if (p) {
        minOrder = Math.min(minOrder, p.x);
        maxOrder = Math.max(maxOrder, p.x);
        const range = orderRange.get(m.generation);
        orderRange.set(m.generation, {
          min: range ? Math.min(range.min, p.x) : p.x,
          max: range ? Math.max(range.max, p.x) : p.x,
        });
      }
    }
    if (!Number.isFinite(minOrder)) {
      minOrder = 0;
      maxOrder = 0;
    }
    return {
      generations: [...gens].sort((a, b) => a - b),
      genCountByGen: counts,
      genOrderRange: orderRange,
      minOrder,
      maxOrder,
    };
  }, [members, positions]);

  function genRowHeight(gen: number) {
    return collapsed.has(gen) ? COLLAPSED_ROW_H : HEADER_H + NODE_H + ROW_GAP;
  }

  const genTop = useMemo(() => {
    const top = new Map<number, number>();
    let cursor = PADDING;
    for (const gen of generations) {
      top.set(gen, cursor);
      cursor += genRowHeight(gen);
    }
    return top;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generations, collapsed]);

  function px(order: number) {
    return (order - minOrder) * COL_W + PADDING + NODE_W / 2;
  }
  function nodeTopY(gen: number) {
    return (genTop.get(gen) ?? PADDING) + HEADER_H;
  }
  function nodeCenterY(gen: number) {
    return nodeTopY(gen) + NODE_H / 2;
  }
  function nodeBottomY(gen: number) {
    return nodeTopY(gen) + NODE_H;
  }

  const lastGen = generations[generations.length - 1] ?? 1;
  const width = (maxOrder - minOrder) * COL_W + NODE_W + PADDING * 2;
  const height = (genTop.get(lastGen) ?? PADDING) + genRowHeight(lastGen) - ROW_GAP + PADDING;

  const viewerId = members.find((m) => m.isViewer)?.id;

  function focusOnViewer(behavior: ScrollBehavior = "smooth") {
    const container = scrollRef.current;
    const viewer = viewerId && byId.get(viewerId);
    const pos = viewerId && positions.get(viewerId);
    if (!container || !pos || !viewer) return;
    container.scrollTo({
      left: px(pos.x) - container.clientWidth / 2,
      top: nodeCenterY(viewer.generation) - container.clientHeight / 2,
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
          x1: px(pos.x),
          y1: nodeCenterY(m.generation),
          x2: px(spousePos.x),
          y2: nodeCenterY(spouse.generation),
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
        const originX =
          spouse && spousePos && spousePos.y === parentPos.y
            ? (px(parentPos.x) + px(spousePos.x)) / 2
            : px(parentPos.x);
        const originY = nodeBottomY(parent.generation);
        const childTopY = nodeTopY(m.generation);
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
            const top = genTop.get(gen) ?? PADDING;
            const isCollapsed = collapsed.has(gen);
            const label = GENERATION_LABELS[gen] ?? `Generasi ${gen}`;
            const count = genCountByGen.get(gen) ?? 0;

            // Scoped to where this generation's own cards actually sit,
            // rather than the full (possibly much wider) diagram - otherwise
            // the label can scroll out of view for a large, spread-out tree.
            const range = genOrderRange.get(gen);
            const rangeX = range ? px(range.min) - NODE_W / 2 : PADDING;
            const rangeW = range ? px(range.max) + NODE_W / 2 - rangeX : width;

            if (isCollapsed) {
              return (
                <g key={gen}>
                  <line
                    x1={0}
                    x2={width}
                    y1={top + COLLAPSED_ROW_H / 2}
                    y2={top + COLLAPSED_ROW_H / 2}
                    className="stroke-card-border"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                  />
                  <foreignObject x={rangeX} y={top} width={rangeW} height={COLLAPSED_ROW_H}>
                    <button
                      onClick={() => toggleCollapse(gen)}
                      title={`Perluas ${label}`}
                      className="mx-auto flex h-full w-fit min-w-[220px] items-center justify-center gap-3 rounded-xl border border-dashed border-card-border bg-card px-4 text-muted transition hover:border-primary hover:text-primary"
                    >
                      <span className="text-base leading-none">+</span>
                      <span className="text-xs font-semibold tracking-wide uppercase">
                        {label} · {count}
                      </span>
                    </button>
                  </foreignObject>
                </g>
              );
            }

            return (
              <foreignObject key={gen} x={rangeX} y={top} width={rangeW} height={HEADER_H}>
                <div className="mx-auto flex h-full w-fit min-w-[220px] items-center justify-between gap-4 rounded-lg bg-card/70 px-4">
                  <span className="truncate text-sm font-semibold tracking-wide text-muted uppercase">
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
            const left = px(pos.x) - NODE_W / 2;
            const top = nodeTopY(m.generation);
            const dimmed = highlight ? !highlight.has(m.id) : false;

            return (
              <foreignObject key={m.id} x={left} y={top} width={NODE_W} height={NODE_H}>
                <MemberCard data={m} onSelect={onSelect} dimmed={dimmed} />
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
