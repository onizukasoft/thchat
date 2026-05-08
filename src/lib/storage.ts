import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// ใน dev → บันทึก public/uploads/  |  ใน prod → ส่งขึ้น Cloudflare R2
const isR2 =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME;

const r2 = isR2
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export type UploadFolder = "chat" | "avatar" | "cover" | "post" | "clip";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

export function isAllowedImage(mime: string) { return ALLOWED_IMAGE.includes(mime); }
export function isAllowedVideo(mime: string) { return ALLOWED_VIDEO.includes(mime); }
export function isAllowedMedia(mime: string) { return isAllowedImage(mime) || isAllowedVideo(mime); }

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  folder: UploadFolder,
): Promise<string> {
  const ext = mimeType.split("/")[1]
    .replace("jpeg", "jpg")
    .replace("quicktime", "mov")
    .replace("x-msvideo", "avi");
  const filename = `${randomUUID()}.${ext}`;
  const key = `${folder}/${filename}`;

  if (r2) {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000",
      }),
    );
    const base = process.env.R2_PUBLIC_URL ?? `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com`;
    return `${base}/${key}`;
  }

  // local dev fallback
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}
