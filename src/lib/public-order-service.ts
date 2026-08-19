import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CatalogItemPublic, OrderConfigData, PublicOrderPayload } from "./ensaio-types";

const SUPABASE_URL = "https://rujdtxdfdpqkkuipbnyc.supabase.co";

// Publishable key (equivalente à anon key) — segura para usar no frontend.
// As RLS policies no Supabase garantem que o cliente anônimo só acessa
// dados via public_token, sem expor pedidos de outros clientes.
const PUBLISHABLE_KEY =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  "sb_publishable_bB0Ynb3xIKgcLXc50Emfmg_9ED_cjQ_";

export const publicSupabase = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertToken(token: unknown): string {
  if (typeof token !== "string" || !UUID.test(token)) throw new Error("Link inválido.");
  return token;
}

// Interface local para os campos do catalog_items que podem não estar
// nos tipos gerados pelo Supabase (campos adicionados via migration).
interface CatalogRaw {
  id: string;
  image_url: string | null;
  style: string | null;
  position: number;
  session_types: string[] | null;
  people_count: number | null;
  gender: string | null;
  ambiance: string | null;
  vibe: string | null;
  has_cake: boolean | null;
  has_age_number: boolean | null;
  tags: string[] | null;
}

export function getPublicCatalogImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const { data } = publicSupabase.storage.from("catalog").getPublicUrl(path);
  return data.publicUrl;
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

  const [{ data: items }, rawCatalogResult] = await Promise.all([
    publicSupabase
      .from("order_items")
      .select("catalog_item_id, role, position")
      .eq("order_id", order.id),
    // Cast necessário pois os campos adicionados via migration podem não estar
    // no tipo gerado automaticamente pelo Supabase CLI.
    (publicSupabase
      .from("catalog_items")
      .select(
        "id, image_url, style, position, session_types, people_count, gender, ambiance, vibe, has_cake, has_age_number, tags",
      )
      .eq("active", true)
      .order("position") as unknown) as Promise<{ data: CatalogRaw[] | null }>,
  ]);

  const catalog = (await rawCatalogResult).data ?? [];

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
      expression:
        (config?.category_answers as Record<string, unknown>)?.[
          "_expression"
        ] as string ?? null,
      outfit_reference_id:
        (config?.category_answers as Record<string, unknown>)?.[
          "_outfit_reference_id"
        ] as string ?? null,
      outfit_reference_ids:
        (config?.category_answers as Record<string, unknown>)?.[
          "_outfit_reference_ids"
        ] as string[] ?? [],
      scenario_mode:
        (config?.category_answers as Record<string, unknown>)?.[
          "_scenario_mode"
        ] as string ?? null,
      scenario_reference_id:
        (config?.category_answers as Record<string, unknown>)?.[
          "_scenario_reference_id"
        ] as string ?? null,
      scenario_reference_ids:
        (config?.category_answers as Record<string, unknown>)?.[
          "_scenario_reference_ids"
        ] as string[] ?? [],
      color_palette: config?.color_palette ?? null,
      lighting_mood: config?.lighting_mood ?? null,
      visible_text_answer: config?.visible_text_answer ?? "",
      special_notes: config?.special_notes ?? "",
      category_answers:
        (config?.category_answers as Record<string, string | number | boolean | null | string[]>) ?? {},
      custom_references:
        ((config?.category_answers as Record<string, unknown>)?.[
          "_custom_references"
        ] as OrderConfigData["custom_references"]) ?? [],
      current_step: config?.current_step ?? 0,
      confirmed: config?.confirmed ?? false,
    },
    selections,
    catalog: catalog.map((c) => ({
      id: c.id,
      imageUrl: getPublicCatalogImageUrl(c.image_url),
      sessionTypes: (c.session_types ?? []) as string[],
      sessionSubtypes: (c.tags ?? []) as string[],
      peopleCount: c.people_count ?? null,
      gender: c.gender ?? null,
      ambiance: c.ambiance ?? null,
      style: c.style ?? null,
      vibe: c.vibe ?? null,
      hasCake: Boolean(c.has_cake),
      hasAgeNumber: Boolean(c.has_age_number),
      tags: (c.tags ?? []) as string[],
      position: c.position ?? 0,
    })) satisfies CatalogItemPublic[],
  };
}

export async function uploadClientReferencePhoto({
  token,
  file,
}: {
  token: string;
  file: File;
}) {
  const cleanToken = assertToken(token);
  const { data: order, error: orderErr } = await publicSupabase
    .from("orders")
    .select("id")
    .eq("public_token", cleanToken)
    .single();

  if (orderErr || !order) throw new Error("Pedido não encontrado.");

  const ext = file.name.split(".").pop() || "jpg";
  const refId = `custom-${crypto.randomUUID()}`;
  const path = `clientes/${order.id}/${refId}.${ext}`;

  const { error: uploadError } = await publicSupabase.storage
    .from("catalog")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const imageUrl = getPublicCatalogImageUrl(path)!;
  return {
    id: refId,
    imageUrl,
    name: file.name,
    createdAt: new Date().toISOString(),
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

    // Se houver campos extras como custom_references, expression, outfit/scenario refs, salva em category_answers
    const hasCustomFields =
      params.config.custom_references !== undefined ||
      params.config.expression !== undefined ||
      params.config.outfit_reference_id !== undefined ||
      params.config.outfit_reference_ids !== undefined ||
      params.config.scenario_mode !== undefined ||
      params.config.scenario_reference_id !== undefined ||
      params.config.scenario_reference_ids !== undefined;

    if (hasCustomFields) {
      const { data: currentConfig } = await publicSupabase
        .from("order_configs")
        .select("category_answers")
        .eq("order_id", order.id)
        .maybeSingle();

      const existingAnswers =
        (currentConfig?.category_answers as Record<string, unknown>) ?? {};
      const newAnswers =
        (patch["category_answers"] as Record<string, unknown>) ?? existingAnswers;

      const mergedAnswers = { ...newAnswers };
      if (params.config.custom_references !== undefined) {
        mergedAnswers["_custom_references"] = params.config.custom_references;
      }
      if (params.config.expression !== undefined) {
        mergedAnswers["_expression"] = params.config.expression;
      }
      if (params.config.outfit_reference_id !== undefined) {
        mergedAnswers["_outfit_reference_id"] = params.config.outfit_reference_id;
      }
      if (params.config.outfit_reference_ids !== undefined) {
        mergedAnswers["_outfit_reference_ids"] = params.config.outfit_reference_ids;
      }
      if (params.config.scenario_mode !== undefined) {
        mergedAnswers["_scenario_mode"] = params.config.scenario_mode;
      }
      if (params.config.scenario_reference_id !== undefined) {
        mergedAnswers["_scenario_reference_id"] = params.config.scenario_reference_id;
      }
      if (params.config.scenario_reference_ids !== undefined) {
        mergedAnswers["_scenario_reference_ids"] = params.config.scenario_reference_ids;
      }

      patch["category_answers"] = mergedAnswers;
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
