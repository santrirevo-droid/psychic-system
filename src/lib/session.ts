import "server-only";
import { getSessionMemberId } from "./auth";
import { getMemberById, type Member } from "./db";

export async function getCurrentMember(): Promise<Member | null> {
  const id = await getSessionMemberId();
  if (!id) return null;
  return getMemberById(id);
}

/** Returns the logged-in member only if they're an admin, otherwise null. */
export async function getCurrentAdmin(): Promise<Member | null> {
  const member = await getCurrentMember();
  return member?.is_admin ? member : null;
}
