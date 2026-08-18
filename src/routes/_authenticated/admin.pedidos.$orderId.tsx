import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  MessageCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogItemPublic, CustomReference, OrderConfigData } from "@/lib/ensaio-types";
import { buildSummarySections, referenceImages, summaryToText } from "@/lib/order-summary";
import { cn } from "@/lib/utils";
import { identityPhotosMessage, whatsappLink } from "@/lib/whatsapp";
import { getDeadlineInfo } from "./admin.index";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$orderId")({
  head: () => ({
    meta: [
      { title: "Briefing do pedido — Configurador de Ensaios" },
      {
        name: "description",
        content:
          "Resumo estruturado do ensaio configurado pela cliente, pronto para gerar prompts.",
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
          .select(
            "id, image_url, style, position, session_types, people_count, gender, ambiance, vibe, has_cake, has_age_number, tags, active",
          )
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
        imageUrl: c.image_url?.startsWith("http")
          ? c.image_url
          : (urlMap[c.image_url ?? ""] ?? null),
        sessionTypes: (c.session_types ?? []) as string[],
        peopleCount: c.people_count ?? null,
        gender: c.gender ?? null,
        ambiance: c.ambiance ?? null,
        style: c.style ?? null,
        vibe: c.vibe ?? null,
        position: c.position ?? 0,
      }));

      const configAnswers = (config?.category_answers as Record<string, unknown>) ?? {};
      const configData: OrderConfigData = {
        session_type: config?.session_type ?? null,
        session_subtype: config?.session_subtype ?? null,
        framing: config?.framing ?? null,
        outfit_mode: config?.outfit_mode ?? null,
        outfit_reference_id: (configAnswers["_outfit_reference_id"] as string) ?? null,
        outfit_reference_ids: (configAnswers["_outfit_reference_ids"] as string[]) ?? [],
        scenario_mode: (configAnswers["_scenario_mode"] as string) ?? null,
        scenario_reference_id: (configAnswers["_scenario_reference_id"] as string) ?? null,
        scenario_reference_ids: (configAnswers["_scenario_reference_ids"] as string[]) ?? [],
        makeup: config?.makeup ?? null,
        hair: config?.hair ?? null,
        expression: (configAnswers["_expression"] as string) ?? null,
        color_palette: config?.color_palette ?? null,
        lighting_mood: config?.lighting_mood ?? null,
        visible_text_answer: config?.visible_text_answer ?? "",
        special_notes: config?.special_notes ?? "",
        category_answers: (config?.category_answers as OrderConfigData["category_answers"]) ?? {},
        custom_references: (configAnswers["_custom_references"] as CustomReference[]) ?? [],
        current_step: config?.current_step ?? 0,
        confirmed: config?.confirmed ?? false,
      };

      return { order, configData, selections, catalogItems };
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase
        .from("orders")
        .update(patch as never)
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteOrder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").delete().eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido excluído.");
      navigate({ to: "/admin" });
    },
    onError: (error: Error) => toast.error(error.message),
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
  const references = referenceImages(catalogItems, selections, configData.custom_references);
  const fullText = summaryToText(sections);
  const isDelivered = order.status === "Entregue";
  const deadlineInfo = getDeadlineInfo(order);

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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-2 size-4" />
              Pedidos
            </Link>
          </Button>

          <Button variant="outline" onClick={() => copy("full", fullText)}>
            {copiedKey === "full" ? (
              <Check className="mr-2 size-4 text-emerald-600" />
            ) : (
              <Copy className="mr-2 size-4" />
            )}
            Copiar briefing
          </Button>

          {references.length > 0 ? (
            <Button asChild variant="outline">
              <a href={`/api/public/ensaio-zip?token=${order.public_token}`}>
                <Download className="mr-2 size-4" />
                Baixar referências
              </a>
            </Button>
          ) : null}

          {!isDelivered ? (
            <Button
              onClick={() =>
                update.mutate({
                  status: "Entregue",
                  completed_at: new Date().toISOString(),
                })
              }
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <Check className="mr-2 size-4" />
              Marcar como entregue
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                update.mutate({
                  status: "Pronto para produção",
                  completed_at: null,
                })
              }
            >
              Reabrir pedido
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pedido #{order.order_number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os dados deste pedido e suas escolhas
                  serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteOrder.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
    >
      {!order.identity_photos_received ? (
        <div className="mb-8 flex flex-wrap items-start gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-5 shadow-editorial">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-64 flex-1">
            <p className="font-medium text-destructive">Fotos de identidade ainda não recebidas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Não gere prompts antes de receber as fotos da cliente pelo WhatsApp. A identidade vem
              sempre das fotos reais — nunca de descrição escrita.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                update.mutate({
                  identity_photos_received: true,
                  status: order.status === "Aguardando fotos de identidade" ? "Pronto para produção" : order.status,
                });
                toast.success("Fotos marcadas como recebidas!");
              }}
            >
              <Check className="mr-2 size-4 text-emerald-600" />
              Marcar como recebidas
            </Button>
            <Button asChild variant="outline" size="sm">
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
        </div>
      ) : null}

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge variant={isDelivered ? "default" : "secondary"} className={isDelivered ? "bg-emerald-700 text-white" : ""}>
          {order.status}
        </Badge>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            deadlineInfo.isOverdue
              ? "border-destructive/40 bg-destructive/10 text-destructive font-semibold"
              : "border-border bg-secondary/50 text-foreground",
          )}
        >
          <Clock className="size-3" />
          Prazo: {deadlineInfo.label}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="eyebrow">{section.title}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => copy(section.title, section.body)}
                  title="Copiar esta seção"
                >
                  {copiedKey === section.title ? (
                    <Check className="size-4 text-emerald-600" />
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
          <p className="eyebrow">
            Referências visuais escolhidas ({references.length})
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {references.map((item, index) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <a href={item.imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={item.imageUrl}
                        alt={`Referência ${index + 1}`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </a>
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <span className="font-display text-sm">Sem imagem</span>
                    </div>
                  )}
                  <span className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-foreground/90 text-xs font-semibold text-background shadow">
                    #{index + 1}
                  </span>
                  {item.isCustom ? (
                    <span className="absolute right-2.5 top-2.5 rounded bg-amber-500 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow">
                      ✨ Do Cliente
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between p-2.5 text-xs text-muted-foreground">
                  <span className="capitalize font-medium text-foreground">
                    {item.style || item.vibe || "Ensaio completo"}
                  </span>
                  {item.peopleCount ? (
                    <span>{item.peopleCount} {item.peopleCount === 1 ? "pessoa" : "pessoas"}</span>
                  ) : null}
                </div>
              </div>
            ))}
            {references.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">
                O cliente ainda não escolheu referências visuais.
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

