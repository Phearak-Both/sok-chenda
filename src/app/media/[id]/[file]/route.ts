import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/db";
import { MEDIA_ID_PATTERN } from "@/lib/media";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  // Strict patterns keep requests inside the uploads folder.
  if (!MEDIA_ID_PATTERN.test(id) || !/^\d{2,5}\.webp$/.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, id, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        // Each upload gets a new id, so files never change once written.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
