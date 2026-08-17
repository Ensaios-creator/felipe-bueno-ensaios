import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Filter,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { supabase } from "@/integrations/supabase/client";
import { SESSION_TYPES } from "@/lib/ensaio-options";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  head: () => ({
    meta: [
      { title: "Banco de Imagens de Referência — Painel do Estúdio" },
      {
        name: "description",
        content: "Gerencie as imagens de referência de ensaios completos para seus clientes.",
      },
      { property: "og:title", content: "Banco de Imagens de Referência" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatalogPage,
});

type CatalogRow = {
  id: string;
  image_url: string | null;
  session_types: string[];
  people_count: number | null;
  gender: string | null;
  ambiance: string | null;
  style: string | null;
  vibe: string | null;
  has_cake: boolean;
  has_age_number: boolean;
  tags: string[];
  position: number;
  active: boolean;
};

const EMPTY_FORM: CatalogRow = {
  id: "",
  image_url: null,
  session_types: ["estudio"],
  people_count: 1,
  gender: "feminino",
  ambiance: "estudio",
  style: "editorial",
  vibe: "elegante",
  has_cake: false,
  has_age_number: false,
  tags: [],
  position: 0,
  active: true,
};

const GENDER_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "misto", label: "Misto / Casal / Grupo" },
];

const AMBIANCE_OPTIONS = [
  { value: "estudio", label: "Estúdio / Fundo liso" },
  { value: "interno", label: "Ambiente interno / Casa" },
  { value: "externo", label: "Externo / Cidade / Rua" },
  { value: "natureza", label: "Natureza / Praia / Campo" },
];

const STYLE_OPTIONS = [
  { value: "editorial", label: "Editorial / Moda" },
  { value: "classico", label: "Clássico / Retrato" },
  { value: "moderno", label: "Moderno / Minimalista" },
  { value: "romantico", label: "Romântico / Delicado" },
  { value: "sensual", label: "Sensual / Intimista" },
  { value: "corporativo", label: "Corporativo / Profissional" },
];

