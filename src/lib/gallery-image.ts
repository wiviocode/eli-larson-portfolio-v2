/** The HQ URL is an uncropped master. A saved crop must use its display file. */
export function getPhotoSource(item: {
  blobUrl: string | null;
  hqBlobUrl: string | null;
  isCropped?: boolean;
}): string | null {
  return item.isCropped ? item.blobUrl : item.hqBlobUrl || item.blobUrl;
}
