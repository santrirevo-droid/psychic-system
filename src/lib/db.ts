import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily created so `next build` doesn't need a real connection string just
// to collect page data for routes that only touch the database at request time.
let sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (sql) return sql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  sql = neon(connectionString);
  return sql;
}

export type Gender = "L" | "P";

export type Member = {
  id: string;
  name: string;
  gender: Gender;
  birth_year: number | null;
  birth_month: number | null;
  city: string | null;
  photo_url: string | null;
  generation: number;
  parent_id: string | null;
  spouse_id: string | null;
  pin_hash: string | null;
  is_admin: boolean;
  created_at: string;
};

export type MemberInput = {
  name: string;
  gender: Gender;
  birth_year: number | null;
  birth_month: number | null;
  city: string | null;
  photo_url: string | null;
  generation: number;
  parent_id: string | null;
  spouse_id: string | null;
  is_admin: boolean;
};

export async function getAllMembers(): Promise<Member[]> {
  const rows = await getSql()`
    select * from members
    order by generation asc, birth_year asc, birth_month asc
  `;
  return rows as Member[];
}

export async function getMemberById(id: string): Promise<Member | null> {
  const rows = await getSql()`
    select * from members where id = ${id} limit 1
  `;
  return (rows[0] as Member | undefined) ?? null;
}

export async function createMember(input: MemberInput): Promise<Member> {
  const rows = await getSql()`
    insert into members (name, gender, birth_year, birth_month, city, photo_url, generation, parent_id, spouse_id, is_admin)
    values (${input.name}, ${input.gender}, ${input.birth_year}, ${input.birth_month}, ${input.city}, ${input.photo_url}, ${input.generation}, ${input.parent_id}, ${input.spouse_id}, ${input.is_admin})
    returning *
  `;
  return rows[0] as Member;
}

export async function updateMember(id: string, input: MemberInput): Promise<Member | null> {
  const rows = await getSql()`
    update members set
      name = ${input.name},
      gender = ${input.gender},
      birth_year = ${input.birth_year},
      birth_month = ${input.birth_month},
      city = ${input.city},
      photo_url = ${input.photo_url},
      generation = ${input.generation},
      parent_id = ${input.parent_id},
      spouse_id = ${input.spouse_id},
      is_admin = ${input.is_admin}
    where id = ${id}
    returning *
  `;
  return (rows[0] as Member | undefined) ?? null;
}

/** Separate from updateMember so a blank "new PIN" field in the admin form can leave the existing PIN untouched. */
export async function setMemberPin(id: string, pinHash: string | null): Promise<void> {
  await getSql()`update members set pin_hash = ${pinHash} where id = ${id}`;
}

/** Separate from updateMember so a logged-in member can update just their own photo without admin rights. */
export async function updateMemberPhoto(id: string, photoUrl: string): Promise<Member | null> {
  const rows = await getSql()`
    update members set photo_url = ${photoUrl} where id = ${id} returning *
  `;
  return (rows[0] as Member | undefined) ?? null;
}

export async function deleteMember(id: string): Promise<void> {
  await getSql()`delete from members where id = ${id}`;
}
