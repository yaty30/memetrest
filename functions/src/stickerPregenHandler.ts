import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import sharp from "sharp";

// ── Constants ─────────────────────────────────────────────────────────────────

const STICKER_SIZE = 512;
const MAX_ANIMATED_BYTES = 500 * 1024;
const MAX_STATIC_BYTES = 100 * 1024;
const ANIMATED_QUALITY_STEPS = [80, 70, 60, 50, 40];
const STATIC_QUALITY_STEPS = [80, 70, 60, 50, 40, 30];
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function isGifBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
  );
}

async function isAnimatedGif(buf: Buffer): Promise<boolean> {
  if (!isGifBuffer(buf)) return false;
  const meta = await sharp(buf, { animated: true, pages: -1 }).metadata();
  return (meta.pages ?? 1) > 1;
}

async function compressAnimated(buf: Buffer): Promise<Buffer | null> {
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
    if (result.length <= MAX_ANIMATED_BYTES) return result;
  }

  // Phase 2: reduce frame count progressively
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
      if (result.length <= MAX_ANIMATED_BYTES) return result;
    }
  }

  return null; // could not fit — caller should fall back to static
}

async function compressStatic(buf: Buffer): Promise<Buffer | null> {
  for (const q of STATIC_QUALITY_STEPS) {
    const result = await sharp(buf)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: TRANSPARENT,
      })
      .ensureAlpha()
      .webp({ quality: q })
      .toBuffer();
    if (result.length <= MAX_STATIC_BYTES) return result;
  }
  return null;
}

// ── Firestore Trigger ─────────────────────────────────────────────────────────

const db = getFirestore();

/**
 * Triggered when a new meme document is created. Downloads the source image,
 * converts to sticker-ready WebP, and writes base64 back to the meme doc.
 *
 * Fields written:
 *   stickerStaticB64  — 512×512 static WebP base64 (always set)
 *   stickerAnimatedB64 — 512×512 animated WebP base64 (only if truly animated)
 *   stickerGenerated  — true when processing is complete
 */
export const pregenStickerData = onDocumentCreated(
  {
    document: "memes/{memeId}",
    memory: "1GiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const imageUrl = data.imageUrl as string | undefined;
    if (!imageUrl) return;

    try {
      // Download source image
      const res = await fetch(imageUrl);
      if (!res.ok) {
        console.error(
          `pregenStickerData: download failed for ${snap.id}: HTTP ${res.status}`,
        );
        return;
      }
      const buf = Buffer.from(await res.arrayBuffer());

      const update: Record<string, unknown> = {};

      // Always generate static version (first frame for GIFs)
      const staticWebp = await compressStatic(buf);
      if (staticWebp) {
        update.stickerStaticB64 = staticWebp.toString("base64");
      }

      // Generate animated version if source is an animated GIF
      if (await isAnimatedGif(buf)) {
        const animWebp = await compressAnimated(buf);
        if (animWebp) {
          // Verify it's actually multi-frame
          const meta = await sharp(animWebp, {
            animated: true,
            pages: -1,
          }).metadata();
          if ((meta.pages ?? 1) > 1) {
            update.stickerAnimatedB64 = animWebp.toString("base64");
          }
        }
      }

      update.stickerGenerated = true;
      await db.collection("memes").doc(snap.id).update(update);
    } catch (err) {
      console.error(
        `pregenStickerData: error for ${snap.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  },
);
