import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentMember } from "@/lib/session";
import { updateMemberPhoto } from "@/lib/db";
import { MAX_PHOTO_BYTES, MAX_PHOTO_LABEL } from "@/lib/photo";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member || member.is_guest) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format foto harus JPG atau PNG." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: `Ukuran foto maksimal ${MAX_PHOTO_LABEL}.` }, { status: 400 });
  }

  // Private access: /api/photo proxies reads for any logged-in family member.
  const blob = await put(`family-photos/${crypto.randomUUID()}-${file.name}`, file, {
    access: "private",
  });

  const updated = await updateMemberPhoto(member.id, blob.url);
  return NextResponse.json({ ok: true, member: updated });
}
