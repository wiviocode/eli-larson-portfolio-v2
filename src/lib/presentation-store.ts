import { cache } from "react";
import { defaultPresentation } from "@/content/presentation";
import { parsePresentation, type Presentation } from "./presentation";
import { readPresentationObject, writePresentationObject } from "./r2";

export const getPresentation = cache(async () => {
  const stored = await readPresentationObject();
  return stored
    ? { config: parsePresentation(JSON.parse(stored.body)), revision: stored.etag }
    : { config: defaultPresentation, revision: null };
});

export async function savePresentation(config: Presentation, revision: string | null) {
  return writePresentationObject(JSON.stringify(config), revision);
}
