import type { Member } from "./db";

export type RelationTerm =
  | "Anda"
  | "Suami"
  | "Istri"
  | "Ayah"
  | "Ibu"
  | "Kakek"
  | "Nenek"
  | "Buyut"
  | "Anak"
  | "Cucu"
  | "Cicit"
  | "Kakak"
  | "Adik"
  | "Kakak/Adik"
  | "Sepupu"
  | "Om"
  | "Tante"
  | "Keponakan";

function parentOf(id: string, byId: Map<string, Member>): string | null {
  return byId.get(id)?.parent_id ?? null;
}

function ancestorChain(id: string, byId: Map<string, Member>): string[] {
  const chain: string[] = [];
  let current: string | null = id;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    chain.push(current);
    seen.add(current);
    current = parentOf(current, byId);
  }
  return chain;
}

/** Steps up from `fromId` and down to `toId` via their closest common ancestor. */
function findUpDown(
  fromId: string,
  toId: string,
  byId: Map<string, Member>
): { up: number; down: number } | null {
  const vChain = ancestorChain(fromId, byId);
  const tChain = ancestorChain(toId, byId);
  for (let up = 0; up < vChain.length; up++) {
    const down = tChain.indexOf(vChain[up]);
    if (down !== -1) return { up, down };
  }
  return null;
}

/**
 * Members who married into the family have no parent_id of their own, so a
 * direct ancestor-chain lookup never finds them. As a fallback, retry the
 * lookup through their spouse's blood line (single hop only).
 */
function findUpDownWithInLaws(
  viewer: Member,
  target: Member,
  byId: Map<string, Member>
) {
  const targetAlt = !target.parent_id && target.spouse_id ? target.spouse_id : target.id;
  const viewerAlt = !viewer.parent_id && viewer.spouse_id ? viewer.spouse_id : viewer.id;

  const candidates: [string, string][] = [
    [viewer.id, target.id],
    [viewer.id, targetAlt],
    [viewerAlt, target.id],
    [viewerAlt, targetAlt],
  ];

  for (const [a, b] of candidates) {
    const result = findUpDown(a, b, byId);
    if (result) return result;
  }
  return null;
}

function termForPath(up: number, down: number, target: Member): RelationTerm {
  if (up === 0 && down === 0) return "Anda";

  if (down === 0) {
    if (up === 1) return target.gender === "L" ? "Ayah" : "Ibu";
    if (up === 2) return target.gender === "L" ? "Kakek" : "Nenek";
    return "Buyut";
  }

  if (up === 0) {
    if (down === 1) return "Anak";
    if (down === 2) return "Cucu";
    return "Cicit";
  }

  if (up === down) {
    if (up === 1) return "Kakak/Adik";
    return "Sepupu";
  }

  if (up > down) {
    const diff = up - down;
    if (diff === 1) return target.gender === "L" ? "Om" : "Tante";
    return target.gender === "L" ? "Kakek" : "Nenek";
  }

  return "Keponakan";
}

export function getRelationTerm(
  viewer: Member,
  target: Member,
  allMembers: Member[]
): RelationTerm {
  if (viewer.id === target.id) return "Anda";

  if (viewer.spouse_id === target.id || target.spouse_id === viewer.id) {
    return target.gender === "L" ? "Suami" : "Istri";
  }

  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const path = findUpDownWithInLaws(viewer, target, byId);

  if (!path) {
    // Disconnected branches (no traceable common ancestor): fall back to a
    // neutral generation-only comparison instead of showing nothing.
    const diff = target.generation - viewer.generation;
    if (diff <= -3) return "Buyut";
    if (diff === -2) return target.gender === "L" ? "Kakek" : "Nenek";
    if (diff === -1) return target.gender === "L" ? "Om" : "Tante";
    if (diff === 0) return "Kakak/Adik";
    if (diff === 1) return "Keponakan";
    return "Cucu";
  }

  let term = termForPath(path.up, path.down, target);

  if (term === "Kakak/Adik" && viewer.birth_year && target.birth_year) {
    if (target.birth_year < viewer.birth_year) term = "Kakak";
    else if (target.birth_year > viewer.birth_year) term = "Adik";
  }

  return term;
}

export function groupByGeneration(members: Member[]): Map<number, Member[]> {
  const groups = new Map<number, Member[]>();
  for (const m of members) {
    const list = groups.get(m.generation) ?? [];
    list.push(m);
    groups.set(m.generation, list);
  }
  return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
}

export const GENERATION_LABELS: Record<number, string> = {
  1: "Generasi 1 · Buyut",
  2: "Generasi 2 · Kakek & Nenek",
  3: "Generasi 3 · Orang Tua",
  4: "Generasi 4 · Anda & Saudara",
  5: "Generasi 5 · Anak & Keponakan",
};
