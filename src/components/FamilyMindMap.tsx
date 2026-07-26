"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeTreeLayout, type TreeMember } from "@/lib/tree-layout";
import { photoSrc } from "@/lib/photo";

const COL_W = 176;
const ROW_H = 190;
const NODE_W = 148;
const NODE_H = 124;
const PADDING = 60;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function FamilyMindMap({ members }: { members: TreeMember[] }) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const positions = useMemo(() => computeTreeLayout(members), [members]);

  const highlight = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      members
        .filter((m) => m.name.toLowerCase().includes(q) || (m.city ?? "").toLowerCase().includes(q))
        .map((m) => m.id)
    );
  }, [members, query]);

  const { minX, maxX, minY, maxY } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of positions.values()) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 1, maxY: 1 };
    return { minX, maxX, minY, maxY };
  }, [positions]);

  function px(x: number) {
    return (x - minX) * COL_W + PADDING + NODE_W / 2;
  }
  function py(y: number) {
    return (y - minY) * ROW_H + PADDING + NODE_H / 2;
  }

  const width = (maxX - minX) * COL_W + NODE_W + PADDING * 2;
  const height = (maxY - minY) * ROW_H + NODE_H + PADDING * 2;

  useEffect(() => {
    const container = scrollRef.current;
    const viewer = members.find((m) => m.isViewer);
    const pos = viewer && positions.get(viewer.id);
    if (!container || !pos) return;
    container.scrollLeft = px(pos.x) - container.clientWidth / 2;
    container.scrollTop = py(pos.y) - container.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spouseLines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  const dropLines: { d: string; key: string }[] = [];

  for (const m of members) {
    const pos = positions.get(m.id);
    if (!pos) continue;

    if (m.spouse_id && m.id < m.spouse_id) {
      const spouse = byId.get(m.spouse_id);
      const spousePos = spouse ? positions.get(spouse.id) : undefined;
      if (spouse && spousePos && spousePos.y === pos.y) {
        spouseLines.push({
          x1: px(pos.x),
          y1: py(pos.y),
          x2: px(spousePos.x),
          y2: py(spousePos.y),
          key: `${m.id}-${spouse.id}`,
        });
      }
    }

    if (m.parent_id) {
      const parent = byId.get(m.parent_id);
      const parentPos = parent ? positions.get(parent.id) : undefined;
      if (parent && parentPos) {
        const spouse = parent.spouse_id ? byId.get(parent.spouse_id) : undefined;
        const spousePos = spouse ? positions.get(spouse.id) : undefined;
        const originX =
          spouse && spousePos && spousePos.y === parentPos.y
            ? (px(parentPos.x) + px(spousePos.x)) / 2
            : px(parentPos.x);
        const originY = py(parentPos.y) + NODE_H / 2;
        const busY = (originY + (py(pos.y) - NODE_H / 2)) / 2;
        const childX = px(pos.x);
        const childTopY = py(pos.y) - NODE_H / 2;
        dropLines.push({
          d: `M ${originX} ${originY} L ${originX} ${busY} L ${childX} ${busY} L ${childX} ${childTopY}`,
          key: `${parent.id}-${m.id}`,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari & sorot nama atau kota..."
          className="w-full rounded-full border border-card-border bg-card px-5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
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

            {members.map((m) => {
              const pos = positions.get(m.id);
              if (!pos) return null;
              const left = px(pos.x) - NODE_W / 2;
              const top = py(pos.y) - NODE_H / 2;
              const dimmed = highlight ? !highlight.has(m.id) : false;

              return (
                <foreignObject key={m.id} x={left} y={top} width={NODE_W} height={NODE_H}>
                  <div
                    className={`flex h-full flex-col items-center justify-start rounded-xl border bg-card p-2 text-center shadow-sm transition-opacity ${
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
                    {m.birth_year && (
                      <span className="text-[10px] text-muted">{m.birth_year}</span>
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
