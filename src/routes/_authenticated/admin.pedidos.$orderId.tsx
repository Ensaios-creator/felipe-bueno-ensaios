import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogItemPublic, OrderConfigData } from "@/lib/ensaio-types";
import { buildSummarySections, referenceImages, summaryToText } from "@/lib/order-summary";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$orderId")({
  head: () => ({
    meta: [
      { title: "Briefing do pedido — Configurador de Ensaios" },
      {
        name: "description",
        content: "Resumo estruturado do ensaio configurado pela cliente, pronto para gerar prompts.",
      },
      { property: "og:title", content: "Briefing do pedido — Configurador de Ensaios" },
      {
        property: "og:description",
        content: "Resumo estruturado do ensaio configurado pela cliente.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      if (error) throw error;

      const [{ data: config }, { data: items }, { data: catalog }] = await Promise.all([
        supabase.from("order_configs").select("*").eq("order_id", orderId).maybeSingle(),
        supabase
          .from("order_items")
          .select("catalog_item_id, role, position")
          .eq("order_id", orderId)
          .order("position"),
        supabase
          .from("catalog_items")
          .select("id, code, category, name, image_url, color, style, tags, ai_description"),
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
        const { data: signed } = await supabase.storage
          .from("catalog")
          .createSignedUrls(storagePaths, 60 * 60 * 6);
        (signed ?? []).forEach((entry, index) => {
          const original = storagePaths[index];
          if (original && entry.signedUrl) urlMap[original] = entry.signedUrl;
        });
      }

      const selections: Record<string, string[]> = {};
      for (const item of items ?? []) {
        selections[item.role] = [...(selections[item.role] ?? []), item.catalog_item_id];
      }

      const catalogItems: CatalogItemPublic[] = (catalog ?? []).map((c) => ({
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
      }));

      const configData: OrderConfigData = {
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
        category_answers: (config?.category_answers as OrderConfigData["category_answers"]) ?? {},
        current_step: config?.current_step ?? 0,
        confirmed: config?.confirmed ?? false,
      };

      return { order, configData, selections, catalogItems };
    },
  });

  if (query.isLoading) {
    return (
      <AdminShell title="Briefing" eyebrow="Pedido">
        <p className="text-sm text-muted-foreground">Carregando pedido...</p>
      </AdminShell>
    );
  }

  if (query.error || !query.data) {
    return (
      <AdminShell title="Pedido não encontrado" eyebrow="Pedido">
        <Button asChild variant="outline">
          <Link to="/admin">
            <ArrowLeft className="mr-2 size-4" />
            Voltar aos pedidos
          </Link>
        </Button>
      </AdminShell>
    );
  }

  const { order, configData, selections, catalogItems } = query.data;
  const sections = buildSummarySections({
    orderNumber: order.order_number,
    clientName: order.client_name,
    photoCount: order.photo_count,
    config: configData,
    selections,
    catalog: catalogItems,
  });
  const references = referenceImages(catalogItems, selections);
  const fullText = summaryToText(sections);

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado.");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <AdminShell
      eyebrow={`Pedido #${order.order_number}`}
      title={order.client_name}
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 size-4" />
              Pedidos
            </Link>
          </Button>
          <Button variant="outline" onClick={() => copy("full", fullText)}>
            {copiedKey === "full" ? (
              <Check className="mr-2 size-4" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            Copiar briefing completo
          </Button>
          {references.length > 0 ? (
            <Button asChild>
              <a href={`/api/public/ensaio-zip?token=${order.public_token}`}>
                <Download className="mr-2 size-4" />
                Baixar referências
              </a>
            </Button>
          ) : null}
        </div>
      }
    >
      {!order.identity_photos_received ? (
        <div className="mb-8 flex flex-wrap items-start gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-64 flex-1">
            <p className="font-medium">Fotos de identidade ainda não recebidas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Não gere prompts antes de receber as fotos da cliente pelo WhatsApp. A identidade vem
              sempre das fotos reais — nunca de descrição escrita.
            </p>
          </div>
          <Button asChild variant="outline">
            <a
              href={whatsappLink(
                order.client_phone,
                identityPhotosMessage({
                  clientName: order.client_name,
                  orderNumber: order.order_number,
                }),
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-2 size-4" />
              Pedir fotos no WhatsApp
            </a>
          </Button>
        </div>
      ) : null}


      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="secondary">{order.status}</Badge>
        <Badge variant="outline">{order.photo_count} fotos</Badge>
        {configData.confirmed ? (
          <Badge variant="outline">Configuração confirmada</Badge>
        ) : (
          <Badge variant="outline">Configuração em andamento</Badge>
        )}
        {order.client_phone ? <Badge variant="outline">{order.client_phone}</Badge> : null}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="eyebrow">{section.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(section.title, `${section.title}\n${section.body}`)}
                >
                  {copiedKey === section.title ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {section.body}
              </pre>
            </div>
          ))}
        </div>

        <div>
          <p className="eyebrow">Referências visuais escolhidas</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {references.map((item) => (
              <a
                key={item.id}
                href={item.imageUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={item.imageUrl ?? ""}
                  alt={item.name}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform group-hover:scale-[1.02]"
                />
                <p className="p-2 text-xs text-muted-foreground">
                  {item.code} · {item.name}
                </p>
              </a>
            ))}
            {references.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                A cliente ainda não escolheu referências visuais.
              </p>
            ) : null}
          </div>

          {order.internal_notes ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <p className="eyebrow">Notas internas</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{order.internal_notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
