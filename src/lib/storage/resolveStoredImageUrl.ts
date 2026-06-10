import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

function parseSupabaseStorageUrl(value: string) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
    );
    if (!match) return null;
    return {
      bucket: decodeURIComponent(match[1]),
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

export async function resolveStoredImageUrl({
  admin,
  value,
  fallbackBuckets = [],
}: {
  admin: SupabaseClient;
  value?: string | null;
  fallbackBuckets?: string[];
}) {
  const source = value?.trim();
  if (!source) return null;
  const parsed = parseSupabaseStorageUrl(source);
  const candidates = parsed
    ? [{ bucket: parsed.bucket, path: parsed.path }]
    : fallbackBuckets.map((bucket) => ({ bucket, path: source }));

  for (const candidate of candidates) {
    const { data, error } = await admin.storage
      .from(candidate.bucket)
      .createSignedUrl(candidate.path, 60 * 60);
    if (!error && data?.signedUrl) return data.signedUrl;
  }

  return /^https?:\/\//i.test(source) ? source : null;
}
