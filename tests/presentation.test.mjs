import test from "node:test";
import assert from "node:assert/strict";
import { parsePresentation, resolvePhotos, photoCaption, photoAlt, viewerPadding } from "../src/lib/presentation.ts";

const edit = () => ({ version: 1, editorPhotoIds: [3, 1], stories: [{ slug: "a-story", title: "A story", category: "Sport", description: "Across several games.", photoIds: [1, 2, 3, 4, 5, 6], published: true }], photoDetails: { "1": { event: "Final", role: "Photographer" } } });

test("curation preserves editorial order and omits deleted, duplicate, and non-photo references", () => {
  const items = [{ id: 1, type: "photo", blobUrl: "one" }, { id: 2, type: "video", blobUrl: "two" }, { id: 3, type: "photo", blobUrl: "three" }, { id: 4, type: "photo", blobUrl: null }];
  assert.deepEqual(resolvePhotos(items, [3, 2, 1, 3, 4, 99]).map(item => item.id), [3, 1]);
});

test("valid published edits round-trip; empty selection and draft stories are allowed", () => {
  assert.deepEqual(parsePresentation(edit()), edit());
  const draft = edit(); draft.editorPhotoIds = []; draft.stories[0].published = false; draft.stories[0].photoIds = [];
  assert.deepEqual(parsePresentation(draft), draft);
});

test("reject invalid IDs, duplicate addresses, oversized edits and incomplete published stories", () => {
  for (const mutate of [
    c => { c.editorPhotoIds = [1, 1]; },
    c => { c.editorPhotoIds = [-1]; },
    c => { c.editorPhotoIds = Array.from({ length: 19 }, (_, i) => i + 1); },
    c => { c.stories.push(c.stories[0]); },
    c => { c.stories[0].slug = "../admin"; },
    c => { c.stories[0].photoIds = [1]; },
    c => { c.stories[0].published = "yes"; },
    c => { c.photoDetails = { "__proto__": {}, "not-an-id": {} }; },
    c => { c.photoDetails[1].event = "x".repeat(181); },
  ]) { const config = edit(); mutate(config); assert.throws(() => parsePresentation(config)); }
});

test("information uses real captions and excludes filename-generated alt text", () => {
  assert.equal(photoCaption({ caption: "  At the finish. ", altText: "DSC 001", fileName: "DSC_001.jpg" }), "At the finish.");
  assert.equal(photoCaption({ caption: null, altText: "DSC 001", fileName: "DSC_001.jpg" }), "");
  assert.equal(photoCaption({ caption: null, altText: "Athlete crossing the finish line", fileName: "DSC_001.jpg" }), "Athlete crossing the finish line");
  assert.equal(photoAlt({ caption: "At the finish.", altText: "DSC 001", fileName: "DSC_001.jpg" }), "At the finish.");
  assert.equal(photoAlt({ caption: "At the finish.", altText: "Athlete crossing the line", fileName: "DSC_001.jpg" }), "Athlete crossing the line");
});

test("the info panel leaves positive image space on desktop, mobile, and short landscape screens", () => {
  for (const [width, height] of [[1440, 900], [900, 600], [390, 844], [320, 568], [844, 390], [667, 320]]) {
    const padding = viewerPadding(width, height, true);
    assert.ok(width - padding.left - padding.right > 0);
    assert.ok(height - padding.top - padding.bottom > 0);
    if (width >= 900) assert.equal(padding.right, 392);
    else assert.equal(padding.bottom, Math.min(280, Math.round(height * .36)) + 32);
  }
});
