import type { SupportedMimeType } from "../types/meme";
import { normalizeMediaDimensions } from "../utils/mediaDimensions";

export interface MediaMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  mimeType: SupportedMimeType;
  animated: boolean;
}

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    img.onerror = () => reject(new Error("Unable to read intrinsic media dimensions"));
    img.src = src;
  });
}

/**
 * Extract intrinsic dimensions before persisting an uploaded/imported meme.
 * Call this during upload/import and write these fields into Firestore docs.
 */
export async function extractMediaMetadata(file: File): Promise<MediaMetadata> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const intrinsic = await loadImageDimensions(objectUrl);
    const dims = normalizeMediaDimensions({
      width: intrinsic.width,
      height: intrinsic.height,
    });

    const mimeType = file.type as SupportedMimeType;
    return {
      width: dims.width,
      height: dims.height,
      aspectRatio: dims.aspectRatio,
      mimeType,
      animated: mimeType === "image/gif",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
