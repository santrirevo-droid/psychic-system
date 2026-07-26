import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/session";
import { createMember, setMemberPin } from "@/lib/db";
import { parseMemberInput } from "@/lib/member-input";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const body = await request.json();
  const input = parseMemberInput(body);
  if (!input) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const member = await createMember(input);

  const pin = typeof (body as Record<string, unknown>).pin === "string" ? (body as Record<string, unknown>).pin as string : null;
  if (pin) {
    const pinHash = await bcrypt.hash(pin, 10);
    await setMemberPin(member.id, pinHash);
  }

  return NextResponse.json({ ok: true, member });
}
