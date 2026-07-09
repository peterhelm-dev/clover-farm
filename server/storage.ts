// Storage helpers backed by Supabase Storage.
// Uploads go straight to the configured bucket via the service-role client;
// downloads are served through signed URLs (bucket is private by default).

import { ENV } from "./_core/env";
import { getSupabaseAdmin } from "./_core/supabaseAdmin";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  const { error } = await getSupabaseAdmin()
    .storage.from(ENV.supabaseStorageBucket)
    .upload(key, data, { contentType, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { key, url: `/storage-proxy/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage-proxy/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);

  const { data, error } = await getSupabaseAdmin()
    .storage.from(ENV.supabaseStorageBucket)
    .createSignedUrl(key, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`Storage signed URL failed: ${error?.message ?? "unknown error"}`);
  }

  return data.signedUrl;
}
