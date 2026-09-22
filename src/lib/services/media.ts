import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA } from "../../config/constants";
import { mediaExtension, mediaFileName, mediaSizeOk } from "../../domain/media";
import { db } from "../db/client";
import { mediaFiles, productImages } from "../db/schema";
import { ApiError } from "../errors";
import { requireInserted } from "../result";
import { nowIso } from "../time";
import { eq } from "drizzle-orm";

function mediaDir(): string {
  return path.resolve(process.cwd(), MEDIA.DIR);
}

export async function storeMediaFile(input: { bytes: Uint8Array; mime: string; alt?: string }) {
  const mime = input.mime.toLowerCase();
  if (!mediaExtension(mime)) {
    throw new ApiError(415, "media.unsupported_type", "Only jpeg, png, webp, and gif are allowed.");
  }
  if (!mediaSizeOk(input.bytes.byteLength)) {
    throw new ApiError(413, "media.too_large", "Image exceeds size limit.");
  }
  const inserted = await db
    .insert(mediaFiles)
    .values({ mime, bytes: input.bytes.byteLength, alt: input.alt ?? "", createdAt: nowIso() })
    .returning();
  const row = requireInserted(inserted[0], "media");
  await mkdir(mediaDir(), { recursive: true });
  await writeFile(path.join(mediaDir(), mediaFileName(row.id, mime)), input.bytes);
  return { id: row.id, mime: row.mime, bytes: row.bytes, alt: row.alt, src: `/api/storefront/v1/media/${row.id}` };
}

export async function readMediaFile(id: number): Promise<{ mime: string; body: Buffer; alt: string }> {
  const row = (await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1))[0];
  if (!row) {
    throw new ApiError(404, "media.not_found", "Media not found.");
  }
  const body = await readFile(path.join(mediaDir(), mediaFileName(id, row.mime)));
  return { mime: row.mime, body, alt: row.alt };
}

export async function attachProductImage(productId: number, mediaId: number, position = 0) {
  const media = await readMediaFile(mediaId);
  const src = `/api/storefront/v1/media/${mediaId}`;
  const row = await db
    .insert(productImages)
    .values({ productId, src, alt: media.alt, position })
    .returning();
  return requireInserted(row[0], "product_image");
}

export async function parseMediaForm(request: Request): Promise<{ bytes: Uint8Array; mime: string; alt: string }> {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "media.file_required", "Multipart field file is required.");
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  return { bytes: buf, mime: file.type || "application/octet-stream", alt: String(form.get("alt") ?? "") };
}
