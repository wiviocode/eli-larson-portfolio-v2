/**
 * Sets CORS rules on the R2 bucket.
 *
 * Run once: node scripts/setup-r2-cors.mjs
 * Requires R2_* vars in .env.local
 */

import { readFileSync } from "fs";
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

// Load .env.local
const envFile = readFileSync(".env.local", "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: envVars.R2_ENDPOINT,
  credentials: {
    accessKeyId: envVars.R2_ACCESS_KEY_ID,
    secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
  },
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: envVars.R2_BUCKET_NAME,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [
            "http://localhost:3000",
            "https://www.eli-larson.com",
            "https://eli-larson.com",
          ],
          AllowedMethods: ["PUT", "GET"],
          AllowedHeaders: ["Content-Type"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  })
);

console.log("CORS rules set successfully on bucket:", envVars.R2_BUCKET_NAME);
