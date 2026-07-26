import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/session";
import { deleteMember, setMemberPin, updateMember } from "@/lib/db";
import { parseMemberInput } from "@/lib/member-input";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;

  const body = await request.json();
  const input = parseMemberInput(body);
  if (!input) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  if (id === admin.id && !input.is_admin) {
    return NextResponse.json(
      { error: "Anda tidak bisa mencabut status admin sendiri." },
      { status: 400 }
    );
  }

  const member = await updateMember(id, input);
  if (!member) {
    return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
  }

  const changePin = (body as Record<string, unknown>).changePin === true;
  if (changePin) {
    const pin = (body as Record<string, unknown>).pin;
    const pinHash = typeof pin === "string" && pin ? await bcrypt.hash(pin, 10) : null;
    await setMemberPin(id, pinHash);
  }

  return NextResponse.json({ ok: true, member });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }
  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "Anda tidak bisa menghapus akun Anda sendiri." },
      { status: 400 }
    );
  }

  await deleteMember(id);
  return NextResponse.json({ ok: true });
}
