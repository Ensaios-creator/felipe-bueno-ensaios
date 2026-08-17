import { createFileRoute } from "@tanstack/react-router";
import { zipSync } from "fflate";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/public/ensaio-zip")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!UUID.test(token)) {
          return new Response("Invalid token", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, order_number")
          .eq("public_token", token)
          .maybeSingle();
        if (!order) return new Response("Not found", { status: 404 });

        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("role, position, catalog_items(image_url)")
          .eq("order_id", order.id)
          .order("position");

        const files: Record<string, Uint8Array> = {};

        for (const item of items ?? []) {
          const catalogItem = item.catalog_items as {
            image_url: string | null;
          } | null;
          const path = catalogItem?.image_url;
          if (!path) continue;

          let bytes: Uint8Array | null = null;
          if (path.startsWith("http")) {
            const response = await fetch(path);
            if (response.ok) bytes = new Uint8Array(await response.arrayBuffer());
          } else {
            const { data } = await supabaseAdmin.storage.from("catalog").download(path);
            if (data) bytes = new Uint8Array(await data.arrayBuffer());
          }
          if (!bytes) continue;

          const ext = path.split(".").pop()?.split("?")[0] ?? "jpg";
          const safeName = `referencia-${String(item.position + 1).padStart(2, "0")}`;
          files[`${safeName}.${ext}`] = bytes;
        }

        if (Object.keys(files).length === 0) {
          return new Response("Sem imagens de referência para este pedido.", { status: 404 });
        }

        const zipped = zipSync(files, { level: 0 });

        return new Response(zipped as unknown as BodyInit, {
          headers: {
            "content-type": "application/zip",
            "content-disposition": `attachment; filename="pedido-${order.order_number}-referencias.zip"`,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
