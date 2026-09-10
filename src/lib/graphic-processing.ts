import sharp from "sharp";

/** Lossless library preview. The uploaded original remains the zoom source. */
export async function prepareGraphic(source: Buffer) {
  const metadata = await sharp(source).metadata();
  if (!metadata.format || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format) || (metadata.pages || 1) > 1 || (metadata.format === "heif" && metadata.compression !== "av1")) {
    throw new Error("Upload a still PNG, JPEG, WebP or AVIF graphic.");
  }
  const { width, height } = metadata.autoOrient;
  const preview = await sharp(source)
    .autoOrient()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ lossless: true, effort: 4 })
    .timeout({ seconds: 45 })
    .toBuffer();
  const extension = metadata.format === "heif" ? "avif" : metadata.format === "jpeg" ? "jpg" : metadata.format;
  const contentType = metadata.format === "heif" ? "image/avif" : `image/${metadata.format}`;
  return { preview, width, height, extension, contentType };
}
