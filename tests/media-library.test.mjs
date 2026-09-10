import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { filterMedia, mergeMediaOrder, isMediaType, canChangeMediaType } from "../src/lib/media-library.ts";
import { resolvePhotos } from "../src/lib/presentation.ts";
import { prepareGraphic } from "../src/lib/graphic-processing.ts";

const items = [
  { id: 1, type: "photo", blobUrl: "photo-one" },
  { id: 2, type: "graphic", blobUrl: "graphic-one" },
  { id: 3, type: "video", blobUrl: "video-one" },
  { id: 4, type: "graphic", blobUrl: "graphic-two" },
  { id: 5, type: "photo", blobUrl: "photo-two" },
];

test("media categories are separate and graphics cannot enter photo selections", () => {
  assert.deepEqual(filterMedia(items, "graphic").map(item => item.id), [2, 4]);
  assert.deepEqual(filterMedia(items, "video").map(item => item.id), [3]);
  assert.deepEqual(resolvePhotos(items, [4, 5, 2, 1]).map(item => item.id), [5, 1]);
  assert.equal(filterMedia(items, "all"), items);
  assert.ok(isMediaType("graphic"));
  assert.equal(isMediaType("graphics"), false);
});

test("reordering a filtered library preserves the positions and order of all other media", () => {
  const result = mergeMediaOrder(items, [items[3], items[1]]);
  assert.deepEqual(result.map(item => item.id), [1, 4, 3, 2, 5]);
  assert.deepEqual(items.map(item => item.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(mergeMediaOrder(items, []).map(item => item.id), [1, 2, 3, 4, 5]);
  assert.throws(() => mergeMediaOrder(items, [items[0], items[0]]));
  assert.throws(() => mergeMediaOrder(items, [{ id: 999 }]));
});

test("photo and graphic classification is reversible; videos cannot change into images", () => {
  assert.ok(canChangeMediaType("photo", "graphic"));
  assert.ok(canChangeMediaType("graphic", "photo"));
  assert.equal(canChangeMediaType("video", "graphic"), false);
  assert.equal(canChangeMediaType("photo", "video"), false);
});

test("graphic previews preserve transparency and exact pixel colors without upscaling", async () => {
  const source = await sharp({ create: { width: 64, height: 32, channels: 4, background: { r: 227, g: 22, b: 22, alpha: .5 } } }).png().toBuffer();
  const result = await prepareGraphic(source);
  assert.equal(result.width, 64);
  assert.equal(result.height, 32);
  assert.equal(result.contentType, "image/png");
  const previewMetadata = await sharp(result.preview).metadata();
  assert.equal(previewMetadata.width, 64);
  assert.equal(previewMetadata.hasAlpha, true);
  assert.deepEqual(await sharp(result.preview).raw().toBuffer(), await sharp(source).raw().toBuffer());
});

test("large graphics get bounded previews while retaining their original dimensions for zoom", async () => {
  const source = await sharp({ create: { width: 2400, height: 3600, channels: 3, background: "#ffffff" } }).png().toBuffer();
  const result = await prepareGraphic(source);
  const preview = await sharp(result.preview).metadata();
  assert.equal(preview.height, 1600);
  assert.equal(result.width, 2400);
  assert.equal(result.height, 3600);
});

test("graphic dimensions respect EXIF orientation, and unsupported uploads fail explicitly", async () => {
  const source = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#fff" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const result = await prepareGraphic(source);
  assert.equal(result.width, 40);
  assert.equal(result.height, 80);
  await assert.rejects(() => prepareGraphic(Buffer.from("not an image")));
  const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#fff" } }).gif().toBuffer();
  await assert.rejects(() => prepareGraphic(gif), /still PNG/);
});
