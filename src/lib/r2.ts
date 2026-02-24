import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** Generate a presigned PUT URL for direct browser upload (30min expiry) */
export async function createPresignedUpload(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, {
    expiresIn: 1800,
    signableHeaders: new Set(["content-type"]),
  });
}

/** Upload a buffer to R2 and return the public URL */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return publicUrl(key);
}

/** Delete an object by its public URL. Silently skips non-R2 URLs. */
export async function deleteByUrl(url: string): Promise<void> {
  const key = keyFromUrl(url);
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
  } catch {
    // Object may already be deleted
  }
}

/** Fetch an object from R2 as a Buffer (for server-side image processing) */
export async function fetchBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

/** Construct the public URL for an R2 object key */
export function publicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Extract the object key from an R2 public URL. Returns null for non-R2 URLs. */
function keyFromUrl(url: string): string | null {
  if (!url.startsWith(R2_PUBLIC_URL)) return null;
  return url.slice(R2_PUBLIC_URL.length + 1); // +1 for the /
}
