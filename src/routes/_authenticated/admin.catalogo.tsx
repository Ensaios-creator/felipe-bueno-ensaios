import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CopyPlus, ImageIcon, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/ensaio-options";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo visual — Configurador de Ensaios" },
      {
        name: "description",
        content: "Gerencie looks, cenários, luzes e poses disponíveis para os ensaios.",
      },
      { property: "og:title", content: "Catálogo visual — Configurador de Ensaios" },
      {
        property: "og:description",
        content: "Gerencie looks, cenários, luzes e poses disponíveis para os ensaios.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatalogPage,
});

type CatalogRow = {
  id: string;
  code: string;
  category: string;
  name: string;
  image_url: string | null;
  color: string | null;
  style: string | null;
  tags: string[];
  ai_description: string;
  position: number;
  active: boolean;
};

const EMPTY = {
  id: "",
  code: "",
  category: "look" as Category,
  name: "",
  image_url: null as string | null,
  color: "",
  style: "",
  tags: [] as string[],
  ai_description: "",
  position: 0,
  active: true,
};

function useSignedUrls(paths: (string | null)[]) {
  const key = paths.filter(Boolean).sort().join("|");
  return useQuery({
    queryKey: ["signed-urls", key],
    enabled: key.length > 0,
    queryFn: async () => {
      const storagePaths = Array.from(
        new Set(paths.filter((p): p is string => Boolean(p) && !p!.startsWith("http"))),
      );
      if (storagePaths.length === 0) return {} as Record<string, string>;
      const { data } = await supabase.storage
        .from("catalog")
        .createSignedUrls(storagePaths, 60 * 60 * 6);
      const map: Record<string, string> = {};
      (data ?? []).forEach((entry, index) => {
        const original = storagePaths[index];
        if (original && entry.signedUrl) map[original] = entry.signedUrl;
      });
      return map;
    },
  });
}

function CatalogPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Category>("look");
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("todos");
  const [colorFilter, setColorFilter] = useState("todas");
  const [selected, setSelected] = useState<string[]>([]);

  const items = useQuery({
    queryKey: ["catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_items")
        .select(
          "id, code, category, name, image_url, color, style, tags, ai_description, position, active",
        )
        .order("category")
        .order("position");
      if (error) throw error;
      return data as CatalogRow[];
    },
  });

  const urls = useSignedUrls((items.data ?? []).map((i) => i.image_url));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["catalog"] });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("catalog_items").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const bulkActive = useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const { error } = await supabase.from("catalog_items").update({ active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: async () => {
      setSelected([]);
      await refresh();
      toast.success("Itens atualizados.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicate = useMutation({
    mutationFn: async (item: CatalogRow) => {
      const { error } = await supabase.from("catalog_items").insert({
        code: `${item.code}-COPIA`,
        category: item.category,
        name: `${item.name} (cópia)`,
        image_url: item.image_url,
        color: item.color,
        style: item.style,
        tags: item.tags,
        ai_description: item.ai_description,
        position: item.position + 1,
        active: false,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("Item duplicado — está oculto até você revisar.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reorder = useMutation({
    mutationFn: async (rows: CatalogRow[]) => {
      for (const [index, row] of rows.entries()) {
        const { error } = await supabase
          .from("catalog_items")
          .update({ position: index })
          .eq("id", row.id);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });

  const inCategory = (items.data ?? []).filter((item) => item.category === tab);
  const styles = Array.from(new Set(inCategory.map((i) => i.style).filter(Boolean))) as string[];
  const colors = Array.from(new Set(inCategory.map((i) => i.color).filter(Boolean))) as string[];

  const term = search.trim().toLowerCase();
  const filtered = inCategory.filter((item) => {
    const matchStyle = styleFilter === "todos" || item.style === styleFilter;
    const matchColor = colorFilter === "todas" || item.color === colorFilter;
    const matchSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      item.tags.some((tag) => tag.toLowerCase().includes(term));
    return matchStyle && matchColor && matchSearch;
  });

  function move(index: number, direction: -1 | 1) {
    const rows = [...inCategory];
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
      title="Catálogo visual"
      action={
        <Button onClick={() => setEditing({ ...EMPTY, category: tab })}>
          <Plus className="mr-2 size-4" />
          Novo item
        </Button>
      }
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Category);
          setSelected([]);
          setStyleFilter("todos");
          setColorFilter("todas");
        }}
      >
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome, código ou tag"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <Select value={styleFilter} onValueChange={setStyleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estilos</SelectItem>
            {styles.map((style) => (
              <SelectItem key={style} value={style}>
                {style}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={colorFilter} onValueChange={setColorFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as cores</SelectItem>
            {colors.map((color) => (
              <SelectItem key={color} value={color}>
                {color}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} selecionados</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkActive.mutate({ ids: selected, active: true })}
            >
              Ativar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkActive.mutate({ ids: selected, active: false })}
            >
              Desativar
            </Button>
          </div>
        ) : null}
      </div>

      {items.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando catálogo...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl font-light">Nada nesta categoria ainda</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const src = item.image_url?.startsWith("http")
              ? item.image_url
              : (urls.data?.[item.image_url ?? ""] ?? null);
            const categoryIndex = inCategory.findIndex((row) => row.id === item.id);
            const checked = selected.includes(item.id);
            return (
              <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative flex aspect-[4/5] items-center justify-center bg-muted">
                  {src ? (
                    <img
                      src={src}
                      alt={item.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-8 text-muted-foreground" />
                  )}
                  <label className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-md border border-border bg-background/90">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        setSelected((current) =>
                          value ? [...current, item.id] : current.filter((id) => id !== item.id),
                        )
                      }
                      aria-label={`Selecionar ${item.name}`}
                    />
                  </label>
                  <div className="absolute right-3 top-3 flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7"
                      onClick={() => move(categoryIndex, -1)}
                      aria-label="Subir item"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7"
                      onClick={() => move(categoryIndex, 1)}
                      aria-label="Descer item"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="eyebrow">{item.code}</p>
                    <p className="font-display text-xl font-light">{item.name}</p>
                  </div>
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {item.ai_description || "Sem descrição para a IA."}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[0.65rem]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={item.active}
                        onCheckedChange={(value) =>
                          toggleActive.mutate({ id: item.id, active: value })
                        }
                      />
                      {item.active ? "Visível" : "Oculto"}
                    </label>
                    <div className="flex items-center">
                      <Button variant="ghost" size="sm" onClick={() => duplicate.mutate(item)}>
                        <CopyPlus className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                        <Pencil className="mr-2 size-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ItemDialog item={editing} onClose={() => setEditing(null)} />
    </AdminShell>
  );
}

function ItemDialog({ item, onClose }: { item: CatalogRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        ...EMPTY,
        ...item,
        category: item.category as Category,
        color: item.color ?? "",
        style: item.style ?? "",
      });
      setFile(null);
    }
  }, [item]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      let imagePath = form.image_url;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${form.category}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("catalog").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        imagePath = path;
      }

      const payload = {
        code: form.code.trim(),
        category: form.category,
        name: form.name.trim(),
        image_url: imagePath,
        color: form.color.trim() || null,
        style: form.style.trim() || null,
        tags: form.tags,
        ai_description: form.ai_description.trim(),
        position: Number(form.position) || 0,
        active: form.active,
      };

      const { error } = form.id
        ? await supabase.from("catalog_items").update(payload).eq("id", form.id)
        : await supabase.from("catalog_items").insert(payload);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Item salvo.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light">
            {form.id ? "Editar item" : "Novo item"}
          </DialogTitle>
        </DialogHeader>
        <form id="catalog-item" className="space-y-4" onSubmit={save}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                required
                placeholder="LK-01"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value as Category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome visível para a cliente</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_description">Descrição para a IA (em inglês, sem físico)</Label>
            <Textarea
              id="ai_description"
              rows={5}
              value={form.ai_description}
              onChange={(e) => setForm({ ...form, ai_description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Descreva apenas roupa, cenário, luz ou ação. Nunca descreva o corpo ou o rosto.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Estilo</Label>
              <Input
                id="style"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Ordem</Label>
              <Input
                id="position"
                type="number"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Imagem de referência</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {form.image_url ? (
              <p className="text-xs text-muted-foreground">Arquivo atual: {form.image_url}</p>
            ) : null}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm({ ...form, active: checked })}
            />
            Visível para as clientes
          </label>
        </form>
        <DialogFooter>
          <Button type="submit" form="catalog-item" disabled={saving}>
            {saving ? "Salvando..." : "Salvar item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
