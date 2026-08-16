import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/status")({
  head: () => ({
    meta: [
      { title: "Status de produção — Configurador de Ensaios" },
      {
        name: "description",
        content: "Configure as etapas da fila de produção do estúdio.",
      },
      { property: "og:title", content: "Status de produção" },
      {
        property: "og:description",
        content: "Configure as etapas da fila de produção do estúdio.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StatusPage,
});

type StatusRow = { id: string; label: string; position: number };

function StatusPage() {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");

  const statuses = useQuery({
    queryKey: ["status-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_options")
        .select("id, label, position")
        .order("position");
      if (error) throw error;
      return data as StatusRow[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["status-options"] });

  const create = useMutation({
    mutationFn: async (label: string) => {
      const position = (statuses.data ?? []).length;
      const { error } = await supabase
        .from("order_status_options")
        .insert({ label, position });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewLabel("");
      await refresh();
      toast.success("Status adicionado.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rename = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase.from("order_status_options").update({ label }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const reorder = useMutation({
    mutationFn: async (rows: StatusRow[]) => {
      for (const [index, row] of rows.entries()) {
        const { error } = await supabase
          .from("order_status_options")
          .update({ position: index })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("order_status_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Status removido.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function move(index: number, direction: -1 | 1) {
    const rows = [...(statuses.data ?? [])];
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const current = rows[index]!;
    rows[index] = rows[target]!;
    rows[target] = current;
    reorder.mutate(rows);
  }

  return (
    <AdminShell
      eyebrow="Painel do estúdio"
      title="Status de produção"
    >
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">
        A ordem definida aqui é a ordem das colunas no Kanban de pedidos.
      </p>

      <div className="max-w-2xl space-y-3">
        {(statuses.data ?? []).map((status, index) => (
          <div
            key={status.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <Input
              defaultValue={status.label}
              onBlur={(event) => {
                const label = event.target.value.trim();
                if (label && label !== status.label) rename.mutate({ id: status.id, label });
              }}
            />
            <Button variant="ghost" size="icon" onClick={() => move(index, -1)}>
              <ArrowUp className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(index, 1)}>
              <ArrowDown className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove.mutate(status.id)}
              aria-label={`Remover ${status.label}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <form
          className="flex items-center gap-3 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const label = newLabel.trim();
            if (label) create.mutate(label);
          }}
        >
          <Input
            placeholder="Novo status"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
          />
          <Button type="submit" disabled={create.isPending}>
            <Plus className="mr-2 size-4" />
            Adicionar
          </Button>
        </form>
      </div>
    </AdminShell>
  );
}
