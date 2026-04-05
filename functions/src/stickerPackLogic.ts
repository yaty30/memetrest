// ── Types ─────────────────────────────────────────────────────────────────────

export interface PackStickersRequest {
  memeIds: string[];
  packName: string;
}

export interface StickerData {
  imageData: string; // base64 animated WebP
  emojis: string[];
}

export interface PackStickersResponse {
  identifier: string;
  name: string;
  publisher: string;
  trayImage: string; // base64 PNG 96×96
  animatedStickerPack: boolean;
  stickers: StickerData[];
}

export type StickerPackErrorCode =
  | "invalid-argument"
  | "unauthenticated"
  | "not-found"
  | "internal";

// ── Error ─────────────────────────────────────────────────────────────────────

export class StickerPackError extends Error {
  readonly code: StickerPackErrorCode;

  constructor(code: StickerPackErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function requireAuthenticatedUid(uid: unknown): string {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new StickerPackError(
      "unauthenticated",
      "Authentication is required.",
    );
  }
  return uid;
}

// ── Validators ────────────────────────────────────────────────────────────────

const MIN_STICKERS = 3;
const MAX_STICKERS = 30;
const MAX_PACK_NAME_LEN = 128;

export function parsePackStickersRequest(data: unknown): PackStickersRequest {
  const payload =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : null;

  // ── packName ────────────────────────────────────────────────────────────
  const rawName = payload?.["packName"];
  if (typeof rawName !== "string") {
    throw new StickerPackError(
      "invalid-argument",
      "packName must be a string.",
    );
  }
  const packName = rawName.trim();
  if (!packName || packName.length > MAX_PACK_NAME_LEN) {
    throw new StickerPackError(
      "invalid-argument",
      `packName must be 1–${MAX_PACK_NAME_LEN} characters.`,
    );
  }

  // ── memeIds ─────────────────────────────────────────────────────────────
  const rawIds = payload?.["memeIds"];
  if (!Array.isArray(rawIds)) {
    throw new StickerPackError("invalid-argument", "memeIds must be an array.");
  }
  if (rawIds.length < MIN_STICKERS || rawIds.length > MAX_STICKERS) {
    throw new StickerPackError(
      "invalid-argument",
      `memeIds must contain ${MIN_STICKERS}–${MAX_STICKERS} items.`,
    );
  }

  const memeIds: string[] = [];
  const seen = new Set<string>();
  for (const id of rawIds) {
    if (typeof id !== "string" || !id.trim()) {
      throw new StickerPackError(
        "invalid-argument",
        "Each memeId must be a non-empty string.",
      );
    }
    const trimmed = id.trim();
    if (seen.has(trimmed)) {
      throw new StickerPackError(
        "invalid-argument",
        `Duplicate memeId: ${trimmed}`,
      );
    }
    seen.add(trimmed);
    memeIds.push(trimmed);
  }

  return { memeIds, packName };
}
