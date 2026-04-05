// ── Types ─────────────────────────────────────────────────────────────────────

export const SAVED_COLLECTION_ID = "system_saved";

export interface SaveMemeRequest {
  memeId: string;
}

export interface UnsaveMemeRequest {
  memeId: string;
}

export interface ToggleCollectionRequest {
  memeId: string;
  collectionId: string;
  add: boolean;
}

export interface CreateCollectionRequest {
  name: string;
  memeId?: string;
}

export interface GetMemeCollectionsRequest {
  memeId: string;
}

export type CollectionErrorCode =
  | "invalid-argument"
  | "unauthenticated"
  | "not-found"
  | "already-exists";

// ── Error ─────────────────────────────────────────────────────────────────────

export class CollectionError extends Error {
  readonly code: CollectionErrorCode;

  constructor(code: CollectionErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function requireAuthenticatedUid(uid: unknown): string {
  if (typeof uid !== "string" || !uid.trim()) {
    throw new CollectionError("unauthenticated", "Authentication is required.");
  }
  return uid;
}

// ── Validators ────────────────────────────────────────────────────────────────

function parseStringField(
  payload: Record<string, unknown> | null,
  field: string,
  maxLen = 256,
): string {
  const raw = payload?.[field];
  if (typeof raw !== "string") {
    throw new CollectionError("invalid-argument", `${field} must be a string.`);
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLen || trimmed.includes("/")) {
    throw new CollectionError(
      "invalid-argument",
      `${field} must be a non-empty string (max ${maxLen} chars, no slashes).`,
    );
  }
  return trimmed;
}

function toPayload(data: unknown): Record<string, unknown> | null {
  return typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)
    : null;
}

export function parseSaveMemeRequest(data: unknown): SaveMemeRequest {
  const payload = toPayload(data);
  return { memeId: parseStringField(payload, "memeId") };
}

export function parseUnsaveMemeRequest(data: unknown): UnsaveMemeRequest {
  const payload = toPayload(data);
  return { memeId: parseStringField(payload, "memeId") };
}

export function parseToggleCollectionRequest(
  data: unknown,
): ToggleCollectionRequest {
  const payload = toPayload(data);
  const memeId = parseStringField(payload, "memeId");
  const collectionId = parseStringField(payload, "collectionId");

  const add = payload?.add;
  if (typeof add !== "boolean") {
    throw new CollectionError("invalid-argument", "add must be a boolean.");
  }

  return { memeId, collectionId, add };
}

export function parseCreateCollectionRequest(
  data: unknown,
): CreateCollectionRequest {
  const payload = toPayload(data);
  const name = parseStringField(payload, "name", 60);

  const rawMemeId = payload?.memeId;
  let memeId: string | undefined;
  if (rawMemeId !== undefined && rawMemeId !== null) {
    memeId = parseStringField(payload, "memeId");
  }

  return { name, memeId };
}

export function parseGetMemeCollectionsRequest(
  data: unknown,
): GetMemeCollectionsRequest {
  const payload = toPayload(data);
  return { memeId: parseStringField(payload, "memeId") };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function collectionItemId(collectionId: string, memeId: string): string {
  return `${collectionId}_${memeId}`;
}
