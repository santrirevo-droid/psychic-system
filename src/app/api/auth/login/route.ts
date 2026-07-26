import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getMemberById } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { memberId, pin } = await request.json();

  if (typeof memberId !== "string" || typeof pin !== "string") {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const member = await getMemberById(memberId);
  if (!member || !member.pin_hash) {
    return NextResponse.json(
      { error: "Anggota tidak ditemukan atau belum bisa login." },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(pin, member.pin_hash);
  if (!valid) {
    return NextResponse.json({ error: "PIN salah." }, { status: 401 });
  }

  await createSession(member.id);
  return NextResponse.json({ ok: true });
}
