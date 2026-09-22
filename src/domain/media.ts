import { MEDIA } from "../config/constants";

const EXT: Record<(typeof MEDIA.ALLOWED_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function mediaExtension(mime: string): string | null {
  if (!(MEDIA.ALLOWED_TYPES as readonly string[]).includes(mime)) {
    return null;
  }
  return EXT[mime as (typeof MEDIA.ALLOWED_TYPES)[number]];
}

export function mediaSizeOk(bytes: number): boolean {
  return Number.isInteger(bytes) && bytes > 0 && bytes <= MEDIA.MAX_BYTES;
}

export function mediaFileName(id: number, mime: string): string {
  const ext = mediaExtension(mime);
  if (!ext) {
    throw new Error("media.unsupported_type");
  }
  return `${id}.${ext}`;
}
