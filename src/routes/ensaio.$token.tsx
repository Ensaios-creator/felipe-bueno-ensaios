import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  HelpCircle,
  ImageIcon,
  Maximize2,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/ensaio/brand-logo";
import { ImagePreviewModal, OptionList, StudioTip } from "@/components/ensaio/choice-cards";
import { ThemeToggle } from "@/components/theme-toggle";
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
import type {
  CatalogItemPublic,
  CustomReference,
  OrderConfigData,
} from "@/lib/ensaio-types";
import {
  confirmPublicOrderClient,
  fetchPublicOrder,
  savePublicOrderClient,
  uploadClientReferencePhoto,
} from "@/lib/public-order-service";
import { cn } from "@/lib/utils";
import { clientSendPhotosMessage, getActiveStudioWhatsApp, whatsappLink } from "@/lib/whatsapp";

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
      { name: "robots", content: "noindex, nofollow" },
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [galleryLimit, setGalleryLimit] = useState(30);

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
      toast.success("Tudo enviado! Abrindo WhatsApp do estúdio...");
      if (query.data?.order) {
        const url = whatsappLink(
          getActiveStudioWhatsApp(),
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

  const [uploadingCustom, setUploadingCustom] = useState(false);

  // Auto-avança da galeria quando o cliente preenche todas as fotos (catálogo + próprias)
  const currentStep = steps[stepIndex] ?? "boas-vindas";
  const currentChosenRefIds = (selections ?? query.data?.selections ?? {})["referencia"] ?? [];
  const currentCustomRefs = config?.custom_references ?? [];
  const totalChosenCount = currentChosenRefIds.length + currentCustomRefs.length;
  const orderPhotoCount = query.data?.order?.photoCount ?? 0;
  const [galleryAutoAdvanced, setGalleryAutoAdvanced] = useState(false);

  useEffect(() => {
    if (
      currentStep === "galeria" &&
      orderPhotoCount > 0 &&
      totalChosenCount >= orderPhotoCount &&
      !galleryAutoAdvanced
    ) {
      setGalleryAutoAdvanced(true);
      setTimeout(() => {
        setStepIndex((idx) => {
          const next = Math.min(steps.length - 1, idx + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return next;
        });
      }, 700);
    }
    // Reset flag when leaving gallery step
    if (currentStep !== "galeria") {
      setGalleryAutoAdvanced(false);
    }
  }, [currentStep, totalChosenCount, orderPhotoCount, galleryAutoAdvanced, steps.length]);

  // Suporte a colar foto própria do clipboard (Ctrl+V) na etapa de galeria
  useEffect(() => {
    if (currentStep !== "galeria") return;

    function handleClientPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const fakeList = {
              0: file,
              length: 1,
              item: (idx: number) => (idx === 0 ? file : null),
              [Symbol.iterator]: function* () {
                yield file;
              },
            } as unknown as FileList;
            handleUploadCustomReference(fakeList);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handleClientPaste);
    return () => window.removeEventListener("paste", handleClientPaste);
  }, [currentStep, totalChosenCount, orderPhotoCount, config?.custom_references]);

  if (query.isLoading) {
    return (
      <Centered>
        <div className="flex flex-col items-center">
          <BrandLogo size="lg" variant="icon" />
          <p className="mt-6 font-display text-2xl font-light tracking-tight text-foreground">
            Abrindo seu ensaio...
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Preparando seu ambiente de escolhas</p>
        </div>
      </Centered>
    );
  }

  if (query.error || !query.data || !config) {
    const isNotFound =
      query.error instanceof Error &&
      (query.error.message.includes("inválido") || query.error.message.includes("não encontrado"));

    return (
      <Centered>
        <BrandLogo size="default" variant="icon" />
        <p className="mt-4 font-display text-3xl font-light">
          {isNotFound ? "Link não encontrado" : "Não foi possível carregar"}
        </p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {isNotFound
            ? "Confira o endereço enviado pelo estúdio no WhatsApp ou solicite um novo link."
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
        const total = current.length + (config?.custom_references ?? []).length;
        if (total >= order.photoCount) {
          toast.info(
            `Você já escolheu ${order.photoCount} ${order.photoCount === 1 ? "foto" : "fotos"}. Toque em uma foto para trocar.`,
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

  async function handleUploadCustomReference(files: FileList | null) {
    if (!files || files.length === 0) return;
    const currentTotal =
      (picked["referencia"] ?? []).length + (config?.custom_references ?? []).length;
    if (currentTotal >= order.photoCount) {
      toast.info(`Você já escolheu o limite de ${order.photoCount} fotos do seu pacote.`);
      return;
    }

    setUploadingCustom(true);
    try {
      const newCustoms: CustomReference[] = [];
      const remainingSlots = order.photoCount - currentTotal;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToUpload) {
        const uploaded = await uploadClientReferencePhoto({ token, file });
        newCustoms.push(uploaded);
      }

      const updated = [...(config?.custom_references ?? []), ...newCustoms];
      patchConfig({ custom_references: updated });
      toast.success(
        `✓ ${newCustoms.length === 1 ? "Sua foto de referência foi adicionada!" : `${newCustoms.length} fotos foram adicionadas!`}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setUploadingCustom(false);
    }
  }

  function removeCustomReference(id: string) {
    const next = (config?.custom_references ?? []).filter((r) => r.id !== id);
    patchConfig({ custom_references: next });
    toast.info("Referência removida.");
  }

  /** Filtra e ordena as imagens de referência com base nas respostas do cliente. */
  function getFilteredImages(): CatalogItemPublic[] {
    const sessionType = config?.session_type ?? null;
    const sessionSubtype = config?.session_subtype ?? null;
    const categoryAnswers = config?.category_answers ?? {};

    // 1. Determina quantidade de pessoas esperada
    let targetPeopleCount: number | null = null;
    if (typeof categoryAnswers["pessoas"] === "number") {
      targetPeopleCount = categoryAnswers["pessoas"];
    } else if (sessionSubtype === "Meu aniversário" || sessionSubtype === "Aniversário infantil") {
      targetPeopleCount = 1;
    } else if (sessionSubtype === "Aniversário casal" || sessionType === "casal") {
      targetPeopleCount = 2;
    } else if (sessionSubtype === "Aniversário empresarial") {
      targetPeopleCount = 3;
    }

    // 2. Preferências de ambiente e elementos
    const fundoAnswer = categoryAnswers["fundo"];
    const ambienteAnswer = categoryAnswers["ambiente"];
    const showAgeAnswer = categoryAnswers["mostrar_idade"];

    // 3. Filtro preliminar por tipo de ensaio
    let candidates = [...catalog];
    if (sessionType) {
      const matchType = candidates.filter(
        (img) => img.sessionTypes.length === 0 || img.sessionTypes.includes(sessionType),
      );
      if (matchType.length >= 2) {
        candidates = matchType;
      }
    }

    // 4. Sistema de Pontuação de Relevância
    const scored = candidates.map((img) => {
      let score = 10;

      // Correspondência estrita de tipo de ensaio
      if (sessionType && img.sessionTypes.includes(sessionType)) {
        score += 30;
      }

      // Correspondência de número de pessoas
      if (targetPeopleCount !== null && img.peopleCount !== null) {
        if (targetPeopleCount >= 3 && img.peopleCount >= 3) {
          score += 25;
        } else if (img.peopleCount === targetPeopleCount) {
          score += 25;
        } else {
          score -= 15;
        }
      }

      // Elementos de Aniversário (Idade / Balões / Velas)
      if (sessionType === "aniversario") {
        if (showAgeAnswer === true && img.hasAgeNumber) {
          score += 20;
        }
        if (sessionSubtype === "Aniversário infantil" && img.tags?.includes("infantil")) {
          score += 25;
        }
      }

      // Preferência de Fundo/Ambiente
      if (fundoAnswer === "Fundo liso" && img.ambiance === "estudio") {
        score += 15;
      } else if (
        fundoAnswer === "Cenário elaborado" &&
        (img.ambiance === "decorado" || img.ambiance === "interno")
      ) {
        score += 15;
      }

      if (ambienteAnswer === "Interno" && (img.ambiance === "interno" || img.ambiance === "estudio")) {
        score += 15;
      } else if (
        ambienteAnswer === "Externo" &&
        (img.ambiance === "externo" || img.ambiance === "natureza")
      ) {
        score += 15;
      }

      return { img, score };
    });

    // Ordena pelo maior score e depois pela posição definida no estúdio
    scored.sort((a, b) => b.score - a.score || a.img.position - b.img.position);

    // Se tivermos filtro de pessoas bem definido e candidatos suficientes, filtra
    if (targetPeopleCount !== null) {
      const exactPeople = scored
        .filter((s) => {
          if (s.img.peopleCount === null) return true;
          if (targetPeopleCount! >= 3) return s.img.peopleCount >= 3;
          return s.img.peopleCount === targetPeopleCount;
        })
        .map((s) => s.img);

      if (exactPeople.length >= 3) {
        return exactPeople;
      }
    }

    return scored.map((s) => s.img);
  }

  // ─── Estado derivado ─────────────────────────────────────────────────────────

  const filteredImages = getFilteredImages();
  const chosenRefIds = picked["referencia"] ?? [];
  const chosenCatalogRefs = catalog.filter((img) => chosenRefIds.includes(img.id));
  const customRefs = config?.custom_references ?? [];

  // Lista unificada de referências (catálogo + enviadas pelo cliente)
  const allChosenRefs = [
    ...chosenCatalogRefs.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      isCustom: false,
      name: undefined as string | undefined,
    })),
    ...customRefs.map((c) => ({
      id: c.id,
      imageUrl: c.imageUrl,
      isCustom: true,
      name: c.name,
    })),
  ];

  const totalSelectedCount = chosenRefIds.length + customRefs.length;

  const stepValid = (() => {
    switch (step) {
      case "tipo":
        return Boolean(config.session_type);
      case "maquiagem":
        return Boolean(config.makeup);
      case "galeria":
        return totalSelectedCount > 0;
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
      {/* ── Header Fixo Elegante com Logo e Tema ───────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 py-3.5 flex items-center justify-between">
          <BrandLogo variant="compact" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[0.65rem] uppercase tracking-wider text-muted-foreground font-sans">
                Etapa {stepIndex + 1} de {steps.length}
              </span>
              <span className="block text-xs font-medium text-foreground">
                Pedido #{order.orderNumber}
              </span>
            </div>

            <ThemeToggle variant="ghost" size="icon" className="size-8 text-foreground" />
          </div>
        </div>

        {/* Barra de Progresso com Transição Fluida */}
        <div className="h-0.5 w-full bg-border/60">
          <div
            className="h-0.5 bg-gradient-to-r from-amber-500/80 via-foreground to-foreground transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Conteúdo Principal com Animações de Entrada ────────────────────── */}
      <main className="mx-auto max-w-2xl px-5 py-8 sm:py-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
        {/* ── Boas-vindas ──────────────────────────────────────────────────── */}
        {step === "boas-vindas" ? (
          <section className="text-center py-4">
            <BrandLogo size="lg" variant="full" className="mb-6" />

            <h1 className="mt-4 font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
              Olá{order.clientName?.trim() ? `, ${order.clientName.trim().split(" ")[0]}` : ""}.
            </h1>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-lg mx-auto">
              Seu pacote inclui <strong className="text-foreground font-semibold">{order.photoCount} fotos profissionais</strong>.
              Nas próximas etapas, você vai escolher visualmente como quer que elas fiquem.
            </p>

            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground mb-2">
                  1
                </span>
                <p className="font-display text-lg font-light">Escolha visual</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Basta tocar nas fotos que você mais gostar.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground mb-2">
                  2
                </span>
                <p className="font-display text-lg font-light">Sem complicação</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Não precisa de termos técnicos, tudo é simples e guiado.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground mb-2">
                  3
                </span>
                <p className="font-display text-lg font-light">Sua identidade</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Seu rosto virá das fotos que você enviar no WhatsApp.
                </p>
              </div>
            </div>

            <StudioTip
              title="Como funciona"
              text="Leva apenas 2 minutos! Suas escolhas são salvas automaticamente a cada toque. Você pode fechar e voltar quando quiser."
            />

            <Button
              size="lg"
              className="mt-8 w-full sm:w-auto sm:min-w-64 gap-2 text-base h-12"
              onClick={() => {
                const next = 1;
                setStepIndex(next);
                patchConfig({ current_step: next });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Começar a montar meu ensaio
              <ArrowRight className="size-4" />
            </Button>
          </section>
        ) : null}

        {/* ── Tipo de ensaio ───────────────────────────────────────────────── */}
        {step === "tipo" ? (
          <StepShell
            eyebrow="Passo 1"
            title="Que tipo de ensaio você quer?"
            hint="Toque na opção mais próxima do seu objetivo."
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
              <div className="mt-8 animate-in fade-in-50 duration-300">
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

            <StudioTip text="Escolha a categoria principal. Na etapa de referências você verá fotos reais desse tipo de ensaio para escolher." />
          </StepShell>
        ) : null}

        {/* ── Perguntas específicas da categoria ───────────────────────────── */}
        {step === "categoria" ? (
          <StepShell
            eyebrow="Passo 2"
            title="Conta um pouco mais"
            hint="Responda cada pergunta tocando na opção. Vamos avançar automaticamente."
          >
            {(() => {
              const allQuestions = CATEGORY_QUESTIONS[config.session_type ?? ""] ?? [];
              const choiceQuestions = allQuestions.filter((q) => q.type === "choice");
              const answeredChoices = choiceQuestions.filter(
                (q) => typeof config.category_answers?.[q.key] === "string" && config.category_answers[q.key],
              );
              const allChoicesAnswered =
                choiceQuestions.length === 0 || answeredChoices.length === choiceQuestions.length;

              return (
                <div className="space-y-8">
                  {/* Progresso das perguntas */}
                  {choiceQuestions.length > 1 ? (
                    <div className="flex items-center gap-2">
                      {choiceQuestions.map((q, idx) => {
                        const answered = typeof config.category_answers?.[q.key] === "string" && config.category_answers[q.key];
                        return (
                          <div
                            key={q.key}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-all duration-500",
                              answered ? "bg-foreground" : idx === answeredChoices.length ? "bg-foreground/30 animate-pulse" : "bg-border/50",
                            )}
                          />
                        );
                      })}
                    </div>
                  ) : null}

                  {allQuestions.map((question) => {
                    const value = config.category_answers?.[question.key];
                    const update = (next: string | number | boolean | null) => {
                      const newAnswers = { ...config.category_answers, [question.key]: next };
                      patchConfig({ category_answers: newAnswers });

                      // Auto-advance quando a última pergunta choice é respondida
                      if (question.type === "choice") {
                        const updatedChoicesDone = choiceQuestions.filter(
                          (q) => q.key === question.key ? true : (typeof newAnswers[q.key] === "string" && newAnswers[q.key]),
                        );
                        if (updatedChoicesDone.length === choiceQuestions.length) {
                          autoAdvance(350);
                        }
                      }
                    };

                    if (question.type === "choice") {
                      return (
                        <div key={question.key}>
                          <p className="mb-3 font-display text-xl font-light">{question.label}</p>
                          <OptionList
                            options={question.options.map((label) => ({ value: label, label }))}
                            value={typeof value === "string" ? value : null}
                            onSelect={(val) => update(val)}
                          />
                        </div>
                      );
                    }

                    if (question.type === "boolean") {
                      return (
                        <label
                          key={question.key}
                          className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-4"
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
                          className="h-12 text-base"
                        />
                      </div>
                    );
                  })}

                  {/* CTA manual para quando só há perguntas de texto/número/boolean */}
                  {allChoicesAnswered && choiceQuestions.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground">Preencha os campos acima e toque em <strong>Continuar</strong> na parte de baixo da tela.</p>
                  ) : null}
                </div>
              );
            })()}

            <StudioTip text="Suas respostas ajudam a filtrar apenas fotos compatíveis com o seu ensaio. Quanto mais você preencher, melhores serão as sugestões!" />
          </StepShell>
        ) : null}

        {/* ── Maquiagem ────────────────────────────────────────────────────── */}
        {step === "maquiagem" ? (
          <StepShell
            eyebrow="Passo 3"
            title="Como você prefere a maquiagem?"
            hint="Escolha o estilo de acabamento para a pele e olhos."
          >
            <OptionList
              options={MAKEUP_OPTIONS}
              value={config.makeup}
              onSelect={(value) => {
                patchConfig({ makeup: value });
                autoAdvance(280);
              }}
            />

            <StudioTip text="Se você não costuma usar muita maquiagem no dia a dia, a opção 'Natural' é perfeita para valorizar seus traços com leveza e realismo." />
          </StepShell>
        ) : null}

        {/* ── Galeria de referências ───────────────────────────────────────── */}
        {step === "galeria" ? (
          <StepShell
            eyebrow="Passo 4"
            title="Escolha as fotos que você mais amar"
            hint={`Selecione ou envie até ${order.photoCount} ${order.photoCount === 1 ? "foto de referência" : "fotos de referência"} para o seu ensaio.`}
          >
            {/* Card de Progresso da Seleção */}
            <div className="mb-6 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                    {totalSelectedCount}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    de {order.photoCount} {order.photoCount === 1 ? "foto selecionada" : "fotos selecionadas"}
                  </p>
                </div>
                <p className="font-display text-base font-light text-muted-foreground">
                  {totalSelectedCount >= order.photoCount ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-4" /> Pacote Completo
                    </span>
                  ) : (
                    `Faltam ${order.photoCount - totalSelectedCount}`
                  )}
                </p>
              </div>

              <div className="mt-3 h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all duration-500 ease-out rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((totalSelectedCount / Math.max(1, order.photoCount)) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* ── Card de Upload de Foto Própria do Cliente ─────────────────── */}
            <div className="mb-6 rounded-xl border-2 border-dashed border-border/90 bg-card/60 p-4 transition-all hover:border-foreground/40 hover:bg-card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <UploadCloud className="size-6" />
                  </div>
                  <div>
                    <p className="font-display text-base sm:text-lg font-light text-foreground">
                      Tem uma foto de referência própria?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Envie do celular/computador para mesclar com o catálogo do estúdio.
                    </p>
                  </div>
                </div>

                <label className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground border border-border cursor-pointer hover:bg-secondary/80 transition-colors">
                  <UploadCloud className="size-4" />
                  <span>{uploadingCustom ? "Enviando..." : "Anexar minha foto"}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadingCustom}
                    onChange={(e) => handleUploadCustomReference(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* ── Fotos Enviadas pelo Próprio Cliente ──────────────────────── */}
            {customRefs.length > 0 && (
              <div className="mb-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suas Fotos Enviadas ({customRefs.length})
                  </p>
                  <span className="text-[0.7rem] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="size-3" /> Incluídas no pacote
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                  {customRefs.map((customImg, idx) => (
                    <div
                      key={customImg.id}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-foreground ring-2 ring-foreground/80 ring-offset-2 ring-offset-background shadow-editorial bg-card"
                    >
                      <img
                        src={customImg.imageUrl}
                        alt="Sua referência"
                        className="size-full object-cover"
                      />

                      {/* Selo de Referência Própria */}
                      <div className="absolute left-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-md">
                        ✨ Sua Foto #{idx + 1}
                      </div>

                      {/* Botão de Zoom */}
                      <button
                        type="button"
                        onClick={() => setPreviewImage(customImg.imageUrl)}
                        className="absolute left-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                        title="Ver em tamanho real"
                      >
                        <Maximize2 className="size-3.5" />
                      </button>

                      {/* Botão de Excluir Referência Própria */}
                      <button
                        type="button"
                        onClick={() => removeCustomReference(customImg.id)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110"
                        title="Remover foto"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Galeria de Referências do Catálogo ──────────────────────── */}
            {filteredImages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <ImageIcon className="mx-auto mb-4 size-8 text-muted-foreground" />
                <p className="font-display text-xl font-light">
                  Nenhuma referência disponível no momento
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você pode avançar ou anexar suas próprias fotos acima.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                  {filteredImages.slice(0, galleryLimit).map((img) => {
                    const isSelected = chosenRefIds.includes(img.id);
                    const selectionOrder = chosenRefIds.indexOf(img.id) + 1;

                    return (
                      <div
                        key={img.id}
                        className={cn(
                          "group relative overflow-hidden rounded-xl aspect-[3/4] border transition-all duration-300 select-none",
                          isSelected
                            ? "border-foreground ring-2 ring-foreground/90 ring-offset-2 ring-offset-background scale-[1.02] shadow-editorial"
                            : "border-border/80 bg-card/60 opacity-85 hover:opacity-100 hover:border-foreground/40 hover:shadow-sm",
                        )}
                      >
                        {/* Clique principal na foto para alternar seleção */}
                        <button
                          type="button"
                          onClick={() => toggleRef(img.id)}
                          className="size-full text-left"
                        >
                          {img.imageUrl ? (
                            <img
                              src={img.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-muted">
                              <ImageIcon className="size-8 text-muted-foreground" />
                            </div>
                          )}
                        </button>

                        {/* Botão de Zoom / Ver em tamanho real */}
                        {img.imageUrl ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(img.imageUrl);
                            }}
                            className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                            title="Ver foto em tamanho real"
                          >
                            <Maximize2 className="size-3.5" />
                          </button>
                        ) : null}

                        {/* Badge de Seleção com Número */}
                        <button
                          type="button"
                          onClick={() => toggleRef(img.id)}
                          className="absolute right-2 top-2"
                        >
                          {isSelected ? (
                            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background shadow-md animate-in zoom-in-75 duration-200">
                              {selectionOrder}
                            </span>
                          ) : (
                            <span className="flex size-7 items-center justify-center rounded-full border border-white/70 bg-black/30 text-transparent opacity-0 transition-opacity group-hover:opacity-100">
                              <Check className="size-3 text-white" />
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {filteredImages.length > galleryLimit && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGalleryLimit((prev) => prev + 30)}
                      className="gap-2 border-border/80 text-xs"
                    >
                      <Plus className="size-3.5" />
                      Ver mais opções (+{filteredImages.length - galleryLimit} fotos)
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Auto-avança quando todas as fotos são selecionadas */}
            {totalSelectedCount >= order.photoCount && totalSelectedCount > 0 ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 animate-in fade-in-50 duration-300">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                  Perfeito! Suas {order.photoCount} {order.photoCount === 1 ? "foto foi selecionada" : "fotos foram selecionadas"}. Avançando...
                </p>
              </div>
            ) : (
              <StudioTip
                title="Dica de Escolha"
                text="Você pode misturar as fotos do catálogo acima com as fotos que você mesmo anexar. Não se preocupe com o rosto da modelo — o seu rosto virá das fotos que você enviar no WhatsApp!"
              />
            )}
          </StepShell>
        ) : null}

        {/* ── Enquadramento ────────────────────────────────────────────────── */}
        {step === "enquadramento" ? (
          <StepShell
            eyebrow="Passo 5"
            title="Como você quer aparecer nas fotos?"
            hint="Defina o corte e a distância da câmera."
          >
            <OptionList
              options={FRAMING_OPTIONS}
              value={config.framing}
              onSelect={(value) => {
                patchConfig({ framing: value });
                autoAdvance(280);
              }}
            />

            <StudioTip text="Para fotos de perfil profissional ou redes sociais, 'Da cintura para cima' ou 'Variar entre as fotos' são as opções mais versáteis." />
          </StepShell>
        ) : null}

        {/* ── Roupa ────────────────────────────────────────────────────────── */}
        {step === "roupa" ? (
          <StepShell
            eyebrow="Passo 6"
            title="Sobre a roupa do ensaio:"
            hint="Você pode manter o mesmo estilo ou variar entre as fotos."
          >
            <OptionList
              options={OUTFIT_MODES}
              value={config.outfit_mode}
              onSelect={(value) => {
                patchConfig({ outfit_mode: value });
                autoAdvance(280);
              }}
            />

            <StudioTip text="Se as referências que você escolheu têm estilos e cores de roupas diferentes, a opção 'Variar a roupa' garante maior diversidade no resultado final." />
          </StepShell>
        ) : null}

        {/* ── Cabelo ───────────────────────────────────────────────────────── */}
        {step === "cabelo" ? (
          <StepShell
            eyebrow="Passo 7"
            title="Como você quer o cabelo?"
            hint="Toque na foto que tem o cabelo que você quer copiar, ou selecione a opção abaixo para manter o seu cabelo natural."
          >
            {allChosenRefs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                {allChosenRefs.map((img, idx) => {
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
                        "group relative overflow-hidden rounded-xl aspect-[3/4] border transition-all duration-300 text-left",
                        isSelected
                          ? "border-foreground ring-2 ring-foreground/90 ring-offset-2 ring-offset-background scale-[1.02] shadow-editorial"
                          : "border-border/80 bg-card/60 opacity-80 hover:opacity-100 hover:border-foreground/40",
                      )}
                    >
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={`Referência ${idx + 1}`}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          <ImageIcon className="size-6 text-muted-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <p className="text-xs font-medium flex items-center gap-1.5">
                          {isSelected ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" /> Copiar este cabelo
                            </>
                          ) : img.isCustom ? (
                            `Copiar da sua foto #${idx + 1}`
                          ) : (
                            `Copiar foto #${idx + 1}`
                          )}
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
                "mt-4 flex w-full items-start gap-4 rounded-xl border p-4 sm:p-5 text-left transition-all duration-300",
                config.hair === "manter"
                  ? "border-foreground bg-secondary/80 shadow-editorial ring-1 ring-foreground/20"
                  : "border-border/80 bg-card/60 hover:border-foreground/40 hover:bg-card",
              )}
            >
              <span className="flex-1">
                <span className="block font-display text-xl sm:text-2xl font-light">
                  Manter meu cabelo natural
                </span>
                <span className="mt-1 block text-xs sm:text-sm text-muted-foreground">
                  Como você está nas fotos de identidade que vai enviar pelo WhatsApp
                </span>
              </span>
              {config.hair === "manter" ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check className="size-3.5 stroke-[2.5]" />
                </span>
              ) : null}
            </button>

            <StudioTip text="Você tem total liberdade: pode copiar um penteado sofisticado de uma das fotos ou pedir para a IA manter o seu corte e estilo natural." />
          </StepShell>
        ) : null}

        {/* ── Observações ──────────────────────────────────────────────────── */}
        {step === "observacoes" ? (
          <StepShell
            eyebrow="Passo 8"
            title="Quer nos contar mais alguma coisa?"
            hint="Campo opcional — se não tiver nada a dizer, basta tocar em Continuar abaixo."
          >
            <Textarea
              id="notes"
              rows={5}
              placeholder="Ex: prefiro tons mais escuros; tenho tatuagem no braço que quero mostrar; gostaria de fotos mais sorridentes..."
              value={config.special_notes}
              onChange={(event) => patchConfig({ special_notes: event.target.value })}
              className="text-base p-4"
            />

            {/* CTA explícita para avançar */}
            <button
              type="button"
              onClick={() => {
                const next = Math.min(steps.length - 1, stepIndex + 1);
                setStepIndex(next);
                patchConfig({ current_step: next });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-foreground/70 bg-foreground text-background py-4 text-base font-semibold shadow-editorial transition-all hover:bg-foreground/90 active:scale-[0.98]"
            >
              Continuar para a revisão
              <ArrowRight className="size-5" />
            </button>

            <StudioTip
              title="Opcional"
              text="Se não tiver nenhuma observação, pode tocar em 'Continuar para a revisão' acima."
            />
          </StepShell>
        ) : null}

        {/* ── Resumo & Envio ───────────────────────────────────────────────── */}
        {step === "resumo" ? (
          <StepShell
            eyebrow="Revisão Final"
            title={config.confirmed ? "Tudo enviado com sucesso ✓" : "Confira suas escolhas"}
            hint={
              config.confirmed
                ? "O estúdio já recebeu sua configuração. Agora envie suas fotos pelo WhatsApp."
                : "Veja o resumo do seu ensaio antes de enviar para o estúdio."
            }
          >
            {/* Galeria das fotos de referência escolhidas */}
            {allChosenRefs.length > 0 ? (
              <div className="mb-6 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
                <div className="mb-3.5 flex items-center justify-between">
                  <p className="eyebrow text-foreground/80 font-medium">
                    {allChosenRefs.length} {allChosenRefs.length === 1 ? "Referência Escolhida" : "Referências Escolhidas"}
                  </p>
                  {!config.confirmed ? (
                    <button
                      type="button"
                      onClick={() => setStepIndex(steps.indexOf("galeria"))}
                      className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Trocar fotos
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {allChosenRefs.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border/80 bg-muted"
                    >
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={`Referência ${idx + 1}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                      <span className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-[0.65rem] font-medium text-white">
                        #{idx + 1}
                      </span>
                      {img.isCustom ? (
                        <span className="absolute left-1.5 top-1.5 rounded bg-amber-500/90 px-1 py-0.5 text-[0.6rem] font-semibold text-white backdrop-blur-sm shadow">
                          Sua
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Resumo das Diretrizes */}
            <dl className="divide-y divide-border/70 rounded-xl border border-border/80 bg-card/60">
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
                        ? "Manter meu cabelo natural"
                        : config.hair
                          ? `Copiar foto #${(allChosenRefs.findIndex((r) => r.id === config.hair) + 1) || "de referência"}`
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
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className={cn(
                      "flex items-baseline justify-between gap-6 px-4 py-3.5 transition-colors",
                      canJump && "cursor-pointer hover:bg-secondary/60",
                    )}
                  >
                    <dt className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span>{label}</span>
                      {canJump ? (
                        <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground/60">
                          (editar)
                        </span>
                      ) : null}
                    </dt>
                    <dd className="text-right font-display text-base sm:text-lg font-light text-foreground">
                      {value || "Não escolhido"}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {!config.confirmed ? (
              <div className="mt-8 space-y-3">
                <Button
                  className="w-full gap-2.5 h-14 text-base font-medium shadow-editorial bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  size="lg"
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate()}
                >
                  <MessageCircle className="size-5" />
                  {confirm.isPending ? "Enviando seu ensaio..." : "Enviar pelo WhatsApp"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Ao clicar, sua configuração será gravada e o WhatsApp do estúdio abrirá para você enviar suas fotos.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-emerald-900 dark:text-emerald-200">
                      Configuração recebida com sucesso!
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                      Agora envie suas fotos de identidade pelo WhatsApp do estúdio (3 a 5 fotos de rosto e 1 de corpo inteiro).
                    </p>
                  </div>
                </div>

                <Button asChild size="lg" className="w-full h-14 text-base gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <a
                    href={whatsappLink(
                      getActiveStudioWhatsApp(),
                      clientSendPhotosMessage({
                        clientName: order.clientName,
                        orderNumber: order.orderNumber,
                      }),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-5" />
                    Enviar minhas fotos pelo WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </StepShell>
        ) : null}
      </main>

      {/* ── Navegação Fixa Inferior ────────────────────────────────────────── */}
      <footer className="fixed inset-x-0 bottom-0 z-10">
        {/* Botão CTA grande e proeminente quando o passo está válido */}
        {step !== "resumo" && step !== "boas-vindas" && step !== "observacoes" ? (
          <div
            className={cn(
              "mx-auto max-w-2xl px-4 transition-all duration-500",
              stepValid ? "pb-1 pt-2" : "pb-0 pt-0 pointer-events-none opacity-0 h-0 overflow-hidden",
            )}
          >
            <button
              type="button"
              onClick={() => {
                const next = Math.min(steps.length - 1, stepIndex + 1);
                setStepIndex(next);
                patchConfig({ current_step: next });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-foreground text-background py-4 text-base font-semibold shadow-2xl shadow-foreground/20 transition-transform active:scale-[0.98] animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            >
              {step === "galeria" ? (
                totalSelectedCount < order.photoCount ? (
                  <>{totalSelectedCount > 0 ? `${totalSelectedCount} de ${order.photoCount} fotos escolhidas` : "Escolha ou envie as fotos acima"} <ArrowRight className="size-5" /></>
                ) : (
                  <>Continuar <ArrowRight className="size-5" /></>
                )
              ) : (
                <>Continuar <ArrowRight className="size-5" /></>
              )}
            </button>
          </div>
        ) : null}

        {/* Barra inferior com Voltar */}
        <div className="border-t border-border/80 bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3">
            <Button
              variant="ghost"
              onClick={() => {
                const prev = Math.max(0, stepIndex - 1);
                setStepIndex(prev);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={stepIndex === 0}
              className="gap-2 text-xs uppercase tracking-wider text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Button>

            {/* Indicador de passo inválido com dica */}
            {step !== "resumo" && step !== "boas-vindas" && step !== "observacoes" && !stepValid ? (
              <span className="text-xs text-muted-foreground animate-pulse">
                👆 Toque em uma opção acima
              </span>
            ) : null}

            {/* Botão discreto no rodapé para galeria (pular) */}
            {step === "galeria" && chosenRefIds.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = Math.min(steps.length - 1, stepIndex + 1);
                  setStepIndex(next);
                  patchConfig({ current_step: next });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="gap-1 text-xs text-muted-foreground"
              >
                Continuar assim
                <ArrowRight className="size-3" />
              </Button>
            ) : null}
          </div>
        </div>
      </footer>

      {/* Modal de Zoom de Imagem */}
      <ImagePreviewModal
        imageUrl={previewImage}
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

// ─── Componentes Auxiliares ─────────────────────────────────────────────────

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
      <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/50 px-3 py-1 text-[0.68rem] uppercase tracking-widest text-muted-foreground font-medium">
        <Sparkles className="size-3 text-amber-500" />
        {eyebrow}
      </div>
      <h1 className="mt-3 font-display text-3xl font-light leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {hint ? (
        <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {hint}
        </p>
      ) : null}
      <div className="mt-7">{children}</div>
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
