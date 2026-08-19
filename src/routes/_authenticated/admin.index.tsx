import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  LayoutGrid,
  List,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  configuratorLinkMessage,
  formatClientPhone,
  identityPhotosMessage,
  whatsappDirectLink,
  whatsappLink,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Pedidos — Gestão e Produção" },
      { name: "description", content: "Painel de pedidos de ensaios fotográficos do estúdio." },
      { property: "og:title", content: "Pedidos — Gestão e Produção" },
      {
        property: "og:description",
        content: "Painel de pedidos de ensaios fotográficos do estúdio.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  order_number: number;
  client_name: string;
  client_phone: string;
  photo_count: number;
  package_label: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  internal_notes: string;
  identity_photos_received: boolean;
  public_token: string;
  submitted_at: string | null;
  created_at: string;
};

const SORTS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "prazo", label: "Prazo (Horas restantes)" },
  { value: "prioridade", label: "Prioridade Urgente" },
] as const;

type TabFilter = "ativos" | "aguardando_cliente" | "aguardando_fotos" | "em_producao" | "entregues" | "todos";

// Utilitários para gestão de prazo em Horas (Máximo 24h)
export function getOrderDueHours(order: OrderRow): number {
  if (order.internal_notes) {
    const match = order.internal_notes.match(/\[Prazo:\s*(\d+)h\]/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 24) return parsed;
    }
  }
  return 24; // Padrão 24 horas
}

export function getCleanNotes(internalNotes: string | null | undefined): string {
  if (!internalNotes) return "";
  return internalNotes.replace(/\[Prazo:\s*\d+h\]\s*/i, "").trim();
}

export function formatNotesWithHours(notes: string, hours: number): string {
  const cleanHours = Math.min(24, Math.max(1, Number(hours) || 24));
  const tag = `[Prazo: ${cleanHours}h]`;
  const clean = getCleanNotes(notes);
  return clean ? `${tag} ${clean}` : tag;
}

export function getDeadlineInfo(order: OrderRow) {
  const hours = getOrderDueHours(order);
  const createdAt = new Date(order.created_at).getTime();
  const deadlineTime = createdAt + hours * 60 * 60 * 1000;
  const now = Date.now();
  const diffMinutes = Math.round((deadlineTime - now) / (1000 * 60));

  if (order.status === "Entregue") {
    return { hours, label: `Prazo: ${hours}h`, isOverdue: false, remainingText: "Concluído" };
  }

  if (diffMinutes <= 0) {
    const overdueHours = Math.abs(Math.round(diffMinutes / 60));
    return {
      hours,
      label: `Prazo: ${hours}h (Atrasado ${overdueHours === 0 ? "< 1h" : `${overdueHours}h`})`,
      isOverdue: true,
      remainingText: "Atrasado",
    };
  }

  const remainingHours = Math.floor(diffMinutes / 60);
  const remainingMins = diffMinutes % 60;
  const remainingText =
    remainingHours > 0 ? `Restam ${remainingHours}h` : `Restam ${remainingMins}min`;

  return {
    hours,
    label: `Prazo: ${hours}h (${remainingText})`,
    isOverdue: false,
    remainingText,
  };
}

function needsIdentityPhotos(order: OrderRow) {
  return Boolean(order.submitted_at) && !order.identity_photos_received;
}

