import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import sharp from "sharp";
import {
  type PackStickersRequest,
  type PackStickersResponse,
  type StickerData,
  StickerPackError,
  parsePackStickersRequest,
  requireAuthenticatedUid,
} from "./stickerPackLogic";

// ── Constants ─────────────────────────────────────────────────────────────────

const STICKER_SIZE = 512;
const TRAY_SIZE = 96;
const MAX_ANIMATED_BYTES = 500 * 1024; // 500 KB for animated stickers
const MAX_STATIC_BYTES = 100 * 1024; // 100 KB for static stickers
const ANIMATED_QUALITY_STEPS = [80, 70, 60, 50, 40];
const STATIC_QUALITY_STEPS = [80, 70, 60, 50, 40, 30];
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapError(error: unknown): never {
  if (error instanceof StickerPackError) {
    throw new HttpsError(error.code, error.message);
  }
  if (error instanceof HttpsError) {
    throw error;
  }
  const msg =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  throw new HttpsError("internal", msg);
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new StickerPackError(
      "internal",
      `Failed to download image: HTTP ${res.status}`,
    );
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Detect if the buffer is a GIF by checking magic bytes.
 */
function isGifBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 6 &&
    buf[0] === 0x47 && // G
    buf[1] === 0x49 && // I
    buf[2] === 0x46 // F
  );
}

/**
 * Check whether a GIF buffer is truly animated (more than 1 frame).
 */
async function isAnimatedGif(buf: Buffer): Promise<boolean> {
  if (!isGifBuffer(buf)) return false;
  const meta = await sharp(buf, { animated: true, pages: -1 }).metadata();
  return (meta.pages ?? 1) > 1;
}

/**
 * Convert an animated GIF to animated WebP at 512×512 with transparent
 * padding, fitting within MAX_ANIMATED_BYTES.
 *
 * Strategy: first try quality reduction with all frames, then progressively
 * drop frames (keeping even spacing) while maintaining acceptable quality.
 */
async function processAnimatedSticker(buf: Buffer): Promise<Buffer> {
  const meta = await sharp(buf, { animated: true, pages: -1 }).metadata();
  const totalPages = meta.pages ?? 1;

  // Phase 1: quality reduction with all frames
  for (const q of ANIMATED_QUALITY_STEPS) {
    const result = await sharp(buf, { animated: true })
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: TRANSPARENT,
      })
      .webp({ quality: q, loop: 0 })
      .toBuffer();

    if (result.length <= MAX_ANIMATED_BYTES) {
      return result;
    }
  }

  // Phase 2: reduce frame count progressively at mid quality
  const frameCaps = [
    Math.round(totalPages * 0.6),
    Math.round(totalPages * 0.4),
    Math.round(totalPages * 0.25),
    15,
    10,
  ].filter((n) => n >= 3 && n < totalPages);

  for (const maxPages of frameCaps) {
    for (const q of [60, 40]) {
      const result = await sharp(buf, { animated: true, pages: maxPages })
        .resize(STICKER_SIZE, STICKER_SIZE, {
          fit: "contain",
          background: TRANSPARENT,
        })
        .webp({ quality: q, loop: 0 })
        .toBuffer();

      if (result.length <= MAX_ANIMATED_BYTES) {
        return result;
      }
    }
  }

  // Phase 3: could not fit — return static instead (caller will adjust pack type)
  return processStaticSticker(buf);
}

/**
 * Convert any image to a static WebP at 512×512 with transparent padding.
 * For GIFs, only the first frame is used.
 */
async function processStaticSticker(buf: Buffer): Promise<Buffer> {
  for (const q of STATIC_QUALITY_STEPS) {
    const result = await sharp(buf) // no { animated } → first frame only for GIFs
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: TRANSPARENT,
      })
      .ensureAlpha()
      .webp({ quality: q })
      .toBuffer();

    if (result.length <= MAX_STATIC_BYTES) {
      return result;
    }
  }

  throw new StickerPackError(
    "internal",
    "Could not compress sticker below 100KB.",
  );
}

/**
 * Generate a static 96×96 PNG tray icon from the first sticker image.
 */
