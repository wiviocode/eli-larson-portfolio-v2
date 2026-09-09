import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { getPhotoSource } from "../src/lib/gallery-image.ts";
import { getPublicMediaUrl, LEGACY_MEDIA_ORIGIN } from "../src/lib/media-url.ts";
import { cropPhoto, InvalidPhotoCrop, parsePhotoCrop, photoDominantColor } from "../src/lib/photo-processing.ts";

test("the viewer selects HQ while preserving existing crop compositions", () => {
  const item = { blobUrl: "cropped.webp", hqBlobUrl: "master.webp" };
  assert.equal(getPhotoSource(item), "master.webp");
  assert.equal(getPhotoSource({ ...item, isCropped: true }), "cropped.webp");
  assert.equal(getPhotoSource({ blobUrl: "legacy.jpg", hqBlobUrl: null }), "legacy.jpg");
});

test("a custom media domain remaps existing photos while leaving other origins alone", () => {
  assert.equal(getPublicMediaUrl(`${LEGACY_MEDIA_ORIGIN}/photos/test.webp`, "https://images.eli-larson.com/"), "https://images.eli-larson.com/photos/test.webp");
  assert.equal(getPublicMediaUrl("https://img.youtube.com/vi/test/hqdefault.jpg", "https://images.eli-larson.com"), "https://img.youtube.com/vi/test/hqdefault.jpg");
  assert.equal(getPublicMediaUrl(`${LEGACY_MEDIA_ORIGIN}.example.com/photo.jpg`, "https://images.eli-larson.com"), `${LEGACY_MEDIA_ORIGIN}.example.com/photo.jpg`);
  assert.equal(getPublicMediaUrl(null, "https://images.eli-larson.com"), null);
});

test("invalid crop inputs are rejected before image processing", () => {
  for (const value of [null, {}, { x: -1, y: 0, width: 10, height: 10 },
    { x: 0, y: 0, width: "10", height: 10 }, { x: 0, y: 0, width: Infinity, height: 10 }]) {
    assert.throws(() => parsePhotoCrop(value), InvalidPhotoCrop);
  }
});

test("a crop preserves detail above the old 2400px limit and never upscales", async () => {
  const source = await sharp({ create: { width: 4500, height: 3000, channels: 3, background: "#d71818" } }).png().toBuffer();
  const large = await cropPhoto(source, parsePhotoCrop({ x: 0, y: 0, width: 4200, height: 2800 }));
  assert.equal(large.width, 4096);
  assert.ok(Math.abs(large.width / large.height - 1.5) < 0.001);
  assert.equal((await sharp(large.buffer).metadata()).format, "webp");
  const small = await cropPhoto(source, parsePhotoCrop({ x: 40, y: 20, width: 600, height: 400 }));
  assert.deepEqual([small.width, small.height], [600, 400]);
});

test("rotation uses the rotated image bounds", async () => {
  const source = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#224488" } }).png().toBuffer();
  const rotated = await cropPhoto(source, parsePhotoCrop({ x: 0, y: 0, width: 200, height: 300, rotation: 90 }));
  assert.deepEqual([rotated.width, rotated.height], [200, 300]);
  await assert.rejects(cropPhoto(source, parsePhotoCrop({ x: 200, y: 0, width: 100, height: 300, rotation: 90 })), InvalidPhotoCrop);
});

test("EXIF orientation is applied before cropping", async () => {
  const source = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#228844" } })
    .jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const crop = await cropPhoto(source, parsePhotoCrop({ x: 0, y: 0, width: 200, height: 300 }));
  assert.deepEqual([crop.width, crop.height], [200, 300]);
});

test("dominant-color extraction produces a valid placeholder", async () => {
  const source = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#ff0000" } }).png().toBuffer();
  const color = await photoDominantColor(source);
  assert.match(color, /^#[\da-f]{6}$/);
  assert.ok(parseInt(color.slice(1, 3), 16) > 240);
  assert.ok(parseInt(color.slice(3, 5), 16) < 16);
});
