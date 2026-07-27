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
  | "Keponakan"
  | "Ipar";

/**
 * Each link is {person, person's spouse} rather than a single id, so a
 * couple is treated as equivalent at every generation - not just when one
 * side happens to have no parent_id of their own. This is what lets a child
 * recorded under one parent's parent_id still resolve correctly against the
 * *other* parent (who may have their own, unrelated blood ancestry).
 */
function ancestorChainSets(id: string, byId: Map<string, Member>): Set<string>[] {
  const chain: Set<string>[] = [];
  let current: string | null = id;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const person = byId.get(current);
    if (!person) break;
    const node = new Set<string>([current]);
    if (person.spouse_id) node.add(person.spouse_id);
    chain.push(node);

    // Prefer this person's own blood line; if they have none recorded (e.g.
    // married in with no parent_id of their own), keep climbing through
    // their spouse's blood line instead of dead-ending the chain here.
    const spouse = person.spouse_id ? byId.get(person.spouse_id) : undefined;
    current = person.parent_id ?? spouse?.parent_id ?? null;
  }
  return chain;
}

/** Steps up from `fromId` and down to `toId` via their closest common ancestor (or ancestor couple). */
function findUpDown(
  fromId: string,
  toId: string,
  byId: Map<string, Member>
): { up: number; down: number } | null {
  const vChain = ancestorChainSets(fromId, byId);
  const tChain = ancestorChainSets(toId, byId);
  for (let up = 0; up < vChain.length; up++) {
    for (let down = 0; down < tChain.length; down++) {
      for (const id of vChain[up]) {
        if (tChain[down].has(id)) return { up, down };
      }
    }
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

  const diff = down - up;
  if (diff === 1) return "Keponakan";
  if (diff === 2) return "Cucu";
  return "Cicit";
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

  // Ipar: related by marriage rather than blood - either the spouse of one
  // of viewer's own siblings, or a sibling of viewer's own spouse.
  const viewerSiblings = getFamilyCircle(viewer, allMembers).siblings;
  const isSpouseOfSibling = viewerSiblings.some(
    (s) => s.spouse_id === target.id || target.spouse_id === s.id
  );
  const viewerSpouse = viewer.spouse_id ? allMembers.find((m) => m.id === viewer.spouse_id) : undefined;
  const isSiblingOfSpouse = viewerSpouse
    ? getFamilyCircle(viewerSpouse, allMembers).siblings.some((s) => s.id === target.id)
    : false;
  if (isSpouseOfSibling || isSiblingOfSpouse) return "Ipar";

  const byId = new Map(allMembers.map((m) => [m.id, m]));
  const path = findUpDown(viewer.id, target.id, byId);

  if (!path) {
    // Disconnected branches (no traceable common ancestor): fall back to a
    // neutral generation-only comparison instead of showing nothing.
    const diff = target.generation - viewer.generation;
    if (diff <= -3) return "Buyut";
    if (diff === -2) return target.gender === "L" ? "Kakek" : "Nenek";
    if (diff === -1) return target.gender === "L" ? "Om" : "Tante";
    if (diff === 0) return "Kakak/Adik";
    if (diff === 1) return "Keponakan";
    if (diff === 2) return "Cucu";
    return "Cicit";
  }

  let term = termForPath(path.up, path.down, target);

  if (term === "Kakak/Adik" && viewer.birth_year && target.birth_year) {
    if (target.birth_year !== viewer.birth_year) {
      term = target.birth_year < viewer.birth_year ? "Kakak" : "Adik";
    } else if (viewer.birth_month && target.birth_month && viewer.birth_month !== target.birth_month) {
      term = target.birth_month < viewer.birth_month ? "Kakak" : "Adik";
    }
  }

  return term;
}

type FamilyLike = { id: string; parent_id: string | null; spouse_id: string | null };

export type FamilyCircle<T> = {
  parents: T[];
  siblings: T[];
  spouse: T | null;
  children: T[];
};

/**
 * A person's immediate family for the "click to explore" panel: parents
 * (the recorded parent_id plus that parent's spouse, since a child only
 * ever records one side), siblings (anyone else recorded under either of
 * those two parents), spouse, and children (recorded under this person or
 * their spouse). Generic over Member/TreeMember since both shapes work.
 */
export function getFamilyCircle<T extends FamilyLike>(member: T, allMembers: T[]): FamilyCircle<T> {
  const byId = new Map(allMembers.map((m) => [m.id, m]));

  const parent = member.parent_id ? (byId.get(member.parent_id) ?? null) : null;
  const parentSpouse = parent?.spouse_id ? (byId.get(parent.spouse_id) ?? null) : null;
  const parents = [parent, parentSpouse].filter((m): m is T => m !== null);

  const coParentIds = new Set(parents.map((p) => p.id));
  const siblings = allMembers.filter(
    (m) => m.id !== member.id && m.parent_id && coParentIds.has(m.parent_id)
  );

  const spouse = member.spouse_id ? (byId.get(member.spouse_id) ?? null) : null;

  const selfAndSpouseIds = new Set([member.id, ...(spouse ? [spouse.id] : [])]);
  const children = allMembers.filter((m) => m.parent_id && selfAndSpouseIds.has(m.parent_id));

  return { parents, siblings, spouse, children };
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