async function generateTrayIcon(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize(TRAY_SIZE, TRAY_SIZE, {
      fit: "contain",
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();
}

// ── Cloud Function ────────────────────────────────────────────────────────────

const db = getFirestore();

export const packStickers = onCall<unknown, Promise<PackStickersResponse>>(
  {
    invoker: "public",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (request) => {
    try {
      const uid = requireAuthenticatedUid(request.auth?.uid);
      const input = parsePackStickersRequest(request.data);

      // Batch-fetch meme documents
      const memeRefs = input.memeIds.map((id) =>
        db.collection("memes").doc(id),
      );
      const memeSnaps = await db.getAll(...memeRefs);

      const memeDocs: Array<{
        id: string;
        imageUrl: string;
        animated: boolean;
        stickerStaticB64?: string;
        stickerAnimatedB64?: string;
        stickerGenerated?: boolean;
      }> = [];

      for (let i = 0; i < memeSnaps.length; i++) {
        const snap = memeSnaps[i];
        if (!snap.exists) {
          throw new StickerPackError(
            "not-found",
            `Meme not found: ${input.memeIds[i]}`,
          );
        }
        const data = snap.data()!;
        memeDocs.push({
          id: snap.id,
          imageUrl: data.imageUrl as string,
          animated: (data.animated as boolean) ?? false,
          stickerStaticB64: data.stickerStaticB64 as string | undefined,
          stickerAnimatedB64: data.stickerAnimatedB64 as string | undefined,
          stickerGenerated: data.stickerGenerated as boolean | undefined,
        });
      }

      // Check if all memes have pre-generated sticker data
      const allPregenerated = memeDocs.every((m) => m.stickerGenerated);

      // ── Fast path: use cached base64 ──────────────────────────────────
      if (allPregenerated) {
        const allHaveAnimated = memeDocs.every((m) => m.stickerAnimatedB64);
        const isAnimatedPack = allHaveAnimated;

        const stickers: StickerData[] = memeDocs.map((m) => ({
          imageData: isAnimatedPack
            ? m.stickerAnimatedB64!
            : (m.stickerStaticB64 ?? ""),
          emojis: ["😀"],
        }));

        // Still need to generate tray icon — download first image
        const trayBuf = await downloadImage(memeDocs[0].imageUrl);
        const trayBuffer = await generateTrayIcon(trayBuf);

        const identifier = `${uid}_${Date.now()}`;
        const displayName = request.auth?.token?.name;
        const publisher =
          typeof displayName === "string" && displayName.trim()
            ? `${displayName.trim()} @ Memetrest`
            : "Memetrest";

        return {
          identifier,
          name: `${input.packName}`,
          publisher,
          trayImage: trayBuffer.toString("base64"),
          animatedStickerPack: isAnimatedPack,
          stickers,
        };
      }

      // ── Slow path: download & convert on the fly (legacy memes) ───────

      // Download all images in parallel
      const imageBuffers = await Promise.all(
        memeDocs.map((m) => downloadImage(m.imageUrl)),
      );

      // Detect which images are truly animated (multi-frame GIFs)
      const animatedFlags = await Promise.all(
        imageBuffers.map(async (buf, i) => {
          if (memeDocs[i].animated || isGifBuffer(buf)) {
            return isAnimatedGif(buf);
          }
          return false;
        }),
      );
      const allAnimated = animatedFlags.every((f) => f);

      // WhatsApp requires ALL stickers in a pack to be the same type.
      // Only use animated pack if every sticker is a real animated GIF.
      // Otherwise, fall back to static pack (first-frame for GIFs).
      let isAnimatedPack = allAnimated;

      // Process stickers: try animated first, verify all succeed as animated
      const stickerBuffers: Buffer[] = [];

      if (isAnimatedPack) {
        // Attempt animated conversion for all stickers
        const results = await Promise.all(
          imageBuffers.map((buf) => processAnimatedSticker(buf)),
        );

        // Verify each result is actually animated WebP (not a static fallback)
        const actuallyAnimated = await Promise.all(
          results.map(async (webp) => {
            const meta = await sharp(webp, {
              animated: true,
              pages: -1,
            }).metadata();
            return (meta.pages ?? 1) > 1;
          }),
        );

        if (actuallyAnimated.every((a) => a)) {
          stickerBuffers.push(...results);
        } else {
          // Some stickers fell back to static — make entire pack static
          isAnimatedPack = false;
        }
      }

      if (!isAnimatedPack && stickerBuffers.length === 0) {
        // Process all as static
        const results = await Promise.all(
          imageBuffers.map((buf) => processStaticSticker(buf)),
        );
        stickerBuffers.push(...results);
      }

      const stickers: StickerData[] = stickerBuffers.map((webp) => ({
        imageData: webp.toString("base64"),
        emojis: ["😀"],
      }));

      // Generate tray icon from first image (first frame only for GIFs)
      const trayBuffer = await generateTrayIcon(imageBuffers[0]);

      // Build identifier
      const identifier = `${uid}_${Date.now()}`;

      // Get publisher name from auth
      const displayName = request.auth?.token?.name;
      const publisher =
        typeof displayName === "string" && displayName.trim()
          ? `${displayName.trim()} @ Memetrest`
          : "Memetrest";

      return {
        identifier,
        name: `${input.packName}`,
        publisher,
        trayImage: trayBuffer.toString("base64"),
        animatedStickerPack: isAnimatedPack,
        stickers,
      };
    } catch (error) {
      wrapError(error);
    }
  },
);
