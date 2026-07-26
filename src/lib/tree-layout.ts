import type { RelationTerm } from "./relationship";

export type TreeMember = {
  id: string;
  name: string;
  gender: "L" | "P";
  birth_year: number | null;
  city: string | null;
  photo_url: string | null;
  generation: number;
  parent_id: string | null;
  spouse_id: string | null;
  term: RelationTerm;
  isViewer: boolean;
};

export type Position = { x: number; y: number };

/**
 * Places every member on a grid: y = generation, x = a DFS visit order that
 * keeps siblings together and spouses adjacent, then re-centers each parent
 * over the average x of their own children (bottom-up) so the result reads
 * like a conventional family-tree / org-chart diagram.
 */
export function computeTreeLayout(members: TreeMember[]): Map<string, Position> {
  const byId = new Map(members.map((m) => [m.id, m]));
  const childrenOf = new Map<string, TreeMember[]>();
  for (const m of members) {
    if (!m.parent_id) continue;
    const list = childrenOf.get(m.parent_id) ?? [];
    list.push(m);
    childrenOf.set(m.parent_id, list);
  }
  for (const list of childrenOf.values()) {
    list.sort((a, b) => (a.birth_year ?? 9999) - (b.birth_year ?? 9999));
  }

  const positions = new Map<string, Position>();
  const visited = new Set<string>();
  let cursor = 0;

  function place(member: TreeMember) {
    if (visited.has(member.id)) return;
    visited.add(member.id);
    positions.set(member.id, { x: cursor++, y: member.generation });

    const spouse = member.spouse_id ? byId.get(member.spouse_id) : undefined;
    if (spouse && !visited.has(spouse.id) && !spouse.parent_id) {
      visited.add(spouse.id);
      positions.set(spouse.id, { x: cursor++, y: member.generation });
    }

    for (const child of childrenOf.get(member.id) ?? []) place(child);
  }

  const isTopLevelRoot = (m: TreeMember) => {
    if (m.parent_id) return false;
    if (!m.spouse_id) return true;
    const spouse = byId.get(m.spouse_id);
    return !spouse || !spouse.parent_id;
  };

  for (const m of members) if (isTopLevelRoot(m)) place(m);
  for (const m of members) place(m); // safety net for any orphaned/disconnected data

  const maxGen = members.reduce((max, m) => Math.max(max, m.generation), 1);
  for (let gen = maxGen; gen >= 1; gen--) {
    for (const m of members) {
      if (m.generation !== gen) continue;
      const children = childrenOf.get(m.id) ?? [];
      if (children.length === 0) continue;
      const xs = children.map((c) => positions.get(c.id)!.x);
      const current = positions.get(m.id)!;
      positions.set(m.id, { ...current, x: xs.reduce((a, b) => a + b, 0) / xs.length });
    }
  }

  // Final pass: snap each spouse pair together. The "anchor" is whichever
  // side is more structurally fixed (has its own children, else has a
  // parent_id), so e.g. a founding couple with no parent_id on either side
  // still ends up adjacent instead of the childless spouse being left behind.
  const processedPairs = new Set<string>();
  const anchorScore = (m: TreeMember) =>
    (childrenOf.get(m.id)?.length ? 2 : 0) + (m.parent_id ? 1 : 0);

  for (const m of members) {
    if (!m.spouse_id) continue;
    const pairKey = [m.id, m.spouse_id].sort().join("|");
    if (processedPairs.has(pairKey)) continue;
    processedPairs.add(pairKey);

    const spouse = byId.get(m.spouse_id);
    const mPos = positions.get(m.id);
    const sPos = spouse && positions.get(spouse.id);
    if (!spouse || !mPos || !sPos || mPos.y !== sPos.y) continue;

    const mScore = anchorScore(m);
    const sScore = anchorScore(spouse);
    const [anchor, other] =
      sScore > mScore || (sScore === mScore && spouse.id < m.id) ? [spouse, m] : [m, spouse];

    const anchorPos = positions.get(anchor.id)!;
    positions.set(other.id, { x: anchorPos.x + 0.8, y: anchorPos.y });
  }

  return positions;
}
