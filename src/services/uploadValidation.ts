import {
  SUPPORTED_MIME_TYPES,
  MAX_STATIC_SIZE,
  MAX_GIF_SIZE,
  type SupportedMimeType,
} from "../types/meme";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate that a file is an accepted image type and within size limits. */
export function validateMemeFile(file: File): ValidationResult {
  const mime = file.type as SupportedMimeType;

  if (!(SUPPORTED_MIME_TYPES as readonly string[]).includes(mime)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Accepted formats: JPEG, PNG, WebP, GIF.`,
    };
  }

  const isGif = mime === "image/gif";
  const limit = isGif ? MAX_GIF_SIZE : MAX_STATIC_SIZE;
  const limitLabel = isGif ? "8 MB" : "10 MB";

  if (file.size > limit) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ${isGif ? "GIF" : "Image"} uploads must be under ${limitLabel}.`,
    };
  }

  return { valid: true };
}
