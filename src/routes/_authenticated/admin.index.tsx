import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, Plus } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

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

function useStatusOptions() {
  return useQuery({
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
}

function OrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const statuses = useStatusOptions();

  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, client_name, client_phone, photo_count, package_label, status, priority, due_date, identity_photos_received, public_token, submitted_at, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

  const list = (orders.data ?? []).filter((order) => {
    const matchStatus = statusFilter === "todos" || order.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchSearch =
      !term ||
      order.client_name.toLowerCase().includes(term) ||
      String(order.order_number).includes(term);
    return matchStatus && matchSearch;
  });

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
            {(statuses.data ?? []).map((status) => (
              <SelectItem key={status.id} value={status.label}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : (
        <div className="space-y-3">
          {list.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25"
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
                    {order.package_label ? ` · ${order.package_label}` : ""}
                    {order.due_date
                      ? ` · entrega ${new Date(order.due_date).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{order.priority}</Badge>
                    {order.submitted_at ? (
                      <Badge variant="outline">Configuração enviada</Badge>
                    ) : (
                      <Badge variant="outline">Aguardando cliente</Badge>
                    )}
                  </div>
                </div>

                <div className="w-56 space-y-3">
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      update.mutate({ id: order.id, patch: { status: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(statuses.data ?? []).map((status) => (
                        <SelectItem key={status.id} value={status.label}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Fotos de identidade</span>
                    <Switch
                      checked={order.identity_photos_received}
                      onCheckedChange={(checked) =>
                        update.mutate({
                          id: order.id,
                          patch: { identity_photos_received: checked },
                        })
                      }
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyLink(order.public_token)}>
                    {copied === order.public_token ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Copy className="mr-2 size-4" />
                    )}
                    Copiar link
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/admin/pedidos/$orderId" params={{ orderId: order.id }}>
                      Ver briefing
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
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