function OrdersPage() {
  const queryClient = useQueryClient();
  const [tabFilter, setTabFilter] = useState<TabFilter>("ativos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sort, setSort] = useState<string>("recentes");
  const [view, setView] = useState<"tabela" | "kanban">("tabela");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Escuta em tempo real as atualizações no banco (quando o cliente clica para enviar ou fotos chegam)
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (payload.eventType === "UPDATE") {
            const newRow = payload.new as OrderRow;
            const oldRow = payload.old as Partial<OrderRow>;
            if (newRow.submitted_at && !oldRow?.submitted_at) {
              toast.info(
                `🎉 ${newRow.client_name} acabou de enviar a configuração do ensaio (Pedido #${newRow.order_number})!`,
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const statuses = useQuery({
    queryKey: ["status-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_options")
        .select("id, label, position")
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, client_name, client_phone, photo_count, package_label, status, priority, due_date, internal_notes, identity_photos_received, public_token, submitted_at, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderRow[];
    },
    refetchInterval: 4000, // Polling contínuo de alta segurança
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("orders")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido excluído com sucesso.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createOrder = useMutation({
    mutationFn: async (values: {
      client_name: string;
      client_phone: string;
      photo_count: number;
      package_label: string;
      due_hours: number;
      priority: string;
    }) => {
      const hours = Math.min(24, Math.max(1, Number(values.due_hours) || 24));
      const targetDate = new Date(Date.now() + hours * 3600 * 1000).toISOString().split("T")[0] ?? null;
      const initialNotes = `[Prazo: ${hours}h]`;

      const { data, error } = await supabase
        .from("orders")
        .insert({
          client_name: values.client_name,
          client_phone: values.client_phone,
          photo_count: values.photo_count,
          package_label: values.package_label || null,
          due_date: targetDate,
          internal_notes: initialNotes,
          priority: values.priority, // "normal", "alta" (Urgente), "baixa"
        })
        .select("id, public_token")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
      await copyLink(data.public_token);
      toast.success("Pedido criado com sucesso — link copiado!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function copyLink(token: string) {
    const url = `${window.location.origin}/ensaio/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const all = orders.data ?? [];
  const alerts = all.filter((o) => o.status !== "Entregue" && needsIdentityPhotos(o));

  // Contadores para as abas inteligentes
  const countAtivos = all.filter((o) => o.status !== "Entregue").length;
  const countAguardandoCliente = all.filter(
    (o) =>
      o.status === "Aguardando cliente montar ensaio" ||
      (!o.submitted_at && o.status !== "Entregue"),
  ).length;
  const countAguardandoFotos = all.filter(
    (o) =>
      o.status !== "Entregue" &&
      (needsIdentityPhotos(o) || o.status === "Aguardando fotos de identidade"),
  ).length;
  const countEmProducao = all.filter(
    (o) =>
      o.status !== "Entregue" &&
      (o.status === "Pronto para produção" || o.status === "Em produção"),
  ).length;
  const countEntregues = all.filter((o) => o.status === "Entregue").length;

  const list = all
    .filter((order) => {
      // Filtro por Aba Superior
      if (tabFilter === "ativos" && order.status === "Entregue") return false;
      if (
        tabFilter === "aguardando_cliente" &&
        order.status !== "Aguardando cliente montar ensaio" &&
        Boolean(order.submitted_at)
      )
        return false;
      if (
        tabFilter === "aguardando_fotos" &&
        !needsIdentityPhotos(order) &&
        order.status !== "Aguardando fotos de identidade"
      )
        return false;
      if (
        tabFilter === "em_producao" &&
        order.status !== "Pronto para produção" &&
        order.status !== "Em produção"
      )
        return false;
      if (tabFilter === "entregues" && order.status !== "Entregue") return false;

      // Filtro por Dropdown específico
      const matchStatus = statusFilter === "todos" || order.status === statusFilter;

      // Filtro de Busca
      const term = search.trim().toLowerCase();
      const termDigits = term.replace(/\D/g, "");
      const phoneDigits = (order.client_phone || "").replace(/\D/g, "");
      const matchSearch =
        !term ||
        order.client_name.toLowerCase().includes(term) ||
        String(order.order_number).includes(term) ||
        (order.package_label && order.package_label.toLowerCase().includes(term)) ||
        (order.client_phone && order.client_phone.toLowerCase().includes(term)) ||
        (Boolean(termDigits) && phoneDigits.includes(termDigits));

      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "prazo") {
        const hoursA = getOrderDueHours(a);
        const hoursB = getOrderDueHours(b);
        const deadlineA = new Date(a.created_at).getTime() + hoursA * 3600 * 1000;
        const deadlineB = new Date(b.created_at).getTime() + hoursB * 3600 * 1000;
        return deadlineA - deadlineB;
      }
      if (sort === "prioridade") {
        const isUrgent = (order: OrderRow) =>
          order.priority === "alta" || order.priority === "urgente" ? 0 : 1;
        return isUrgent(a) - isUrgent(b) || b.created_at.localeCompare(a.created_at);
      }
      return b.created_at.localeCompare(a.created_at);
    });

  const statusLabels = (statuses.data ?? []).map((status) => status.label);

  return (
    <AdminShell
      eyebrow="Painel do estúdio"
      title="Gestão de Pedidos"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-editorial">
              <Plus className="mr-2 size-4" />
              Novo pedido
            </Button>
          </DialogTrigger>
          <NewOrderDialog
            onSubmit={(values) => createOrder.mutate(values)}
            pending={createOrder.isPending}
          />
        </Dialog>
      }
    >
      {/* Alerta Destacado de Fotos Pendentes */}
      {alerts.length > 0 && tabFilter !== "entregues" ? (
        <div className="mb-8 rounded-lg border border-destructive/50 bg-destructive/10 p-5 shadow-editorial">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <p className="eyebrow font-medium text-destructive">
              Aguardando fotos de identidade ({alerts.length})
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Os clientes abaixo já configuraram o ensaio. Aguarde as fotos de rosto/corpo no WhatsApp
            antes de gerar os prompts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((order) => (
              <Button
                key={order.id}
                asChild
                size="sm"
                variant="outline"
                className="border-destructive/40 bg-background/80 hover:bg-destructive/10"
              >
                <Link to="/admin/pedidos/$orderId" params={{ orderId: order.id }}>
                  #{order.order_number} · {order.client_name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Abas Inteligentes de Controle / KPIs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border/80 pb-4">
        <button
          type="button"
          onClick={() => {
            setTabFilter("ativos");
            setStatusFilter("todos");
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            tabFilter === "ativos"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <span>Em Andamento / Ativos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              tabFilter === "ativos"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {countAtivos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabFilter("aguardando_cliente");
            setStatusFilter("todos");
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            tabFilter === "aguardando_cliente"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Clock className="size-3.5" />
          <span>Aguardando Cliente</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              tabFilter === "aguardando_cliente"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {countAguardandoCliente}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabFilter("aguardando_fotos");
            setStatusFilter("todos");
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            tabFilter === "aguardando_fotos"
              ? "bg-destructive text-destructive-foreground shadow-sm"
              : countAguardandoFotos > 0
                ? "font-semibold text-destructive hover:bg-destructive/10"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Camera className="size-3.5" />
          <span>Faltam Fotos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              tabFilter === "aguardando_fotos"
                ? "bg-destructive-foreground/25 text-destructive-foreground"
                : "bg-destructive/15 text-destructive",
            )}
          >
            {countAguardandoFotos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabFilter("em_producao");
            setStatusFilter("todos");
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            tabFilter === "em_producao"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Sparkles className="size-3.5" />
          <span>Em Produção</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              tabFilter === "em_producao"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {countEmProducao}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabFilter("entregues");
            setStatusFilter("todos");
          }}
          className={cn(
            "flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors",
            tabFilter === "entregues"
              ? "bg-emerald-700 text-white shadow-sm dark:bg-emerald-600"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <CheckCircle2 className="size-3.5" />
          <span>Entregues / Concluídos</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              tabFilter === "entregues" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
            )}
          >
            {countEntregues}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabFilter("todos");
            setStatusFilter("todos");
          }}
          className={cn(
            "ml-auto flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors",
            tabFilter === "todos"
              ? "bg-secondary font-semibold text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          <Archive className="size-3.5" />
          <span>Todos ({all.length})</span>
        </button>
      </div>

      {/* Barra de Filtros, Pesquisa e Alternância Tabela/Kanban */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por cliente, nº do pedido ou pacote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status da aba</SelectItem>
            {statusLabels.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex rounded-md border border-border bg-secondary/30 p-1">
          <Button
            size="sm"
            variant={view === "tabela" ? "secondary" : "ghost"}
            onClick={() => setView("tabela")}
          >
            <List className="mr-2 size-4" />
            Tabela
          </Button>
          <Button
            size="sm"
            variant={view === "kanban" ? "secondary" : "ghost"}
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="mr-2 size-4" />
            Kanban
          </Button>
        </div>
      </div>

      {orders.isLoading ? (
        <p className="py-8 text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="font-display text-2xl font-light">
            {tabFilter === "entregues"
              ? "Nenhum pedido entregue ainda"
              : search
                ? "Nenhum pedido encontrado para essa busca"
                : "Nenhum pedido nesta visualização"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tabFilter === "entregues"
              ? "Quando você marcar um ensaio como entregue, ele aparecerá arquivado aqui."
              : "Crie um novo pedido ou selecione outra aba de visualização."}
          </p>
        </div>
      ) : view === "tabela" ? (
        <div className="space-y-4">
          {list.map((order) => (
            <OrderRowCard
              key={order.id}
              order={order}
              statusLabels={statusLabels}
              copied={copied === order.public_token}
              onCopy={() => copyLink(order.public_token)}
              onPatch={(patch) => update.mutate({ id: order.id, patch })}
              onDelete={() => deleteOrder.mutate(order.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto lg:grid-cols-3">
          {statusLabels
            .filter((label) => (tabFilter === "ativos" ? label !== "Entregue" : true))
            .map((label) => {
              const column = list.filter((order) => order.status === label);
              return (
                <div
                  key={label}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragging) {
                      update.mutate({ id: dragging, patch: { status: label } });
                      setDragging(null);
                    }
                  }}
                  className="min-h-48 rounded-lg border border-border bg-secondary/40 p-3"
                >
                  <p className="eyebrow mb-3 flex items-center justify-between">
                    <span>{label}</span>
                    <span className="font-mono text-xs font-semibold">{column.length}</span>
                  </p>
                  <div className="space-y-3">
                    {column.map((order) => {
                      const deadline = getDeadlineInfo(order);
                      const isUrgent = order.priority === "alta" || order.priority === "urgente";
                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={() => setDragging(order.id)}
                          onDragEnd={() => setDragging(null)}
                          className={cn(
                            "group cursor-grab rounded-md border bg-card p-4 shadow-sm transition-all hover:border-foreground/40 active:cursor-grabbing",
                            needsIdentityPhotos(order)
                              ? "border-destructive/60 bg-destructive/5"
                              : "border-border",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="eyebrow">#{order.order_number}</p>
                            <div className="flex items-center gap-1">
                              {order.status !== "Entregue" ? (
                                <button
                                  type="button"
                                  title="Marcar como entregue"
                                  onClick={() => {
                                    update.mutate({ id: order.id, patch: { status: "Entregue" } });
                                    toast.success(`Pedido #${order.order_number} entregue!`);
                                  }}
                                  className="p-1 text-muted-foreground transition-colors hover:text-emerald-600"
                                >
                                  <CheckCircle2 className="size-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <Link
                            to="/admin/pedidos/$orderId"
                            params={{ orderId: order.id }}
                            className="mt-1 block font-display text-xl font-light hover:underline"
                          >
                            {order.client_name}
                          </Link>
                          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {order.photo_count} fotos
                              {order.package_label ? ` · ${order.package_label}` : ""}
                            </span>
                            {order.client_phone ? (
                              <a
                                href={whatsappDirectLink(order.client_phone)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="WhatsApp do cliente"
                                className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline"
                              >
                                <MessageCircle className="size-3" />
                                <span>{formatClientPhone(order.client_phone)}</span>
                              </a>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                                deadline.isOverdue
                                  ? "bg-destructive/15 text-destructive font-semibold"
                                  : "bg-secondary text-muted-foreground",
                              )}
                            >
                              <Clock className="size-3" />
                              {deadline.label}
                            </span>

                            {isUrgent ? (
                              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                Urgente
                              </Badge>
                            ) : null}
                          </div>

                          {needsIdentityPhotos(order) ? (
                            <p className="mt-2 text-xs font-medium text-destructive">
                              Faltam fotos de identidade
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </AdminShell>
  );
}

function OrderRowCard({
  order,
  statusLabels,
  copied,
  onCopy,
  onPatch,
  onDelete,
}: {
  order: OrderRow;
  statusLabels: string[];
  copied: boolean;
  onCopy: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(getCleanNotes(order.internal_notes));
  const [dueHours, setDueHours] = useState(getOrderDueHours(order));
  const [packageLabel, setPackageLabel] = useState(order.package_label ?? "");
  const [phoneInput, setPhoneInput] = useState(order.client_phone ?? "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const alert = order.status !== "Entregue" && needsIdentityPhotos(order);
  const isDelivered = order.status === "Entregue";
  const deadlineInfo = getDeadlineInfo(order);
  const isUrgent = order.priority === "alta" || order.priority === "urgente";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 transition-all shadow-sm",
        alert
          ? "border-destructive/60 bg-destructive/5"
          : isDelivered
            ? "border-emerald-600/30 bg-emerald-500/5 opacity-90"
            : "border-border hover:border-foreground/30",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        {/* Coluna Esquerda: Informações Principais */}
        <div className="min-w-52 flex-1">
          <div className="flex items-center gap-2">
            <p className="eyebrow">Pedido #{order.order_number}</p>
            {isDelivered ? (
              <Badge className="border-emerald-600/30 bg-emerald-600/20 font-medium text-emerald-700 dark:text-emerald-400">
                Concluído / Entregue
              </Badge>
            ) : null}
          </div>
          <Link
            to="/admin/pedidos/$orderId"
            params={{ orderId: order.id }}
            className="mt-1 block font-display text-2xl font-light tracking-tight hover:underline"
          >
            {order.client_name}
          </Link>

          {/* Número de Telefone / WhatsApp e Fotos Contratadas */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {isEditingPhone ? (
              <div className="flex items-center gap-1.5 py-0.5">
                <Input
                  className="h-7 w-48 font-mono text-xs px-2"
                  placeholder="DDD + Número (ex: 37999998888)"
                  value={phoneInput}
                  autoFocus
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onPatch({ client_phone: phoneInput.trim() });
                      setIsEditingPhone(false);
                      toast.success("Telefone atualizado com sucesso!");
                    } else if (e.key === "Escape") {
                      setPhoneInput(order.client_phone ?? "");
                      setIsEditingPhone(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onPatch({ client_phone: phoneInput.trim() });
                    setIsEditingPhone(false);
                    toast.success("Telefone atualizado com sucesso!");
                  }}
                >
                  <Check className="size-3.5 text-emerald-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-1.5 text-xs text-muted-foreground"
                  onClick={() => {
                    setPhoneInput(order.client_phone ?? "");
                    setIsEditingPhone(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : order.client_phone ? (
              <div className="flex items-center gap-1.5 font-medium text-muted-foreground group/phone">
                <a
                  href={whatsappDirectLink(order.client_phone)}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir WhatsApp da cliente"
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="size-3.5" />
                  <span className="font-mono">{formatClientPhone(order.client_phone)}</span>
                </a>
                <button
                  type="button"
                  title="Copiar número"
                  onClick={async () => {
                    await navigator.clipboard.writeText(order.client_phone);
                    toast.success("Número copiado!");
                  }}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  type="button"
                  title="Editar telefone"
                  onClick={() => {
                    setPhoneInput(order.client_phone ?? "");
                    setIsEditingPhone(true);
                  }}
                  className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover/phone:opacity-100 transition-all"
                >
                  <Pencil className="size-3" />
                </button>
                <span className="text-muted-foreground/60">·</span>
                <span>{order.photo_count} fotos contratadas</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput("");
                    setIsEditingPhone(true);
                  }}
                  className="inline-flex items-center gap-1 text-primary/80 hover:text-primary hover:underline transition-colors"
                >
                  <Phone className="size-3" />
                  <span>+ Adicionar WhatsApp</span>
                </button>
                <span className="text-muted-foreground/60">·</span>
                <span>{order.photo_count} fotos contratadas</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                isUrgent ? "destructive" : order.priority === "baixa" ? "outline" : "secondary"
              }
            >
              {isUrgent ? "Urgente" : order.priority === "baixa" ? "Baixa" : "Normal"}
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
              {deadlineInfo.label}
            </span>

            <Badge variant="outline">
              {order.submitted_at ? "Configuração enviada" : "Aguardando cliente"}
            </Badge>
            {alert ? <Badge variant="destructive">Faltam fotos de identidade</Badge> : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pacote contratado</Label>
              <Input
                value={packageLabel}
                placeholder="Ex: Essencial 10 fotos"
                onChange={(event) => setPackageLabel(event.target.value)}
                onBlur={() => {
                  if (packageLabel !== (order.package_label ?? "")) {
                    onPatch({ package_label: packageLabel.trim() || null });
                  }
                }}
              />
            </div>

            {/* Prazo de Entrega em Horas (Máximo 24h) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Prazo de entrega (em horas)
                </Label>
                <span className="text-[11px] font-semibold text-primary">{dueHours}h</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={dueHours}
                  onChange={(e) => {
                    const val = Math.min(24, Math.max(1, Number(e.target.value) || 1));
                    setDueHours(val);
                  }}
                  onBlur={() => {
                    const clean = getCleanNotes(order.internal_notes);
                    const newNotes = formatNotesWithHours(clean, dueHours);
                    const targetDate = new Date(Date.now() + dueHours * 3600 * 1000)
                      .toISOString()
                      .split("T")[0];
                    onPatch({ internal_notes: newNotes, due_date: targetDate });
                  }}
                  className="w-20 font-mono"
                />
                <div className="flex flex-wrap gap-1">
                  {[2, 4, 6, 12, 24].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setDueHours(h);
                        const clean = getCleanNotes(order.internal_notes);
                        const newNotes = formatNotesWithHours(clean, h);
                        const targetDate = new Date(Date.now() + h * 3600 * 1000)
                          .toISOString()
                          .split("T")[0];
                        onPatch({ internal_notes: newNotes, due_date: targetDate });
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-[11px] font-medium transition-colors border",
                        dueHours === h
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                          : "bg-secondary/70 text-muted-foreground border-border hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <Label className="text-xs text-muted-foreground">Notas internas do estúdio</Label>
            <Textarea
              rows={2}
              value={notes}
              placeholder="Combinados, ajustes, notas do cliente..."
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => {
                if (notes !== getCleanNotes(order.internal_notes)) {
                  const fullNotes = formatNotesWithHours(notes, dueHours);
                  onPatch({ internal_notes: fullNotes });
                }
              }}
            />
          </div>
        </div>

        {/* Coluna Central: Status e Controles Operacionais */}
        <div className="w-56 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status de produção</Label>
            <Select value={order.status} onValueChange={(value) => onPatch({ status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusLabels.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prioridade</Label>
            <Select
              value={order.priority === "urgente" ? "alta" : order.priority}
              onValueChange={(value) => onPatch({ priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Urgente</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center justify-between gap-3 pt-2 text-sm">
            <span className="text-xs text-muted-foreground">Fotos de identidade</span>
            <Switch
              checked={order.identity_photos_received}
              onCheckedChange={(checked) => {
                const patch: Record<string, unknown> = { identity_photos_received: checked };
                if (checked && order.status === "Aguardando fotos de identidade") {
                  patch["status"] = "Pronto para produção";
                }
                onPatch(patch);
              }}
            />
          </label>
        </div>

        {/* Coluna Direita: Ações Rápidas, Concluir e Exclusão */}
        <div className="flex min-w-44 flex-col justify-between gap-2 self-stretch">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onCopy} className="justify-start">
              {copied ? (
                <Check className="mr-2 size-4 text-emerald-600" />
              ) : (
                <Copy className="mr-2 size-4" />
              )}
              {copied ? "Link copiado!" : "Copiar link"}
            </Button>

            <Button asChild variant="outline" size="sm" className="justify-start">
              <a
                href={whatsappLink(
                  order.client_phone,
                  order.submitted_at
                    ? identityPhotosMessage({
                        clientName: order.client_name,
                        orderNumber: order.order_number,
                      })
                    : configuratorLinkMessage({
                        clientName: order.client_name,
                        orderNumber: order.order_number,
                        link: `${window.location.origin}/ensaio/${order.public_token}`,
                      }),
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 size-4" />
                {order.submitted_at ? "Pedir fotos" : "Enviar link"}
              </a>
            </Button>

            <Button asChild size="sm" variant="ghost" className="justify-start">
              <Link to="/admin/pedidos/$orderId" params={{ orderId: order.id }}>
                Ver briefing
              </Link>
            </Button>

            {/* Ação de Marcar como Feito / Entregue */}
            {!isDelivered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onPatch({ status: "Entregue" });
                  toast.success(
                    `Pedido #${order.order_number} de ${order.client_name} marcado como entregue!`,
                  );
                }}
                className="justify-start border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              >
                <CheckCircle2 className="mr-2 size-4" />
                Marcar como entregue
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onPatch({ status: "Em produção" });
                  toast.success(`Pedido #${order.order_number} reaberto.`);
                }}
                className="justify-start text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-2 size-4" />
                Reabrir pedido
              </Button>
            )}
          </div>

          {/* Opção para Excluir o Pedido (Canto Inferior Direito) */}
          <div className="flex justify-end pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Excluir pedido
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-2xl font-light">
                    Excluir pedido #{order.order_number}?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm leading-relaxed">
                    Tem certeza que deseja excluir o pedido de <strong>{order.client_name}</strong>?
                    Esta ação apagará permanentemente o link do configurador, as escolhas do cliente
                    e todas as notas do estúdio.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewOrderDialog({
  onSubmit,
  pending,
}: {
  onSubmit: (values: {
    client_name: string;
    client_phone: string;
    photo_count: number;
    package_label: string;
    due_hours: number;
    priority: string;
  }) => void;
  pending: boolean;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [photoCount, setPhotoCount] = useState("10");
  const [packageLabel, setPackageLabel] = useState("");
  const [dueHours, setDueHours] = useState(24);
  const [priority, setPriority] = useState("normal");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl font-light">Novo pedido</DialogTitle>
      </DialogHeader>
      <form
        id="new-order"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            client_name: clientName.trim(),
            client_phone: clientPhone.trim(),
            photo_count: Number(photoCount) || 1,
            package_label: packageLabel.trim(),
            due_hours: dueHours,
            priority,
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="client_name">Nome da cliente</Label>
          <Input
            id="client_name"
            required
            placeholder="Ex: Mariana Silva"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_phone">WhatsApp (com DDD)</Label>
            <Input
              id="client_phone"
              placeholder="37999998888"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo_count">Quantidade de fotos</Label>
            <Input
              id="photo_count"
              type="number"
              min={1}
              max={100}
              value={photoCount}
              onChange={(e) => setPhotoCount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="package_label">Nome do Pacote</Label>
            <Input
              id="package_label"
              placeholder="Ex: Aniversário 10 fotos"
              value={packageLabel}
              onChange={(e) => setPackageLabel(e.target.value)}
            />
          </div>

          {/* Prazo de Entrega em Horas (Máximo 24h) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="due_hours">Prazo de entrega (horas)</Label>
              <span className="text-xs font-semibold text-primary">Máx: 24h</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="due_hours"
                  type="number"
                  min={1}
                  max={24}
                  required
                  value={dueHours}
                  onChange={(e) => {
                    const val = Math.min(24, Math.max(1, Number(e.target.value) || 1));
                    setDueHours(val);
                  }}
                  className="font-mono text-center"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">horas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[2, 4, 6, 12, 24].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDueHours(h)}
                    className={cn(
                      "flex-1 rounded border px-2 py-1 text-xs font-medium transition-colors text-center",
                      dueHours === h
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                        : "bg-secondary/70 text-muted-foreground border-border hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prioridade: "normal", "alta" (Urgente), "baixa" */}
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta">Urgente</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>
      <DialogFooter>
        <Button type="submit" form="new-order" disabled={pending}>
          {pending ? "Criando..." : "Criar e copiar link"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}


