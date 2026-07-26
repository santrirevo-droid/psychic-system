import "server-only";
import type { MemberInput } from "./db";

export function parseMemberInput(body: unknown): MemberInput | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return null;
  if (b.gender !== "L" && b.gender !== "P") return null;
  const generation = Number(b.generation);
  if (!Number.isInteger(generation) || generation < 1 || generation > 5) return null;

  return {
    name: b.name.trim(),
    gender: b.gender,
    birth_year: b.birth_year ? Number(b.birth_year) : null,
    city: typeof b.city === "string" && b.city.trim() ? b.city.trim() : null,
    photo_url: typeof b.photo_url === "string" && b.photo_url.trim() ? b.photo_url.trim() : null,
    generation,
    parent_id: typeof b.parent_id === "string" && b.parent_id ? b.parent_id : null,
    spouse_id: typeof b.spouse_id === "string" && b.spouse_id ? b.spouse_id : null,
    is_admin: b.is_admin === true,
  };
}
