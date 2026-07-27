import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
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

  // This store never exposes a static BLOB_READ_WRITE_TOKEN we could build a
  // manual Authorization header from — only the SDK's own functions can
  // authenticate (via ambient OIDC/BLOB_STORE_ID), so private blob URLs are
  // read through get() rather than a plain fetch.
  if (targetUrl.hostname.endsWith(".blob.vercel-storage.com")) {
    try {
      const result = await get(targetUrl.toString(), { access: "private" });
      if (!result || result.statusCode !== 200) {
        return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": result.blob.contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "Foto tidak ditemukan." }, { status: 404 });
    }
  }

  const upstream = await fetch(targetUrl);
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
