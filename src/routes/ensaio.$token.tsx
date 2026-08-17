import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ImageIcon, MessageCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OptionList } from "@/components/ensaio/choice-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BIRTHDAY_SUBTYPES,
  CATEGORY_QUESTIONS,
  FRAMING_OPTIONS,
  MAKEUP_OPTIONS,
  OUTFIT_MODES,
  SESSION_TYPES,
} from "@/lib/ensaio-options";
import type { CatalogItemPublic, OrderConfigData } from "@/lib/ensaio-types";
import {
  confirmPublicOrderClient,
  fetchPublicOrder,
  savePublicOrderClient,
} from "@/lib/public-order-service";
import { cn } from "@/lib/utils";
import { clientSendPhotosMessage, STUDIO_WHATSAPP, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/ensaio/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Monte seu ensaio — Felipe Bueno" },
      {
        name: "description",
        content: "Escolha as fotos de referência do seu ensaio em poucos toques.",
      },
      { property: "og:title", content: "Monte seu ensaio" },
      {
        property: "og:description",
        content: "Escolha as fotos de referência do seu ensaio em poucos toques.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EnsaioPage,
});

type StepId =
  | "boas-vindas"
  | "tipo"
  | "categoria"
  | "maquiagem"
  | "galeria"
  | "enquadramento"
  | "roupa"
  | "cabelo"
  | "observacoes"
  | "resumo";

function EnsaioPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["public-order", token],
    queryFn: () => fetchPublicOrder(token),
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OrderConfigData | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]> | null>(null);

  const config = draft ?? query.data?.config ?? null;
  const picked = selections ?? query.data?.selections ?? {};
  const catalog = query.data?.catalog ?? [];

  const save = useMutation({
    mutationFn: (payload: {
      config?: Partial<OrderConfigData>;
      selections?: Record<string, string[]>;
    }) => savePublicOrderClient({ token, ...payload }),
    onError: (error: Error) => toast.error(error.message),
  });

  const confirm = useMutation({
    mutationFn: () => confirmPublicOrderClient(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["public-order", token] });
      setDraft(null);
      toast.success("Tudo enviado! Abrindo WhatsApp...");
      if (query.data?.order) {
        const url = whatsappLink(
          STUDIO_WHATSAPP,
          clientSendPhotosMessage({
            clientName: query.data.order.clientName,
            orderNumber: query.data.order.orderNumber,
          }),
        );
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["boas-vindas", "tipo"];
    if ((CATEGORY_QUESTIONS[config?.session_type ?? ""] ?? []).length > 0) {
      base.push("categoria");
    }
    base.push(
      "maquiagem",
      "galeria",
      "enquadramento",
      "roupa",
      "cabelo",
      "observacoes",
      "resumo",
    );
    return base;
  }, [config?.session_type]);

  const [hasRestoredStep, setHasRestoredStep] = useState(false);
  useEffect(() => {
    if (
      !hasRestoredStep &&
      query.data?.config?.current_step !== undefined &&
      query.data.config.current_step > 0
    ) {
      setStepIndex(Math.min(query.data.config.current_step, steps.length - 1));
      setHasRestoredStep(true);
    }
  }, [hasRestoredStep, query.data?.config?.current_step, steps.length]);

  if (query.isLoading) {
    return <Centered>Abrindo seu ensaio...</Centered>;
  }

  if (query.error || !query.data || !config) {
    const isNotFound =
      query.error instanceof Error &&
      (query.error.message.includes("inválido") || query.error.message.includes("não encontrado"));

    return (
      <Centered>
        <p className="font-display text-3xl font-light">
          {isNotFound ? "Link não encontrado" : "Não foi possível carregar"}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {isNotFound
            ? "Confira o endereço enviado pelo estúdio ou solicite um novo link."
            : query.error instanceof Error
              ? query.error.message
              : "Verifique sua conexão e tente novamente."}
        </p>
        <Button variant="outline" className="mt-6 gap-2" onClick={() => query.refetch()}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </Centered>
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function autoAdvance(delayMs = 280) {
    setTimeout(() => {
      setStepIndex((currentIdx) => {
        const next = Math.min(steps.length - 1, currentIdx + 1);
        patchConfig({ current_step: next });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return next;
      });
    }, delayMs);
  }

  const order = query.data.order;
  const step = steps[stepIndex] ?? "boas-vindas";

  function patchConfig(patch: Partial<OrderConfigData>) {
    setDraft((prev) => {
      const base = prev ?? query.data?.config ?? ({} as OrderConfigData);
      return { ...base, ...patch };
    });
    save.mutate({ config: patch as Record<string, unknown> });
  }

  function toggleRef(id: string) {
    setSelections((prev) => {
      const base = prev ?? query.data?.selections ?? {};
      const current = base["referencia"] ?? [];
      let next: string[];
      if (current.includes(id)) {
        next = current.filter((v) => v !== id);
      } else {
        if (current.length >= order.photoCount) {
          toast.info(
            `Você já escolheu ${order.photoCount} ${order.photoCount === 1 ? "foto" : "fotos"}. Toque em uma para trocar.`,
          );
          return base;
        }
        next = [...current, id];
      }
      const merged = { ...base, referencia: next };
      save.mutate({ selections: { referencia: next } });
      return merged;
    });
  }

  /** Filtra as imagens de referência com base nas respostas do cliente. */
  function getFilteredImages(): CatalogItemPublic[] {
    const sessionType = config?.session_type ?? null;
    const peopleAnswer = config?.category_answers?.["pessoas"];
    const peopleCount = typeof peopleAnswer === "number" ? peopleAnswer : null;

    let result = [...catalog];

    // Filtro por tipo de ensaio (relaxa se restar < 3 imagens)
    if (sessionType) {
      const byType = result.filter(
        (img) => img.sessionTypes.length === 0 || img.sessionTypes.includes(sessionType),
      );
      if (byType.length >= 2) result = byType;
    }

    // Filtro por número de pessoas (relaxa se restar < 3 imagens)
    if (peopleCount !== null) {
      const byPeople = result.filter((img) => {
        if (img.peopleCount === null) return true;
        if (peopleCount >= 3) return img.peopleCount >= 3;
        return img.peopleCount === peopleCount;
      });
      if (byPeople.length >= 2) result = byPeople;
    }

    return result;
  }

  // ─── Estado derivado ─────────────────────────────────────────────────────────

  const filteredImages = getFilteredImages();
  const chosenRefIds = picked["referencia"] ?? [];
  const chosenRefs = catalog.filter((img) => chosenRefIds.includes(img.id));

  const stepValid = (() => {
    switch (step) {
      case "tipo":
        return Boolean(config.session_type);
      case "maquiagem":
        return Boolean(config.makeup);
      case "galeria":
        return chosenRefIds.length > 0;
      case "enquadramento":
        return Boolean(config.framing);
      case "roupa":
        return Boolean(config.outfit_mode);
      case "cabelo":
        return Boolean(config.hair);
      default:
        return true;
    }
  })();

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>Pedido #{order.orderNumber}</span>
            <span>
              {stepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="mt-3 h-px w-full bg-border">
            <div
              className="h-px bg-foreground transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-10">
        {/* ── Boas-vindas ──────────────────────────────────────────────────── */}
        {step === "boas-vindas" ? (
          <section>
            <p className="eyebrow">Vamos começar</p>
            <h1 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
              Olá{order.clientName?.trim() ? `, ${order.clientName.trim().split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Seu pacote tem <strong className="text-foreground">{order.photoCount} fotos</strong>.
              Nas próximas telas você vai escolher imagens de referência — fotos prontas que mostram
              o estilo que você quer ter.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              É simples: <strong className="text-foreground">toque</strong> no que combina com
              você. Tudo fica salvo automaticamente.
            </p>
          </section>
        ) : null}

        {/* ── Tipo de ensaio ───────────────────────────────────────────────── */}
        {step === "tipo" ? (
          <StepShell
            eyebrow="Tipo de ensaio"
            title="Que tipo de ensaio você quer?"
            hint="Escolha o que mais combina. Depois a gente refina os detalhes."
          >
            <OptionList
              options={SESSION_TYPES.map((type) => ({ ...type }))}
              value={config.session_type}
              onSelect={(value) => {
                patchConfig({ session_type: value, session_subtype: null, category_answers: {} });
                if (value !== "aniversario") {
                  autoAdvance(280);
                }
              }}
            />
            {config.session_type === "aniversario" ? (
              <div className="mt-8">
                <p className="eyebrow mb-3">Aniversário de quem?</p>
                <OptionList
                  options={BIRTHDAY_SUBTYPES.map((label) => ({ value: label, label }))}
                  value={config.session_subtype}
                  onSelect={(value) => {
                    patchConfig({ session_subtype: value });
                    autoAdvance(280);
                  }}
                />
              </div>
            ) : null}
          </StepShell>
        ) : null}

        {/* ── Perguntas específicas da categoria ───────────────────────────── */}
        {step === "categoria" ? (
          <StepShell
            eyebrow="Detalhes do seu ensaio"
            title="Conta um pouco mais"
            hint="Essas respostas ajudam a mostrar as fotos certas para você."
          >
            <div className="space-y-6">
              {(CATEGORY_QUESTIONS[config.session_type ?? ""] ?? []).map((question) => {
                const value = config.category_answers?.[question.key];
                const update = (next: string | number | boolean | null) =>
                  patchConfig({
                    category_answers: { ...config.category_answers, [question.key]: next },
                  });

                if (question.type === "choice") {
                  return (
                    <div key={question.key}>
                      <p className="mb-3 font-display text-xl font-light">{question.label}</p>
                      <OptionList
                        options={question.options.map((label) => ({ value: label, label }))}
                        value={typeof value === "string" ? value : null}
                        onSelect={(val) => {
                          update(val);
                          const totalQuestions = (
                            CATEGORY_QUESTIONS[config.session_type ?? ""] ?? []
                          ).filter((q) => q.type === "choice").length;
                          if (totalQuestions === 1) autoAdvance(280);
                        }}
                      />
                    </div>
                  );
                }

                if (question.type === "boolean") {
                  return (
                    <label
                      key={question.key}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                    >
                      <span className="font-display text-xl font-light">{question.label}</span>
                      <Switch checked={value === true} onCheckedChange={update} />
                    </label>
                  );
                }

                return (
                  <div key={question.key} className="space-y-2">
                    <Label htmlFor={question.key} className="font-display text-xl font-light">
                      {question.label}
                    </Label>
                    <Input
                      id={question.key}
                      type={question.type === "number" ? "number" : "text"}
                      placeholder={(question as { placeholder?: string }).placeholder}
                      value={value === null || value === undefined ? "" : String(value)}
                      onChange={(event) =>
                        update(
                          question.type === "number"
                            ? Number(event.target.value) || null
                            : event.target.value,
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          </StepShell>
        ) : null}

        {/* ── Maquiagem ────────────────────────────────────────────────────── */}
        {step === "maquiagem" ? (
          <StepShell
            eyebrow="Maquiagem"
            title="Como você quer a maquiagem?"
            hint="Essa escolha vale para todas as fotos do ensaio."
          >
            <OptionList
              options={MAKEUP_OPTIONS}
              value={config.makeup}
              onSelect={(value) => {
                patchConfig({ makeup: value });
                autoAdvance(280);
              }}
            />
          </StepShell>
        ) : null}

        {/* ── Galeria de referências ───────────────────────────────────────── */}
        {step === "galeria" ? (
          <StepShell
            eyebrow="Suas referências"
            title="Escolha as fotos que mais combinam com você"
            hint={`Toque para selecionar. Você pode escolher até ${order.photoCount} ${order.photoCount === 1 ? "foto" : "fotos"}.`}
          >
            {/* Contador de progresso */}
            <div className="mb-5 rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted-foreground">
                  {chosenRefIds.length} de {order.photoCount}{" "}
                  {order.photoCount === 1 ? "foto escolhida" : "fotos escolhidas"}
                </p>
                <p className="font-display text-lg font-light">
                  {chosenRefIds.length >= order.photoCount ? "✓ Completo" : `Faltam ${order.photoCount - chosenRefIds.length}`}
                </p>
              </div>
              <div className="mt-3 h-px w-full bg-border">
                <div
                  className="h-px bg-foreground transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((chosenRefIds.length / Math.max(1, order.photoCount)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {filteredImages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <ImageIcon className="mx-auto mb-4 size-8 text-muted-foreground" />
                <p className="font-display text-xl font-light">
                  Nenhuma referência disponível ainda
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  O estúdio ainda está adicionando fotos. Continue e deixe uma observação.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredImages.map((img) => {
                  const isSelected = chosenRefIds.includes(img.id);
                  const selectionOrder = chosenRefIds.indexOf(img.id) + 1;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => toggleRef(img.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl aspect-[3/4] transition-all duration-200",
                        isSelected
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-[1.02]"
                          : "opacity-80 hover:opacity-100",
                      )}
                    >
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ImageIcon className="size-8 text-muted-foreground" />
                        </div>
                      )}
                      {isSelected ? (
                        <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background shadow-md">
                          {selectionOrder}
                        </span>
                      ) : (
                        <span className="absolute right-2 top-2 size-8 rounded-full border-2 border-white/60 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {chosenRefIds.length > 0 && chosenRefIds.length < order.photoCount ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Pode enviar com {chosenRefIds.length}{" "}
                {chosenRefIds.length === 1 ? "foto" : "fotos"} — as restantes serão variações
                naturais do mesmo estilo.
              </p>
            ) : null}
          </StepShell>
        ) : null}

        {/* ── Enquadramento ────────────────────────────────────────────────── */}
        {step === "enquadramento" ? (
          <StepShell
            eyebrow="Enquadramento"
            title="Nas fotos, você quer aparecer:"
            hint="Como a câmera vai te capturar. Vale para todas as fotos."
          >
            <OptionList
              options={FRAMING_OPTIONS}
              value={config.framing}
              onSelect={(value) => {
                patchConfig({ framing: value });
                autoAdvance(280);
              }}
            />
          </StepShell>
        ) : null}

        {/* ── Roupa ────────────────────────────────────────────────────────── */}
        {step === "roupa" ? (
          <StepShell
            eyebrow="Roupa"
            title="Sobre a roupa do ensaio:"
            hint="As fotos de referência podem ter estilos diferentes — você decide se mantém ou varia."
          >
            <OptionList
              options={OUTFIT_MODES}
              value={config.outfit_mode}
              onSelect={(value) => {
                patchConfig({ outfit_mode: value });
                autoAdvance(280);
              }}
            />
          </StepShell>
        ) : null}

        {/* ── Cabelo ───────────────────────────────────────────────────────── */}
        {step === "cabelo" ? (
          <StepShell
            eyebrow="Cabelo"
            title="Como você quer o cabelo?"
            hint={
              chosenRefs.length > 0
                ? "Toque na foto onde o cabelo te agrada mais. Ou escolha a última opção."
                : "Escolha como você prefere."
            }
          >
            {chosenRefs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chosenRefs.map((img, idx) => {
                  const isSelected = config.hair === img.id;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        patchConfig({ hair: img.id });
                        autoAdvance(280);
                      }}
                      className={cn(
                        "group relative overflow-hidden rounded-xl aspect-[3/4] transition-all duration-200",
                        isSelected
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-[1.02]"
                          : "opacity-75 hover:opacity-100",
                      )}
                    >
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={`Referência ${idx + 1}`}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ImageIcon className="size-6 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <p className="text-xs font-medium">
                          {isSelected ? "✓ Esse cabelo" : `Foto ${idx + 1}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                patchConfig({ hair: "manter" });
                autoAdvance(280);
              }}
              className={cn(
                "mt-4 flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all",
                config.hair === "manter"
                  ? "border-foreground bg-secondary"
                  : "border-border hover:border-foreground/40",
              )}
            >
              <span className="flex-1">
                <span className="block font-display text-xl font-light">
                  Manter o cabelo como estou
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Nas fotos de identidade que você vai nos enviar
                </span>
              </span>
              {config.hair === "manter" ? <Check className="mt-1 size-5 shrink-0" /> : null}
            </button>
          </StepShell>
        ) : null}

        {/* ── Observações ──────────────────────────────────────────────────── */}
        {step === "observacoes" ? (
          <StepShell
            eyebrow="Quase lá!"
            title="Quer nos contar mais alguma coisa?"
            hint="Qualquer detalhe importante para o seu ensaio. Se não tiver nada, pode deixar em branco."
          >
            <Textarea
              id="notes"
              rows={5}
              placeholder="Ex: tenho cabelo curto. Prefiro tons mais escuros. Tenho alergia a determinado produto. Pode ter texto na foto..."
              value={config.special_notes}
              onChange={(event) => patchConfig({ special_notes: event.target.value })}
            />
          </StepShell>
        ) : null}

        {/* ── Resumo ───────────────────────────────────────────────────────── */}
        {step === "resumo" ? (
          <StepShell
            eyebrow="Revisão"
            title={config.confirmed ? "Tudo enviado ✓" : "Confira suas escolhas"}
            hint={
              config.confirmed
                ? "O estúdio já recebeu tudo. Se quiser mudar algo, fale com a equipe."
                : "Se algo não estiver certo, use os botões de editar para ajustar."
            }
          >
            {/* Referências escolhidas */}
            {chosenRefs.length > 0 ? (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="eyebrow">
                    {chosenRefs.length} {chosenRefs.length === 1 ? "referência" : "referências"}{" "}
                    escolhida{chosenRefs.length !== 1 ? "s" : ""}
                  </p>
                  {!config.confirmed ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex(steps.indexOf("galeria"))}
                      className="text-xs text-muted-foreground underline underline-offset-2"
                    >
                      editar
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {chosenRefs.map((img, idx) => (
                    <div key={img.id} className="aspect-[3/4] overflow-hidden rounded-lg">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={`Referência ${idx + 1}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Resumo das escolhas */}
            <dl className="divide-y divide-border rounded-lg border border-border bg-card">
              {(
                [
                  {
                    label: "Tipo de ensaio",
                    value: SESSION_TYPES.find((t) => t.value === config.session_type)?.label,
                    stepId: "tipo" as StepId,
                  },
                  {
                    label: "Maquiagem",
                    value: MAKEUP_OPTIONS.find((m) => m.value === config.makeup)?.label,
                    stepId: "maquiagem" as StepId,
                  },
                  {
                    label: "Enquadramento",
                    value: FRAMING_OPTIONS.find((f) => f.value === config.framing)?.label,
                    stepId: "enquadramento" as StepId,
                  },
                  {
                    label: "Roupa",
                    value: OUTFIT_MODES.find((o) => o.value === config.outfit_mode)?.label,
                    stepId: "roupa" as StepId,
                  },
                  {
                    label: "Cabelo",
                    value:
                      config.hair === "manter"
                        ? "Manter como estou"
                        : config.hair
                          ? `Cabelo da foto ${(chosenRefIds.indexOf(config.hair) + 1) || "de referência"}`
                          : undefined,
                    stepId: "cabelo" as StepId,
                  },
                  {
                    label: "Observações",
                    value: config.special_notes || "Nenhuma",
                    stepId: "observacoes" as StepId,
                  },
                ] satisfies { label: string; value: string | undefined; stepId: StepId }[]
              ).map(({ label, value, stepId }) => {
                const targetIdx = steps.indexOf(stepId);
                const canJump = !config.confirmed && targetIdx !== -1;
                return (
                  <div
                    key={label}
                    onClick={() => {
                      if (canJump) {
                        setStepIndex(targetIdx);
                        patchConfig({ current_step: targetIdx });
                      }
                    }}
                    className={cn(
                      "flex items-baseline justify-between gap-6 px-4 py-3 transition-colors",
                      canJump && "cursor-pointer hover:bg-secondary/60",
                    )}
                  >
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{label}</span>
                      {canJump ? (
                        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/60">
                          (editar)
                        </span>
                      ) : null}
                    </dt>
                    <dd className="text-right font-display text-lg font-light">
                      {value || "Não escolhido"}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {!config.confirmed ? (
              <Button
                className="mt-8 w-full"
                size="lg"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate()}
              >
                <MessageCircle className="mr-2 size-4" />
                {confirm.isPending ? "Enviando..." : "Enviar pelo WhatsApp"}
              </Button>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-5">
                  <Check className="size-5 shrink-0" />
                  <p className="text-sm">
                    Recebido! Agora envie suas fotos de identidade pelo WhatsApp do estúdio — de 3
                    a 5 fotos de rosto e 1 de corpo inteiro. É delas que vem o seu rosto nas
                    imagens.
                  </p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <a
                    href={whatsappLink(
                      STUDIO_WHATSAPP,
                      clientSendPhotosMessage({
                        clientName: order.clientName,
                        orderNumber: order.orderNumber,
                      }),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 size-4" />
                    Enviar minhas fotos pelo WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </StepShell>
        ) : null}
      </main>

      {/* ── Navegação fixa na base ────────────────────────────────────────── */}
      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-4">
          <Button
            variant="ghost"
            onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            disabled={stepIndex === 0}
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
          {step !== "resumo" ? (
            <Button
              onClick={() => {
                if (!stepValid) {
                  toast.info("Faça uma escolha para continuar.");
                  return;
                }
                const next = Math.min(steps.length - 1, stepIndex + 1);
                setStepIndex(next);
                patchConfig({ current_step: next });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Continuar
              <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

// ─── Componentes auxiliares ─────────────────────────────────────────────────

function StepShell({
  eyebrow,
  title,
  hint,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-3xl font-light leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {hint ? <p className="mt-3 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm text-muted-foreground">{children}</div>
    </div>
  );
}
