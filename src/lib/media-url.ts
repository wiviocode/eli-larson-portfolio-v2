export const LEGACY_MEDIA_ORIGIN = "https://pub-b19d201d05f6467982bec600ac9c4cc1.r2.dev";

/** Switch existing public media to a configured R2 domain without rewriting rows. */
export function getPublicMediaUrl(url: string | null, publicBase = process.env.R2_PUBLIC_URL): string | null {
  if (!url || !publicBase || !url.startsWith(`${LEGACY_MEDIA_ORIGIN}/`)) return url;
  return `${publicBase.replace(/\/+$/, "")}${url.slice(LEGACY_MEDIA_ORIGIN.length)}`;
}
