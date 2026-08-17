import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Filter,
  ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  QuickElement,
  SESSION_TYPE_ELEMENTS,
  SESSION_TYPES,
} from "@/lib/ensaio-options";
import { getPublicCatalogImageUrl } from "@/lib/public-order-service";
import { useStudioSettings } from "@/lib/studio-settings";
import { cn } from "@/lib/utils";
import { classifyCatalogImage } from "@/lib/vision-ai";

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

export type CatalogRow = {
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
  style: "festa",
  vibe: "festa",
  has_cake: false,
  has_age_number: false,
  tags: [],
  position: 0,
  active: true,
};

export const GENDER_OPTIONS = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "misto", label: "Misto / Grupo" },
];

export const AMBIANCE_OPTIONS = [
  { value: "estudio", label: "Estúdio / Fundo liso", icon: "📸" },
  { value: "decorado", label: "Cenário com balões / Decorado", icon: "🎈" },
  { value: "interno", label: "Ambiente interno / Casa / Hotel", icon: "🏠" },
  { value: "externo", label: "Externo / Cidade / Rua", icon: "🏙️" },
  { value: "natureza", label: "Natureza / Praia / Campo", icon: "🌿" },
];

export const VIBE_OPTIONS = [
  { value: "festa", label: "Festa & Comemoração", icon: "🥂" },
  { value: "elegante", label: "Elegante & Sofisticado", icon: "💎" },
  { value: "descontraido", label: "Descontraído & Leve", icon: "☀️" },
  { value: "poderoso", label: "Marcante & Poderoso", icon: "⚡" },
  { value: "delicado", label: "Delicado & Suave", icon: "🌸" },
  { value: "corporativo", label: "Profissional / Executivo", icon: "💼" },
];
export const QUICK_ELEMENTS: QuickElement[] = [
  { id: "baloes", label: "Balões de Idade", icon: "🎈", setAgeNumber: true },
  { id: "bolo", label: "Bolo / Velas", icon: "🎂", setCake: true },
  { id: "confete", label: "Confete / Brilho", icon: "✨" },
  { id: "champanhe", label: "Champanhe / Taça", icon: "🍾" },
  { id: "flores", label: "Flores / Buquê", icon: "💐" },
  { id: "vestido_festa", label: "Look Festa / Gala", icon: "👗" },
  { id: "executivo", label: "Terno / Blazer", icon: "💼" },
  { id: "infantil", label: "Infantil / Bebê", icon: "🧸" },
  { id: "carro_moto", label: "Carro / Moto", icon: "🚗" },
  { id: "luzes_neon", label: "Luzes / Neon", icon: "💡" },
];

export function getContextualElements(sessionTypes: string[]): QuickElement[] {
  if (sessionTypes.length === 0) {
    return Object.values(SESSION_TYPE_ELEMENTS).flat();
  }
  const elements: QuickElement[] = [];
  const seen = new Set<string>();
  for (const type of sessionTypes) {
    const list = SESSION_TYPE_ELEMENTS[type] ?? SESSION_TYPE_ELEMENTS["outro"] ?? [];
    for (const el of list) {
      if (!seen.has(el.id)) {
        seen.add(el.id);
        elements.push(el);
      }
    }
  }
  // Elementos coringas no final se não estiverem presentes
  const common = SESSION_TYPE_ELEMENTS["outro"] ?? [];
  for (const el of common) {
    if (!seen.has(el.id)) {
      seen.add(el.id);
      elements.push(el);
    }
  }
  return elements;
}

const ITEMS_PER_PAGE = 24;

function CatalogPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [initialPastedFile, setInitialPastedFile] = useState<File | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [peopleFilter, setPeopleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [genderFilter, setGenderFilter] = useState("todos");
  const [selected, setSelected] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

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

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["catalog-references"] });

  // ─── Atalho Global de Colar Imagem (Ctrl+V) ──────────────────────────────────
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      // Se estiver digitando em um input ou textarea, não intercepta
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setInitialPastedFile(file);
            setEditing((prev) => prev ?? { ...EMPTY_FORM, position: allRows.length });
            toast.success("✓ Imagem colada da área de transferência!");
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

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

  // Reset para página 1 quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, peopleFilter, statusFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBatchOpen(true)}
            className="gap-2 border-border/80 hover:bg-secondary"
          >
            <Layers className="size-4 text-amber-500" />
            Subir em Lote
          </Button>

          <Button
            onClick={() => {
              setInitialPastedFile(null);
              setEditing({
                ...EMPTY_FORM,
                position: allRows.length,
              });
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            Nova referência
          </Button>
        </div>
      }
    >
      {/* ── Subtitle e Status Bar ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Fotos completas de ensaios prontos. Os clientes escolhem essas imagens como referência
            para o ensaio deles.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <Clipboard className="size-3 text-amber-500" />
            <strong>Dica rápida:</strong> Pressione <kbd className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] font-mono border">Ctrl+V</kbd> em qualquer lugar da tela para colar uma foto direto da área de transferência.
          </p>
        </div>

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
            placeholder="Buscar por tag, tema, cenário..."
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
              ? "Clique em '+ Nova referência' ou 'Subir em Lote' para adicionar fotos."
              : "Tente mudar os filtros acima."}
          </p>
          {allRows.length === 0 && (
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => {
                  setInitialPastedFile(null);
                  setEditing({ ...EMPTY_FORM, position: 0 });
                }}
                className="gap-2"
              >
                <Plus className="size-4" />
                Subir primeira imagem
              </Button>
              <Button variant="outline" onClick={() => setBatchOpen(true)} className="gap-2">
                <Layers className="size-4 text-amber-500" />
                Subir várias fotos
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedItems.map((item) => {
              const src = getPublicCatalogImageUrl(item.image_url);
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
                    <label className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-md border border-border bg-background/90 shadow-sm cursor-pointer z-10">
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
                        {item.has_age_number ? (
                          <span className="rounded bg-amber-500/80 px-1.5 py-0.5 text-[0.65rem] font-medium text-white backdrop-blur-sm">
                            🎈 Idade/Balões
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Reordenação rápida */}
                    <div className="absolute right-2.5 top-2.5 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
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
                        {VIBE_OPTIONS.find((v) => v.value === item.vibe)?.label.split("&")[0] ||
                          "Estilo livre"}
                      </span>
                      <span className="capitalize text-muted-foreground/80">
                        {AMBIANCE_OPTIONS.find((a) => a.value === item.ambiance)?.label.split("/")[0] ||
                          "Estúdio"}
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
                          onClick={() => {
                            setInitialPastedFile(null);
                            setEditing(item);
                          }}
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

          {/* ── Paginação para Catálogo Grande (1000+ Fotos) ────────────────── */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <p>
                Mostrando <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> a{" "}
                <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</strong> de{" "}
                <strong>{filtered.length}</strong> fotos
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1 h-8 text-xs"
                >
                  <ChevronLeft className="size-3.5" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 px-2 font-medium">
                  <span>Página</span>
                  <strong className="text-foreground">{currentPage}</strong>
                  <span>de</span>
                  <strong>{totalPages}</strong>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1 h-8 text-xs"
                >
                  Próxima
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Dialog de Upload / Edição Inteligente ────────────────────────────── */}
      <ItemDialog
        item={editing}
        initialFile={initialPastedFile}
        onClose={() => {
          setEditing(null);
          setInitialPastedFile(null);
        }}
      />

      {/* ── Dialog de Subir em Lote ─────────────────────────────────────────── */}
      <BatchUploadDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        onComplete={() => {
          setBatchOpen(false);
          refresh();
        }}
        currentCount={allRows.length}
      />

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

function ItemDialog({
  item,
  initialFile,
  onClose,
}: {
  item: CatalogRow | null;
  initialFile?: File | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { settings } = useStudioSettings();
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...EMPTY_FORM, ...item });
      if (initialFile) {
        setFile(initialFile);
        setPreviewUrl(URL.createObjectURL(initialFile));
        // Auto-analisa com IA se for nova foto colada
        if (!item.id) {
          analyzeWithAi(initialFile);
        }
      } else {
        setFile(null);
        setPreviewUrl(item.image_url ? getPublicCatalogImageUrl(item.image_url) : null);
      }
    }
  }, [item, initialFile]);

  // Colar direto quando o modal está aberto
  useEffect(() => {
    if (!item) return;

    function handleDialogPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it && it.type.startsWith("image/")) {
          const pasted = it.getAsFile();
          if (pasted) {
            e.preventDefault();
            setFile(pasted);
            setPreviewUrl(URL.createObjectURL(pasted));
            toast.success("✓ Imagem colada da área de transferência!");
            analyzeWithAi(pasted);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handleDialogPaste);
    return () => window.removeEventListener("paste", handleDialogPaste);
  }, [item, settings]);

  async function analyzeWithAi(customFile?: File | null, customUrl?: string | null) {
    const targetFile = customFile || file;
    const targetUrl = customUrl || previewUrl || form.image_url;
    if (!targetFile && !targetUrl) {
      toast.info("Selecione ou cole uma foto antes de analisar.");
      return;
    }

    setAnalyzingAi(true);
    const toastId = toast.loading(`Analisando imagem com ${settings.aiProvider.toUpperCase()}...`);
    try {
      const result = await classifyCatalogImage({
        image: targetFile || targetUrl!,
        settings,
      });

      setForm((prev) => ({
        ...prev,
        session_types: result.session_types,
        people_count: result.people_count,
        gender: result.gender,
        ambiance: result.ambiance,
        vibe: result.vibe,
        style: result.style || result.vibe,
        has_cake: result.has_cake,
        has_age_number: result.has_age_number,
        tags: result.tags,
      }));

      toast.dismiss(toastId);
      toast.success(`✓ Imagem classificada com sucesso pela IA (${settings.aiProvider.toUpperCase()})!`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Erro ao analisar com IA.");
    } finally {
      setAnalyzingAi(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      if (!form.id) {
        analyzeWithAi(selectedFile);
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      if (!form.id) {
        analyzeWithAi(droppedFile);
      }
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageType = clipboardItem.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          const pastedFile = new File([blob], `colada-${Date.now()}.png`, { type: imageType });
          setFile(pastedFile);
          setPreviewUrl(URL.createObjectURL(pastedFile));
          toast.success("✓ Imagem colada com sucesso!");
          analyzeWithAi(pastedFile);
          return;
        }
      }
      toast.info("Nenhuma imagem copiada encontrada na área de transferência.");
    } catch {
      toast.info("Pressione Ctrl+V no teclado para colar a imagem.");
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

  function toggleQuickElement(element: QuickElement) {
    setForm((prev) => {
      const hasTag = prev.tags.includes(element.id);
      const nextTags = hasTag
        ? prev.tags.filter((t) => t !== element.id)
        : [...prev.tags, element.id];

      const patch: Partial<CatalogRow> = { tags: nextTags };
      if (element.setAgeNumber) patch.has_age_number = !hasTag;
      if (element.setCake) patch.has_cake = !hasTag;

      return { ...prev, ...patch };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id && !file) {
      toast.error("Por favor, selecione ou cole uma imagem.");
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
        style: form.vibe || "festa",
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

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="font-display text-2xl font-light">
              {form.id ? "Editar Referência" : "Subir Imagem de Referência"}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={analyzingAi || (!file && !previewUrl)}
              onClick={() => analyzeWithAi()}
              className="gap-1.5 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-sm"
            >
              {analyzingAi ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 text-amber-500" />
                  {form.id ? "Reclassificar com IA" : "Preencher com IA"}
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <form id="catalog-form" onSubmit={save} className="space-y-6">
          {/* Upload, Drag-Drop e Colar com Ctrl+V */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Foto do Ensaio</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePasteFromClipboard}
                className="gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-7"
              >
                <Clipboard className="size-3.5" />
                Colar Imagem (Ctrl+V)
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "group relative flex aspect-[3/4] w-36 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all",
                  isDragging
                    ? "border-amber-500 bg-amber-500/10 scale-105"
                    : previewUrl
                      ? "border-border bg-card"
                      : "border-border/80 bg-muted/40 hover:border-foreground/60 hover:bg-muted/70",
                )}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                      Trocar foto
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    <UploadCloud className="mx-auto mb-1.5 size-6 text-muted-foreground group-hover:text-foreground" />
                    <span>Clique ou arraste</span>
                    <span className="block mt-1 text-[0.65rem] text-amber-600 dark:text-amber-400 font-medium">
                      ou aperte Ctrl+V
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="text-xs text-muted-foreground space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Classificação automática por IA ativada</span>
                </div>
                <p>
                  Ao selecionar ou colar uma foto, a IA ({settings.aiProvider.toUpperCase()}) identifica
                  automaticamente o tipo de ensaio, número de pessoas, cenário e tags.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[0.7rem] text-muted-foreground/80">
                  <span className="rounded bg-secondary px-2 py-0.5 font-mono">PNG / JPG / WEBP</span>
                  <span>•</span>
                  <span>Suporta Ctrl+V direto</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Tipos de Ensaio Compatíveis */}
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

          {/* 2. Quantas pessoas e 3. Gênero */}
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

          {/* 4. Ambiente / Cenário */}
          <div>
            <Label className="mb-2 block font-medium">4. Ambiente / Cenário da foto</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMBIANCE_OPTIONS.map((a) => {
                const isSelected = form.ambiance === a.value;
                return (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setForm({ ...form, ambiance: a.value })}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{a.icon}</span>
                    <span className="truncate">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Elementos em Destaque na Foto (Seleção Dinâmica Contextual) */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-foreground">
                5. Elementos e Acessórios em destaque (opcional)
              </Label>
              <span className="text-[0.7rem] text-muted-foreground">Toque para marcar</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {getContextualElements(form.session_types).map((el) => {
                const isChecked = form.tags.includes(el.id);
                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => toggleQuickElement(el)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all select-none",
                      isChecked
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{el.icon}</span>
                    <span>{el.label}</span>
                    {isChecked ? <Check className="size-3 text-amber-500" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Clima / Vibe da foto */}
          <div>
            <Label className="mb-2 block font-medium">6. Clima / Vibe da foto</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VIBE_OPTIONS.map((v) => {
                const isSelected = form.vibe === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setForm({ ...form, vibe: v.value })}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{v.icon}</span>
                    <span className="truncate">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags extras livres */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="font-medium">
              Outras palavras-chave / Tags extras (opcional)
            </Label>
            <Input
              id="tags"
              placeholder="Ex: vestido preto, paetê, cadeira de diretor, estúdio escuro"
              value={form.tags.filter((t) => !getContextualElements(form.session_types).some((el) => el.id === t)).join(", ")}
              onChange={(e) => {
                const customTags = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                const allKnownIds = new Set(Object.values(SESSION_TYPE_ELEMENTS).flat().map((el) => el.id));
                const quickTags = form.tags.filter((t) => allKnownIds.has(t));
                setForm({
                  ...form,
                  tags: [...quickTags, ...customTags],
                });
              }}
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
          <Button variant="outline" onClick={onClose} disabled={saving || analyzingAi}>
            Cancelar
          </Button>
          <Button type="submit" form="catalog-form" disabled={saving || analyzingAi}>
            {saving ? "Salvando imagem..." : form.id ? "Salvar alterações" : "Subir referência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog de Subir em Lote com IA (Batch Upload) ───────────────────────────

function BatchUploadDialog({
  open,
  onClose,
  onComplete,
  currentCount,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentCount: number;
}) {
  const { settings } = useStudioSettings();
  const [files, setFiles] = useState<File[]>([]);
  const [useAi, setUseAi] = useState(true);
  const [sessionTypes, setSessionTypes] = useState<string[]>(["aniversario"]);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [gender, setGender] = useState<string>("feminino");
  const [ambiance, setAmbiance] = useState<string>("decorado");
  const [vibe, setVibe] = useState<string>("festa");
  const [tags, setTags] = useState<string[]>(["baloes"]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [progressStatus, setProgressStatus] = useState<string>("");

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleSessionType(typeValue: string) {
    setSessionTypes((prev) =>
      prev.includes(typeValue) ? prev.filter((t) => t !== typeValue) : [...prev, typeValue],
    );
  }

  function toggleElement(el: QuickElement) {
    setTags((prev) => (prev.includes(el.id) ? prev.filter((t) => t !== el.id) : [...prev, el.id]));
  }

  async function uploadBatch() {
    if (files.length === 0) {
      toast.error("Adicione pelo menos 1 imagem para subir.");
      return;
    }
    if (!useAi && sessionTypes.length === 0) {
      toast.error("Escolha pelo menos 1 tipo de ensaio padrão.");
      return;
    }

    setUploading(true);
    setProgress({ current: 0, total: files.length });

    try {
      const defaultHasAgeNumber = tags.includes("baloes");
      const defaultHasCake = tags.includes("bolo");

      const rowsToInsert = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        setProgressStatus(`Subindo arquivo ${i + 1} de ${files.length}...`);

        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `referencias/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from("catalog").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadErr) throw uploadErr;

        let rowData = {
          image_url: path,
          session_types: sessionTypes,
          people_count: peopleCount,
          gender: gender,
          ambiance: ambiance,
          style: vibe,
          vibe: vibe,
          has_cake: defaultHasCake,
          has_age_number: defaultHasAgeNumber,
          tags: tags,
          position: currentCount + i,
          active: true,
        };

        if (useAi) {
          try {
            setProgressStatus(
              `Analisando foto ${i + 1} de ${files.length} com IA (${settings.aiProvider.toUpperCase()})...`,
            );
            const aiResult = await classifyCatalogImage({ image: file, settings });
            rowData = {
              ...rowData,
              session_types: aiResult.session_types.length > 0 ? aiResult.session_types : sessionTypes,
              people_count: aiResult.people_count,
              gender: aiResult.gender,
              ambiance: aiResult.ambiance,
              style: aiResult.style || aiResult.vibe,
              vibe: aiResult.vibe,
              has_cake: aiResult.has_cake,
              has_age_number: aiResult.has_age_number,
              tags: aiResult.tags.length > 0 ? aiResult.tags : tags,
            };
          } catch (aiErr) {
            console.warn(`[BatchAI] Aviso: falha ao classificar foto ${i + 1} com IA, usando padrões:`, aiErr);
          }
        }

        rowsToInsert.push(rowData);
        setProgress({ current: i + 1, total: files.length });
      }

      setProgressStatus("Gravando no banco de dados...");
      const { error: insertErr } = await supabase.from("catalog_items").insert(rowsToInsert);
      if (insertErr) throw insertErr;

      toast.success(
        `🎉 ${files.length} imagens adicionadas ${useAi ? "e categorizadas com IA" : ""} com sucesso!`,
      );
      setFiles([]);
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar lote de imagens.");
    } finally {
      setUploading(false);
      setProgressStatus("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !uploading && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light flex items-center gap-2">
            <Layers className="size-6 text-amber-500" />
            Subir Fotos em Lote {useAi ? "com IA Inteligente" : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seletor de Arquivos Múltiplos */}
          <div>
            <Label className="mb-2 block font-medium">1. Selecione as imagens do seu computador</Label>
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 p-6 text-center cursor-pointer hover:border-foreground/60 transition-colors">
              <UploadCloud className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">
                Clique para selecionar várias fotos de uma vez
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você pode selecionar de 5 a 100 imagens de uma vez (PNG, JPG, WEBP)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFiles}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* Grid de Pré-visualização dos arquivos selecionados */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-medium text-foreground">
                    {files.length} {files.length === 1 ? "foto selecionada" : "fotos selecionadas"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    disabled={uploading}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Limpar todas
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 rounded-lg border border-border/60 bg-muted/20">
                  {files.map((file, idx) => (
                    <div key={idx} className="group relative aspect-[3/4] rounded overflow-hidden bg-muted border">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="size-full object-cover"
                      />
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toggle de IA Automática */}
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-amber-500" />
                  Classificar cada foto individualmente com IA
                </p>
                <p className="text-xs text-muted-foreground">
                  A IA ({settings.aiProvider.toUpperCase()}) analisará cada imagem para identificar
                  especificamente o tipo de ensaio, número de pessoas, cenário e tags de cada foto.
                </p>
              </div>
              <Switch
                checked={useAi}
                onCheckedChange={setUseAi}
                disabled={uploading}
              />
            </div>
          </div>

          {/* Atributos de Fallback / Manuais do lote se IA desativada */}
          {!useAi && (
            <div className="rounded-xl border border-border/80 bg-secondary/30 p-5 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Classificação manual em lote (aplicada a todas as fotos)
              </p>

              {/* Tipos de ensaio */}
              <div>
                <Label className="mb-2 block text-xs font-medium text-foreground">
                  Tipo de ensaio compatível
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {SESSION_TYPES.map((type) => {
                    const isSelected = sessionTypes.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => toggleSessionType(type.value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
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

              {/* Pessoas e Gênero */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium">Pessoas</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPeopleCount(count)}
                        className={cn(
                          "rounded border py-1.5 text-center text-xs font-medium transition-colors",
                          peopleCount === count
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {count === 4 ? "4+" : count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-medium">Gênero</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setGender(g.value)}
                        className={cn(
                          "rounded border py-1.5 text-center text-xs font-medium transition-colors",
                          gender === g.value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {g.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cenário e Clima */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium">Cenário</Label>
                  <Select value={ambiance} onValueChange={setAmbiance}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AMBIANCE_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value} className="text-xs">
                          {a.icon} {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-medium">Clima / Vibe</Label>
                  <Select value={vibe} onValueChange={setVibe}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIBE_OPTIONS.map((v) => (
                        <SelectItem key={v.value} value={v.value} className="text-xs">
                          {v.icon} {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Elementos Dinâmicos do Lote */}
              <div>
                <Label className="mb-2 block text-xs font-medium">Elementos em destaque (dinâmico)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {getContextualElements(sessionTypes).map((el) => {
                    const isChecked = tags.includes(el.id);
                    return (
                      <button
                        key={el.id}
                        type="button"
                        onClick={() => toggleElement(el)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          isChecked
                            ? "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        <span>{el.icon}</span>
                        <span>{el.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Barra de Progresso do Upload */}
          {uploading && (
            <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  {progressStatus || "Processando imagens..."}
                </span>
                <span>
                  {progress.current} de {progress.total} fotos ({Math.round((progress.current / Math.max(1, progress.total)) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-500/20 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={uploadBatch}
            disabled={uploading || files.length === 0}
            className="gap-2 bg-foreground text-background hover:bg-foreground/90"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processando fotos...
              </>
            ) : (
              <>
                {useAi ? <Sparkles className="size-4 text-amber-400" /> : <Layers className="size-4" />}
                Subir {files.length} {files.length === 1 ? "foto agora" : "fotos agora"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
