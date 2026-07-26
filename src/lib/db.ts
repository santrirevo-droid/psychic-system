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
  city: string | null;
  photo_url: string | null;
  generation: number;
  parent_id: string | null;
  spouse_id: string | null;
  pin_hash: string | null;
  created_at: string;
};

export async function getAllMembers(): Promise<Member[]> {
  const rows = await getSql()`
    select * from members
    order by generation asc, birth_year asc
  `;
  return rows as Member[];
}

export async function getMemberById(id: string): Promise<Member | null> {
  const rows = await getSql()`
    select * from members where id = ${id} limit 1
  `;
  return (rows[0] as Member | undefined) ?? null;
}
