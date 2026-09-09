import sharp from "sharp";

const DISPLAY_MAX_DIMENSION = 4096;
const DISPLAY_WEBP_QUALITY = 95;

export interface PhotoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export class InvalidPhotoCrop extends Error {}

export function parsePhotoCrop(value: unknown): PhotoCrop {
  if (!value || typeof value !== "object") {
    throw new InvalidPhotoCrop("Provide a crop rectangle.");
  }

  const data = value as Record<string, unknown>;
  const values = [data.x, data.y, data.width, data.height, data.rotation ?? 0];
  if (values.some((number) => typeof number !== "number" || !Number.isFinite(number))) {
    throw new InvalidPhotoCrop("Crop coordinates and rotation must be finite numbers.");
  }

  const [x, y, width, height, rotation] = values as number[];
  if (x < 0 || y < 0 || width < 1 || height < 1 || Math.abs(rotation) > 360) {
    throw new InvalidPhotoCrop("Crop coordinates, dimensions, or rotation are out of range.");
  }

  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height), rotation };
}

export async function photoDominantColor(buffer: Buffer): Promise<string> {
  // stats() ignores queued image operations; materialize the thumbnail first.
  const { data, info } = await sharp(buffer)
    .autoOrient()
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { dominant } = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).stats();
  return `#${[dominant.r, dominant.g, dominant.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export async function cropPhoto(source: Buffer, crop: PhotoCrop) {
  const metadata = await sharp(source).metadata();
  const { width, height } = metadata.autoOrient;
  const radians = crop.rotation * Math.PI / 180;
  const rotatedWidth = Math.round(width * Math.abs(Math.cos(radians)) + height * Math.abs(Math.sin(radians)));
  const rotatedHeight = Math.round(height * Math.abs(Math.cos(radians)) + width * Math.abs(Math.sin(radians)));

  if (crop.x + crop.width > rotatedWidth || crop.y + crop.height > rotatedHeight) {
    throw new InvalidPhotoCrop("The crop extends outside the rotated image.");
  }

  const { data, info } = await sharp(source)
    .autoOrient()
    .rotate(crop.rotation)
    .extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height })
    .resize(DISPLAY_MAX_DIMENSION, DISPLAY_MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: DISPLAY_WEBP_QUALITY, smartSubsample: true })
    .timeout({ seconds: 45 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, width: info.width, height: info.height, dominantColor: await photoDominantColor(data) };
}
