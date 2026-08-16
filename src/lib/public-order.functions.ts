import { createServerFn } from "@tanstack/react-start";

import type { PublicOrderPayload } from "./ensaio-types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertToken(token: unknown): string {
  if (typeof token !== "string" || !UUID.test(token)) throw new Error("Link inválido.");
  return token;
}

export const getPublicOrder = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => ({ token: assertToken(input?.token) }))
  .handler(async ({ data }): Promise<PublicOrderPayload> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveImageUrls, displayUrl } = await import("./catalog-storage.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, client_name, client_phone, photo_count, status, identity_photos_received",
      )
      .eq("public_token", data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado.");

    let { data: config } = await supabaseAdmin
      .from("order_configs")
      .select("*")
      .eq("order_id", order.id)
      .maybeSingle();

    if (!config) {
      const inserted = await supabaseAdmin
        .from("order_configs")
        .insert({ order_id: order.id })
        .select("*")
        .single();
      config = inserted.data;
    }

    const [{ data: items }, { data: catalog }] = await Promise.all([
      supabaseAdmin.from("order_items").select("catalog_item_id, role, position").eq("order_id", order.id),
      supabaseAdmin
        .from("catalog_items")
        .select("id, code, category, name, image_url, color, style, tags, ai_description")
        .eq("active", true)
        .order("category")
        .order("position"),
    ]);

    const urlMap = await resolveImageUrls(supabaseAdmin, (catalog ?? []).map((c) => c.image_url));

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
        category_answers: (config?.category_answers as Record<string, never>) ?? {},
        current_step: config?.current_step ?? 0,
        confirmed: config?.confirmed ?? false,
      },
      selections,
      catalog: (catalog ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        category: c.category as PublicOrderPayload["catalog"][number]["category"],
        name: c.name,
        imageUrl: displayUrl(c.image_url, urlMap),
        color: c.color,
        style: c.style,
        tags: c.tags ?? [],
        aiDescription: c.ai_description,
      })),
    };
  });

export const savePublicOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      token: string;
      config?: Record<string, unknown>;
      selections?: Record<string, string[]>;
    }) => ({
      token: assertToken(input?.token),
      config: input?.config ?? {},
      selections: input?.selections,
    }),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, confirmed:id")
      .eq("public_token", data.token)
      .maybeSingle();
    if (!order) throw new Error("Pedido não encontrado.");

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
    ];
    const patch: Record<string, unknown> = { order_id: order.id };
    for (const key of allowed) {
      if (key in data.config) patch[key] = data.config[key];
    }

    const { error } = await supabaseAdmin
      .from("order_configs")
      .upsert(patch, { onConflict: "order_id" });
    if (error) throw new Error(error.message);

    if (data.selections) {
      for (const [role, ids] of Object.entries(data.selections)) {
        await supabaseAdmin.from("order_items").delete().eq("order_id", order.id).eq("role", role);
        if (ids.length > 0) {
          const rows = ids.map((catalog_item_id, position) => ({
            order_id: order.id,
            catalog_item_id,
            role,
            position,
          }));
          const { error: insertError } = await supabaseAdmin.from("order_items").insert(rows);
          if (insertError) throw new Error(insertError.message);
        }
      }
    }

    return { ok: true };
  });

export const confirmPublicOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: assertToken(input?.token) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, identity_photos_received")
      .eq("public_token", data.token)
      .maybeSingle();
    if (!order) throw new Error("Pedido não encontrado.");

    await supabaseAdmin
      .from("order_configs")
      .upsert({ order_id: order.id, confirmed: true }, { onConflict: "order_id" });

    await supabaseAdmin
      .from("orders")
      .update({
        status: order.identity_photos_received
          ? "Pronto para produção"
          : "Aguardando fotos de identidade",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    return { ok: true, orderNumber: order.order_number };
  });
