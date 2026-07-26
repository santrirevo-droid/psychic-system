import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentAdmin } from "@/lib/session";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format foto harus JPG, PNG, WEBP, atau GIF." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran foto maksimal 5MB." }, { status: 400 });
  }

  // The connected Blob store is private-access, so blobs aren't reachable by
  // a bare URL — /api/photo proxies reads for any logged-in family member.
  const blob = await put(`family-photos/${crypto.randomUUID()}-${file.name}`, file, {
    access: "private",
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
