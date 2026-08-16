import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Copy,
  LayoutGrid,
  List,
  MessageCircle,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
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
  identityPhotosMessage,
  whatsappLink,
} from "@/lib/whatsapp";

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

function needsIdentityPhotos(order: OrderRow) {
  return Boolean(order.submitted_at) && !order.identity_photos_received;
}

function OrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sort, setSort] = useState<string>("recentes");
  const [view, setView] = useState<"tabela" | "kanban">("tabela");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

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
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
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
  const alerts = all.filter(needsIdentityPhotos);

  const list = all
    .filter((order) => {
      const matchStatus = statusFilter === "todos" || order.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        order.client_name.toLowerCase().includes(term) ||
        String(order.order_number).includes(term);
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
      title="Pedidos"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
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
      {alerts.length > 0 ? (
        <div className="mb-8 rounded-lg border border-destructive/50 bg-destructive/10 p-5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            <p className="eyebrow text-destructive">Aguardando fotos de identidade</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Não gere os prompts destes ensaios antes de receber as fotos pelo WhatsApp.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {alerts.map((order) => (
              <Button key={order.id} asChild size="sm" variant="outline">
                <Link to="/admin/pedidos/$orderId" params={{ orderId: order.id }}>
                  #{order.order_number} · {order.client_name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome ou número"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
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
        <div className="ml-auto flex rounded-md border border-border p-1">
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
        <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl font-light">Nenhum pedido por aqui</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie o primeiro pedido e envie o link de configuração para a cliente.
          </p>
        </div>
      ) : view === "tabela" ? (
        <div className="space-y-3">
          {list.map((order) => (
            <OrderRowCard
              key={order.id}
              order={order}
              statusLabels={statusLabels}
              copied={copied === order.public_token}
              onCopy={() => copyLink(order.public_token)}
              onPatch={(patch) => update.mutate({ id: order.id, patch })}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto lg:grid-cols-3">
          {statusLabels.map((label) => {
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
                className="min-h-40 rounded-lg border border-border bg-secondary/40 p-3"
              >
                <p className="eyebrow mb-3">
                  {label} · {column.length}
                </p>
                <div className="space-y-3">
                  {column.map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => setDragging(order.id)}
                      onDragEnd={() => setDragging(null)}
                      className={cn(
                        "cursor-grab rounded-md border bg-card p-4 active:cursor-grabbing",
                        needsIdentityPhotos(order)
                          ? "border-destructive/60"
                          : "border-border",
                      )}
                    >
                      <p className="eyebrow">#{order.order_number}</p>
                      <Link
                        to="/admin/pedidos/$orderId"
                        params={{ orderId: order.id }}
                        className="font-display text-xl font-light hover:underline"
                      >
                        {order.client_name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.photo_count} fotos
                        {order.due_date
                          ? ` · ${new Date(order.due_date).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                      {order.priority === "urgente" ? (
                        <Badge variant="destructive" className="mt-3">
                          Urgente
                        </Badge>
                      ) : null}
                      {needsIdentityPhotos(order) ? (
                        <p className="mt-3 text-xs text-destructive">
                          Sem fotos de identidade
                        </p>
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
}: {
  order: OrderRow;
  statusLabels: string[];
  copied: boolean;
  onCopy: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const [notes, setNotes] = useState(order.internal_notes);
  const [packageLabel, setPackageLabel] = useState(order.package_label ?? "");
  const alert = needsIdentityPhotos(order);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-5 transition-colors",
        alert ? "border-destructive/60 bg-destructive/5" : "border-border hover:border-foreground/25",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="min-w-52 flex-1">
          <p className="eyebrow">Pedido #{order.order_number}</p>
          <Link
            to="/admin/pedidos/$orderId"
            params={{ orderId: order.id }}
            className="font-display text-2xl font-light tracking-tight hover:underline"
          >
            {order.client_name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.photo_count} fotos
            {order.due_date
              ? ` · entrega ${new Date(order.due_date).toLocaleDateString("pt-BR")}`
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
              <Label className="text-xs text-muted-foreground">Pacote</Label>
              <Input
                value={packageLabel}
                placeholder="Ex: Essencial 10"
                onChange={(event) => setPackageLabel(event.target.value)}
                onBlur={() => {
                  if (packageLabel !== (order.package_label ?? "")) {
                    onPatch({ package_label: packageLabel.trim() || null });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prazo</Label>
              <Input
                type="date"
                value={order.due_date ?? ""}
                onChange={(event) => onPatch({ due_date: event.target.value || null })}
              />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <Label className="text-xs text-muted-foreground">Notas internas</Label>
            <Textarea
              rows={2}
              value={notes}
              placeholder="Combinados, ajustes, lembretes."
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => {
                if (notes !== order.internal_notes) onPatch({ internal_notes: notes });
              }}
            />
          </div>
        </div>

        <div className="w-56 space-y-3">
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

          <Select value={order.priority} onValueChange={(value) => onPatch({ priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Fotos de identidade</span>
            <Switch
              checked={order.identity_photos_received}
              onCheckedChange={(checked) => onPatch({ identity_photos_received: checked })}
            />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
            Copiar link
          </Button>
          <Button asChild variant="outline" size="sm">
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
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/pedidos/$orderId" params={{ orderId: order.id }}>
              Ver briefing
            </Link>
          </Button>
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
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_phone">WhatsApp</Label>
            <Input
              id="client_phone"
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
            <Label htmlFor="package_label">Pacote</Label>
            <Input
              id="package_label"
              placeholder="Ex: Essencial 10"
              value={packageLabel}
              onChange={(e) => setPackageLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Prazo</Label>
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
