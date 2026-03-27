interface NormalizeMediaDimensionsInput {
  width?: number;
  height?: number;
  aspectRatio?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

function positiveOrFallback(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? (value as number) : fallback;
}

export function deriveAspectRatio(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 1;
  }
  return width / height;
}

export function normalizeMediaDimensions(
  input: NormalizeMediaDimensionsInput,
): MediaDimensions {
  const fallbackWidth = positiveOrFallback(input.fallbackWidth, 480);
  const fallbackHeight = positiveOrFallback(input.fallbackHeight, 480);

  const width = positiveOrFallback(input.width, fallbackWidth);
  const height = positiveOrFallback(input.height, fallbackHeight);

  const derived = deriveAspectRatio(width, height);
  const aspectRatio =
    Number.isFinite(input.aspectRatio) && (input.aspectRatio ?? 0) > 0
      ? (input.aspectRatio as number)
      : derived;

  return { width, height, aspectRatio };
}
