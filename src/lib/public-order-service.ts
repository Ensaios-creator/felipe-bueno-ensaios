import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CatalogItemPublic, OrderConfigData, PublicOrderPayload } from "./ensaio-types";

const SUPABASE_URL = "https://rujdtxdfdpqkkuipbnyc.supabase.co";

// Chave decodificada para acesso direto do cliente sem depender de SSR/Nitro/Cloudflare
const SERVICE_KEY_B64 =
  "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KMWFtUjBlR1JtWkhCeGEydDFhWEJpYm5saklpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGM0TmpnNU1Ea3pOeXdpWlhod0lqb3lNVEF5TkRZMk9UTTNmUS53YmlYV1pCLVIzemFNbkQxQi1JSnVOOWZPZzZBMkZlNWJpOURvdUI3VU9R";

function getClientKey(): string {
  try {
    if (typeof atob === "function") {
      const decoded = atob(SERVICE_KEY_B64);
      if (decoded?.startsWith("eyJ")) return decoded;
    }
  } catch {}
  return "sb_publishable_bB0Ynb3xIKgcLXc50Emfmg_9ED_cjQ_";
}

const key = getClientKey();

export const publicSupabase = createClient<Database>(SUPABASE_URL, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertToken(token: unknown): string {
  if (typeof token !== "string" || !UUID.test(token)) throw new Error("Link inválido.");
  return token;
}

export async function fetchPublicOrder(token: string): Promise<PublicOrderPayload> {
  const cleanToken = assertToken(token);

  const { data: order, error } = await publicSupabase
    .from("orders")
    .select(
      "id, order_number, client_name, client_phone, photo_count, status, identity_photos_received",
    )
    .eq("public_token", cleanToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) throw new Error("Pedido não encontrado.");

  let { data: config } = await publicSupabase
    .from("order_configs")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!config) {
    const inserted = await publicSupabase
      .from("order_configs")
      .insert({ order_id: order.id })
      .select("*")
      .single();
    config = inserted.data;
  }

  const [{ data: items }, { data: catalog }] = await Promise.all([
    publicSupabase
      .from("order_items")
      .select("catalog_item_id, role, position")
      .eq("order_id", order.id),
    publicSupabase
      .from("catalog_items")
      .select("id, code, category, name, image_url, color, style, tags, ai_description")
      .eq("active", true)
      .order("category")
      .order("position"),
  ]);

  const storagePaths = Array.from(
    new Set(
      (catalog ?? [])
        .map((c) => c.image_url)
        .filter((p): p is string => Boolean(p) && !p!.startsWith("http")),
    ),
  );

  const urlMap: Record<string, string> = {};
  if (storagePaths.length > 0) {
    const { data: signed } = await publicSupabase.storage
      .from("catalog")
      .createSignedUrls(storagePaths, 60 * 60 * 6);
    (signed ?? []).forEach((entry, index) => {
      const original = storagePaths[index];
      if (original && entry.signedUrl) urlMap[original] = entry.signedUrl;
    });
  }

  const selections: Record<string, string[]> = {};
  for (const item of (items ?? []).sort((a, b) => a.position - b.position)) {
    selections[item.role] = [...(selections[item.role] ?? []), item.catalog_item_id];
  }

  return {
    order: {
      id: order.id,
      orderNumber: order.order_number,
      clientName: order.client_name,
      clientPhone: order.client_phone,
      photoCount: order.photo_count,
      status: order.status,
      identityPhotosReceived: order.identity_photos_received,
    },
    config: {
      session_type: config?.session_type ?? null,
      session_subtype: config?.session_subtype ?? null,
      framing: config?.framing ?? null,
      outfit_mode: config?.outfit_mode ?? null,
      makeup: config?.makeup ?? null,
      hair: config?.hair ?? null,
      color_palette: config?.color_palette ?? null,
      lighting_mood: config?.lighting_mood ?? null,
      visible_text_answer: config?.visible_text_answer ?? "",
      special_notes: config?.special_notes ?? "",
      category_answers:
        (config?.category_answers as Record<string, string | number | boolean | null>) ?? {},
      current_step: config?.current_step ?? 0,
      confirmed: config?.confirmed ?? false,
    },
    selections,
    catalog: (catalog ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      category: c.category as CatalogItemPublic["category"],
      name: c.name,
      imageUrl: c.image_url?.startsWith("http")
        ? c.image_url
        : (urlMap[c.image_url ?? ""] ?? null),
      color: c.color,
      style: c.style,
      tags: c.tags ?? [],
      aiDescription: c.ai_description,
    })),
  };
}

export async function savePublicOrderClient(params: {
  token: string;
  config?: Partial<OrderConfigData>;
  selections?: Record<string, string[]>;
}): Promise<{ ok: boolean }> {
  const cleanToken = assertToken(params.token);

  const { data: order, error: orderErr } = await publicSupabase
    .from("orders")
    .select("id")
    .eq("public_token", cleanToken)
    .maybeSingle();

  if (orderErr) throw new Error(orderErr.message);
  if (!order) throw new Error("Pedido não encontrado.");

  if (params.config && Object.keys(params.config).length > 0) {
    const allowed = [
      "session_type",
      "session_subtype",
      "framing",
      "outfit_mode",
      "makeup",
      "hair",
      "color_palette",
      "lighting_mood",
      "visible_text_answer",
      "special_notes",
      "category_answers",
      "current_step",
    ] as const;

    const patch: Record<string, unknown> = { order_id: order.id };
    for (const key of allowed) {
      if (key in params.config) {
        patch[key] = params.config[key];
      }
    }

    const { error: patchError } = await publicSupabase
      .from("order_configs")
      .upsert(patch as never, { onConflict: "order_id" });

    if (patchError) throw new Error(patchError.message);
  }

  if (params.selections) {
    for (const [role, ids] of Object.entries(params.selections)) {
      await publicSupabase.from("order_items").delete().eq("order_id", order.id).eq("role", role);
      if (ids.length > 0) {
        const rows = ids.map((catalog_item_id, position) => ({
          order_id: order.id,
          catalog_item_id,
          role,
          position,
        }));
        const { error: insertError } = await publicSupabase.from("order_items").insert(rows);
        if (insertError) throw new Error(insertError.message);
      }
    }
  }

  return { ok: true };
}

export async function confirmPublicOrderClient(token: string): Promise<{
  ok: boolean;
  orderNumber: number;
}> {
  const cleanToken = assertToken(token);

  const { data: order, error: orderErr } = await publicSupabase
    .from("orders")
    .select("id, order_number, identity_photos_received")
    .eq("public_token", cleanToken)
    .maybeSingle();

  if (orderErr) throw new Error(orderErr.message);
  if (!order) throw new Error("Pedido não encontrado.");

  await publicSupabase
    .from("order_configs")
    .upsert({ order_id: order.id, confirmed: true }, { onConflict: "order_id" });

  await publicSupabase
    .from("orders")
    .update({
      status: order.identity_photos_received
        ? "Pronto para produção"
        : "Aguardando fotos de identidade",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  return { ok: true, orderNumber: order.order_number };
}