const VIBE_OPTIONS = [
  { value: "elegante", label: "Elegante & Sofisticado" },
  { value: "alegre", label: "Alegre & Festa" },
  { value: "delicado", label: "Delicado & Suave" },
  { value: "poderoso", label: "Marcante & Poderoso" },
  { value: "descontraido", label: "Descontraído & Leve" },
];

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
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [peopleFilter, setPeopleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [genderFilter, setGenderFilter] = useState("todos");
  const [selected, setSelected] = useState<string[]>([]);

  const items = useQuery({
    queryKey: ["catalog-references"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_items")
        .select(
          "id, image_url, session_types, people_count, gender, ambiance, style, vibe, has_cake, has_age_number, tags, position, active",
        )
        .order("position");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        image_url: row.image_url,
        session_types: (row.session_types ?? []) as string[],
        people_count: row.people_count ?? null,
        gender: row.gender ?? null,
        ambiance: row.ambiance ?? null,
        style: row.style ?? null,
        vibe: row.vibe ?? null,
        has_cake: Boolean(row.has_cake),
        has_age_number: Boolean(row.has_age_number),
        tags: (row.tags ?? []) as string[],
        position: row.position ?? 0,
        active: row.active ?? true,
      })) as CatalogRow[];
    },
  });

  const urls = useSignedUrls((items.data ?? []).map((i) => i.image_url));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["catalog-references"] });

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
      toast.success("Imagens atualizadas com sucesso.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setDeletingId(null);
      await refresh();
      toast.success("Imagem de referência excluída.");
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

  const allRows = items.data ?? [];
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return allRows.filter((item) => {
      const matchType =
        typeFilter === "todos" ||
        item.session_types.length === 0 ||
        item.session_types.includes(typeFilter);

      const matchPeople =
        peopleFilter === "todos" ||
        (peopleFilter === "3+"
          ? (item.people_count ?? 1) >= 3
          : item.people_count === Number(peopleFilter));

      const matchGender = genderFilter === "todos" || item.gender === genderFilter;

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativo" && item.active) ||
        (statusFilter === "oculto" && !item.active);

      const matchSearch =
        !term ||
        item.style?.toLowerCase().includes(term) ||
        item.vibe?.toLowerCase().includes(term) ||
        item.ambiance?.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term));

      return matchType && matchPeople && matchGender && matchStatus && matchSearch;
    });
  }, [allRows, typeFilter, peopleFilter, genderFilter, statusFilter, term]);

  function move(index: number, direction: -1 | 1) {
    const rows = [...allRows];
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const current = rows[index]!;
    rows[index] = rows[target]!;
    rows[target] = current;
    reorder.mutate(rows);
  }

  const activeCount = allRows.filter((i) => i.active).length;

  return (
    <AdminShell
      eyebrow="Painel do estúdio"
      title="Banco de Referências"
      action={
        <Button
          onClick={() =>
            setEditing({
              ...EMPTY_FORM,
              position: allRows.length,
            })
          }
          className="gap-2"
        >
          <Plus className="size-4" />
          Nova referência
        </Button>
      }
    >
      {/* ── Subtitle e Status Bar ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <p className="text-sm text-muted-foreground">
          Fotos completas de ensaios prontos. Os clientes escolhem essas imagens como referência
          para o ensaio deles.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-normal">
            Total: <strong>{allRows.length}</strong> fotos
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-normal">
            <strong>{activeCount}</strong> ativas
          </Badge>
        </div>
      </div>

      {/* ── Filtros e Busca ─────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por estilo, vibe ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de ensaio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos de ensaio</SelectItem>
              {SESSION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={peopleFilter} onValueChange={setPeopleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pessoas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Pessoas: todas</SelectItem>
              <SelectItem value="1">1 pessoa</SelectItem>
              <SelectItem value="2">2 pessoas</SelectItem>
              <SelectItem value="3+">3 ou mais</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Gênero: todos</SelectItem>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Status: todos</SelectItem>
              <SelectItem value="ativo">Visíveis</SelectItem>
              <SelectItem value="oculto">Ocultas</SelectItem>
            </SelectContent>
          </Select>

          {(typeFilter !== "todos" ||
            peopleFilter !== "todos" ||
            genderFilter !== "todos" ||
            statusFilter !== "todos" ||
            search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("todos");
                setPeopleFilter("todos");
                setGenderFilter("todos");
                setStatusFilter("todos");
                setSearch("");
              }}
              className="text-xs text-muted-foreground"
            >
              <X className="mr-1 size-3" /> Limpar filtros
            </Button>
          )}

          {selected.length > 0 ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selected.length} selecionadas
              </span>
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
                Ocultar
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Galeria de Imagens ──────────────────────────────────────────────── */}
      {items.isLoading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Carregando referências...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-display text-2xl font-light">Nenhuma foto de referência encontrada</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {allRows.length === 0
              ? "Clique em '+ Nova referência' para subir suas primeiras fotos de ensaios prontos."
              : "Tente mudar os filtros acima."}
          </p>
          {allRows.length === 0 && (
            <Button
              onClick={() => setEditing({ ...EMPTY_FORM, position: 0 })}
              className="mt-6 gap-2"
            >
              <Plus className="size-4" />
              Subir primeira imagem
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => {
            const src = item.image_url?.startsWith("http")
              ? item.image_url
              : (urls.data?.[item.image_url ?? ""] ?? null);
            const originalIndex = allRows.findIndex((row) => row.id === item.id);
            const isChecked = selected.includes(item.id);

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 shadow-sm hover:shadow-md",
                  !item.active && "opacity-60 border-dashed",
                )}
              >
                {/* Imagem com Aspect Ratio [3/4] */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                  {src ? (
                    <img
                      src={src}
                      alt="Referência"
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8" />
                    </div>
                  )}

                  {/* Seleção em massa */}
                  <label className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-md border border-border bg-background/90 shadow-sm cursor-pointer">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(val) =>
                        setSelected((curr) =>
                          val ? [...curr, item.id] : curr.filter((id) => id !== item.id),
                        )
                      }
                    />
                  </label>

                  {/* Badges de Metadados sobre a imagem */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                    <div className="flex flex-wrap gap-1">
                      {item.session_types.map((type) => {
                        const typeObj = SESSION_TYPES.find((t) => t.value === type);
                        return (
                          <span
                            key={type}
                            className="rounded bg-white/20 px-1.5 py-0.5 text-[0.65rem] font-medium backdrop-blur-sm"
                          >
                            {typeObj?.label ?? type}
                          </span>
                        );
                      })}
                      {item.people_count ? (
                        <span className="rounded bg-white/20 px-1.5 py-0.5 text-[0.65rem] font-medium backdrop-blur-sm">
                          {item.people_count} {item.people_count === 1 ? "pessoa" : "pessoas"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Reordenação rápida */}
                  <div className="absolute right-2.5 top-2.5 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 bg-background/90 shadow-sm"
                      onClick={() => move(originalIndex, -1)}
                      disabled={originalIndex === 0}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-7 bg-background/90 shadow-sm"
                      onClick={() => move(originalIndex, 1)}
                      disabled={originalIndex === allRows.length - 1}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize font-medium text-foreground">
                      {item.style || "Estilo livre"}
                    </span>
                    <span className="capitalize">
                      {item.ambiance || "Estúdio"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                      <Switch
                        checked={item.active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: item.id, active: checked })
                        }
                      />
                      <span>{item.active ? "Visível" : "Oculto"}</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditing(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingId(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog de Upload / Edição Inteligente ────────────────────────────── */}
      <ItemDialog item={editing} onClose={() => setEditing(null)} />

      {/* ── Confirmação de Exclusão ─────────────────────────────────────────── */}
      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-light">
              Excluir imagem de referência?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta imagem será removida do catálogo. Clientes que já a escolheram em pedidos
              existentes manterão os registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteItem.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

// ─── Dialog de Upload / Edição ───────────────────────────────────────────────

function ItemDialog({ item, onClose }: { item: CatalogRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...EMPTY_FORM, ...item });
      setFile(null);
      setPreviewUrl(item.image_url?.startsWith("http") ? item.image_url : null);
    }
  }, [item]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    }
  }

  function toggleSessionType(typeValue: string) {
    setForm((prev) => {
      const exists = prev.session_types.includes(typeValue);
      const next = exists
        ? prev.session_types.filter((t) => t !== typeValue)
        : [...prev.session_types, typeValue];
      return { ...prev, session_types: next };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id && !file) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }
    if (form.session_types.length === 0) {
      toast.error("Escolha pelo menos 1 tipo de ensaio.");
      return;
    }

    setSaving(true);
    try {
      let imagePath = form.image_url;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `referencias/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("catalog").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadErr) throw uploadErr;
        imagePath = path;
      }

      const payload = {
        image_url: imagePath,
        session_types: form.session_types,
        people_count: form.people_count,
        gender: form.gender,
        ambiance: form.ambiance,
        style: form.style,
        vibe: form.vibe,
        has_cake: form.has_cake,
        has_age_number: form.has_age_number,
        tags: form.tags,
        position: form.position ?? 0,
        active: form.active,
      };

      const { error } = form.id
        ? await supabase.from("catalog_items").update(payload).eq("id", form.id)
        : await supabase.from("catalog_items").insert(payload);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["catalog-references"] });
      toast.success(form.id ? "Referência atualizada!" : "Imagem de referência adicionada!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const isBirthday = form.session_types.includes("aniversario");

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light">
            {form.id ? "Editar Referência" : "Subir Imagem de Referência"}
          </DialogTitle>
        </DialogHeader>

        <form id="catalog-form" onSubmit={save} className="space-y-6">
          {/* Upload e Pré-visualização */}
          <div>
            <Label className="mb-2 block font-medium">Foto do Ensaio</Label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="group relative flex aspect-[3/4] w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/50 hover:border-foreground/60 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="size-full object-cover" />
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    <UploadCloud className="mx-auto mb-1.5 size-6" />
                    <span>Selecionar imagem</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Suba fotos com boa resolução.</p>
                <p>
                  Esta imagem já contém a composição completa (roupa, cenário, luz e pose). O
                  cliente a verá exatamente como ela é.
                </p>
              </div>
            </div>
          </div>

          {/* Tipos de Ensaio Compatíveis */}
          <div>
            <Label className="mb-2 block font-medium">
              1. Para qual tipo de ensaio essa foto serve?
            </Label>
            <div className="flex flex-wrap gap-2">
              {SESSION_TYPES.map((type) => {
                const isSelected = form.session_types.includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => toggleSessionType(type.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantas pessoas e Gênero */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block font-medium">2. Quantas pessoas aparecem?</Label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => {
                  const isSelected =
                    count === 4 ? (form.people_count ?? 1) >= 4 : form.people_count === count;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setForm({ ...form, people_count: count })}
                      className={cn(
                        "rounded-lg border py-2 text-center text-xs font-medium transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:bg-secondary",
                      )}
                    >
                      {count === 4 ? "4+ pessoas" : `${count} ${count === 1 ? "pessoa" : "pessoas"}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block font-medium">3. Gênero predominante</Label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((g) => {
                  const isSelected = form.gender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g.value })}
                      className={cn(
                        "rounded-lg border py-2 text-center text-xs font-medium transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:bg-secondary",
                      )}
                    >
                      {g.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ambiente e Estilo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block font-medium">4. Ambiente / Cenário</Label>
              <Select
                value={form.ambiance ?? "estudio"}
                onValueChange={(val) => setForm({ ...form, ambiance: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMBIANCE_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block font-medium">5. Estilo visual</Label>
              <Select
                value={form.style ?? "editorial"}
                onValueChange={(val) => setForm({ ...form, style: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vibe / Clima da foto */}
          <div>
            <Label className="mb-2 block font-medium">6. Clima / Vibe da foto</Label>
            <Select
              value={form.vibe ?? "elegante"}
              onValueChange={(val) => setForm({ ...form, vibe: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIBE_OPTIONS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Perguntas extras se Aniversário */}
          {isBirthday && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Opções para Aniversário
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded border border-border bg-card p-3 text-xs">
                  <span>Tem bolo com velas na foto?</span>
                  <Switch
                    checked={form.has_cake}
                    onCheckedChange={(checked) => setForm({ ...form, has_cake: checked })}
                  />
                </label>
                <label className="flex items-center justify-between rounded border border-border bg-card p-3 text-xs">
                  <span>Tem número ou idade na foto?</span>
                  <Switch
                    checked={form.has_age_number}
                    onCheckedChange={(checked) => setForm({ ...form, has_age_number: checked })}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tags extras */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="font-medium">
              Tags de busca (opcional)
            </Label>
            <Input
              id="tags"
              placeholder="Ex: vestido vermelho, balões dourados, terno preto, champanhe"
              value={form.tags.join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          {/* Status Visível */}
          <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
            <Switch
              checked={form.active}
              onCheckedChange={(checked) => setForm({ ...form, active: checked })}
            />
            <span>Visível para os clientes no catálogo</span>
          </label>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="catalog-form" disabled={saving}>
            {saving ? "Salvando imagem..." : form.id ? "Salvar alterações" : "Subir referência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
