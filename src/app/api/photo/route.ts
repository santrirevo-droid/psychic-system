import { NextResponse } from "next/server";
import { getSessionMemberId } from "@/lib/auth";

export async function GET(request: Request) {
  const viewerId = await getSessionMemberId();
  if (!viewerId) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const target = new URL(request.url).searchParams.get("u");
  if (!target) {
    return NextResponse.json({ error: "URL foto tidak ada." }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: "URL foto tidak valid." }, { status: 400 });
  }
  if (targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "URL foto tidak valid." }, { status: 400 });
  }

  const headers: HeadersInit = {};
  if (targetUrl.hostname.endsWith(".blob.vercel-storage.com")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const upstream = await fetch(targetUrl, { headers });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
