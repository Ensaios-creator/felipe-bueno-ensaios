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
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
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
import { configuratorLinkMessage, identityPhotosMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Pedidos — Configurador de Ensaios" },
      { name: "description", content: "Painel de pedidos de ensaios fotográficos do estúdio." },
      { property: "og:title", content: "Pedidos — Configurador de Ensaios" },
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
  { value: "prazo", label: "Prazo mais próximo" },
  { value: "prioridade", label: "Prioridade" },
] as const;

type TabFilter = "ativos" | "aguardando_cliente" | "aguardando_fotos" | "em_producao" | "entregues" | "todos";

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
    refetchInterval: 4000, // Polling de alta segurança a cada 4s para sincronização contínua
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
      due_date: string;
      priority: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          client_name: values.client_name,
          client_phone: values.client_phone,
          photo_count: values.photo_count,
          package_label: values.package_label || null,
          due_date: values.due_date || null,
          priority: values.priority,
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
      toast.success("Pedido criado — link copiado.");
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

  // Contadores para as abas inteligentes de status
  const countAtivos = all.filter((o) => o.status !== "Entregue").length;
  const countAguardandoCliente = all.filter(
    (o) => o.status === "Aguardando cliente montar ensaio" || (!o.submitted_at && o.status !== "Entregue"),
  ).length;
  const countAguardandoFotos = all.filter(
    (o) => o.status !== "Entregue" && (needsIdentityPhotos(o) || o.status === "Aguardando fotos de identidade"),
  ).length;
  const countEmProducao = all.filter(
    (o) => o.status !== "Entregue" && (o.status === "Pronto para produção" || o.status === "Em produção"),
  ).length;
  const countEntregues = all.filter((o) => o.status === "Entregue").length;

  const list = all
    .filter((order) => {
      // Filtro por Aba Superior
      if (tabFilter === "ativos" && order.status === "Entregue") return false;
      if (tabFilter === "aguardando_cliente" && (order.status !== "Aguardando cliente montar ensaio" && Boolean(order.submitted_at))) return false;
      if (tabFilter === "aguardando_fotos" && (!needsIdentityPhotos(order) && order.status !== "Aguardando fotos de identidade")) return false;
      if (tabFilter === "em_producao" && order.status !== "Pronto para produção" && order.status !== "Em produção") return false;
      if (tabFilter === "entregues" && order.status !== "Entregue") return false;

      // Filtro por Dropdown específico
      const matchStatus = statusFilter === "todos" || order.status === statusFilter;

      // Filtro de Busca
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        order.client_name.toLowerCase().includes(term) ||
        String(order.order_number).includes(term) ||
        (order.package_label && order.package_label.toLowerCase().includes(term));

      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "prazo") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (sort === "prioridade") {
        const rank = (order: OrderRow) => (order.priority === "urgente" ? 0 : 1);
        return rank(a) - rank(b) || b.created_at.localeCompare(a.created_at);
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
            <p className="eyebrow font-medium text-destructive">Aguardando fotos de identidade ({alerts.length})</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Os clientes abaixo já configuraram o ensaio. Aguarde as fotos de rosto/corpo no WhatsApp antes de gerar os prompts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((order) => (
              <Button key={order.id} asChild size="sm" variant="outline" className="border-destructive/40 bg-background/80 hover:bg-destructive/10">
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
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tabFilter === "ativos" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tabFilter === "aguardando_cliente" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
                ? "text-destructive hover:bg-destructive/10 font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <Camera className="size-3.5" />
          <span>Faltam Fotos</span>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tabFilter === "aguardando_fotos" ? "bg-destructive-foreground/25 text-destructive-foreground" : "bg-destructive/15 text-destructive")}>
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
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tabFilter === "em_producao" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tabFilter === "entregues" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground")}>
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
              ? "bg-secondary text-foreground font-semibold"
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
          <SelectTrigger className="w-48">
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

        <div className="ml-auto flex rounded-md border border-border p-1 bg-secondary/30">
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
        <p className="text-sm text-muted-foreground py-8">Carregando pedidos...</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center bg-card/40">
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
                    {column.map((order) => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={() => setDragging(order.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          "group cursor-grab rounded-md border bg-card p-4 shadow-sm transition-all active:cursor-grabbing hover:border-foreground/40",
                          needsIdentityPhotos(order) ? "border-destructive/60 bg-destructive/5" : "border-border",
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
                                className="text-muted-foreground transition-colors hover:text-emerald-600 p-1"
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.photo_count} fotos
                          {order.package_label ? ` · ${order.package_label}` : ""}
                          {order.due_date
                            ? ` · entrega ${new Date(order.due_date).toLocaleDateString("pt-BR")}`
                            : ""}
                        </p>
                        {order.priority === "urgente" ? (
                          <Badge variant="destructive" className="mt-3">
                            Urgente
                          </Badge>
                        ) : null}
                        {needsIdentityPhotos(order) ? (
                          <p className="mt-2 text-xs font-medium text-destructive">Faltam fotos de identidade</p>
                        ) : null}
                      </div>
                    ))}
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
  const [notes, setNotes] = useState(order.internal_notes);
  const [packageLabel, setPackageLabel] = useState(order.package_label ?? "");
  const alert = order.status !== "Entregue" && needsIdentityPhotos(order);
  const isDelivered = order.status === "Entregue";

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
              <Badge className="bg-emerald-600/20 text-emerald-700 border-emerald-600/30 dark:text-emerald-400 font-medium">
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
          <p className="mt-1 text-sm text-muted-foreground">
            {order.photo_count} fotos
            {order.due_date
              ? ` · entrega até ${new Date(order.due_date).toLocaleDateString("pt-BR")}`
              : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={order.priority === "urgente" ? "destructive" : "secondary"}>
              {order.priority}
            </Badge>
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
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prazo de entrega</Label>
              <Input
                type="date"
                value={order.due_date ?? ""}
                onChange={(event) => onPatch({ due_date: event.target.value || null })}
              />
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
                if (notes !== order.internal_notes) onPatch({ internal_notes: notes });
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
            <Select value={order.priority} onValueChange={(value) => onPatch({ priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center justify-between gap-3 pt-2 text-sm">
            <span className="text-muted-foreground text-xs">Fotos de identidade</span>
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

        {/* Coluna Direita: Ações Rápidas, Concluir e Exclusão no Canto Inferior Direito */}
        <div className="flex flex-col gap-2 min-w-44 self-stretch justify-between">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onCopy} className="justify-start">
              {copied ? <Check className="mr-2 size-4 text-emerald-600" /> : <Copy className="mr-2 size-4" />}
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

            {/* Ação de Marcar como Feito / Entregue (Arquiva o pedido da lista ativa) */}
            {!isDelivered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onPatch({ status: "Entregue" });
                  toast.success(`Pedido #${order.order_number} de ${order.client_name} marcado como entregue!`);
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

          {/* Opção para Excluir o Pedido (Local Exato Sinalizado no Print) */}
          <div className="pt-2 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive w-full justify-center transition-colors"
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
                    Esta ação apagará permanentemente o link do configurador, as escolhas do cliente e todas as notas do estúdio.
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
    due_date: string;
    priority: string;
  }) => void;
  pending: boolean;
}) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [photoCount, setPhotoCount] = useState("10");
  const [packageLabel, setPackageLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
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
            due_date: dueDate,
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
          <div className="space-y-2">
            <Label htmlFor="due_date">Prazo de entrega</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
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

