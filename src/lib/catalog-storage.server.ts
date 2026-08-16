import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SIGNED_URL_TTL = 60 * 60 * 12;

/**
 * Catalog images live in a private bucket. Rows store either a full http(s) URL
 * or a storage path inside the `catalog` bucket. This resolves both to a
 * displayable URL.
 */
export async function resolveImageUrls(
  client: SupabaseClient<Database>,
  paths: (string | null)[],
): Promise<Record<string, string>> {
  const storagePaths = Array.from(
    new Set(paths.filter((p): p is string => Boolean(p) && !p!.startsWith("http"))),
  );
  if (storagePaths.length === 0) return {};

  const { data, error } = await client.storage
    .from("catalog")
    .createSignedUrls(storagePaths, SIGNED_URL_TTL);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  data.forEach((entry, index) => {
    const original = storagePaths[index];
    if (original && entry.signedUrl) map[original] = entry.signedUrl;
  });
  return map;
}

export function displayUrl(raw: string | null, map: Record<string, string>) {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  return map[raw] ?? null;
}
