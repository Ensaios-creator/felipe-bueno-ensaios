import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { OptionList, VisualGrid } from "@/components/ensaio/choice-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BIRTHDAY_SUBTYPES,
  CATEGORY_QUESTIONS,
  FRAMING_OPTIONS,
  HAIR_OPTIONS,
  MAKEUP_OPTIONS,
  MOOD_OPTIONS,
  OUTFIT_MODES,
  PALETTE_OPTIONS,
  SESSION_TYPES,
} from "@/lib/ensaio-options";
import type { OrderConfigData } from "@/lib/ensaio-types";
import {
  confirmPublicOrder,
  getPublicOrder,
  savePublicOrder,
} from "@/lib/public-order.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ensaio/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Monte seu ensaio — Configurador de Ensaios" },
      {
        name: "description",
        content: "Escolha look, cenário, luz e poses do seu ensaio em poucos toques.",
      },
      { property: "og:title", content: "Monte seu ensaio" },
      {
        property: "og:description",
        content: "Escolha look, cenário, luz e poses do seu ensaio em poucos toques.",
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
  | "essenciais"
  | "look"
  | "cenario"
  | "iluminacao"
  | "acessorio"
  | "paleta"
  | "pose"
  | "detalhes"
  | "resumo";

function EnsaioPage() {
  const { token } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchOrder = useServerFn(getPublicOrder);
  const saveOrder = useServerFn(savePublicOrder);
  const confirmOrder = useServerFn(confirmPublicOrder);

  const query = useQuery({
    queryKey: ["public-order", token],
    queryFn: () => fetchOrder({ data: { token } }),
    retry: false,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OrderConfigData | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]> | null>(null);

  const config = draft ?? query.data?.config ?? null;
  const picked = selections ?? query.data?.selections ?? {};
  const catalog = query.data?.catalog ?? [];

  const save = useMutation({
    mutationFn: (payload: {
      config?: Record<string, unknown>;
      selections?: Record<string, string[]>;
    }) => saveOrder({ data: { token, ...payload } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const confirm = useMutation({
    mutationFn: () => confirmOrder({ data: { token } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["public-order", token] });
      setDraft(null);
      toast.success("Tudo enviado para o estúdio!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["boas-vindas", "tipo"];
    if ((CATEGORY_QUESTIONS[config?.session_type ?? ""] ?? []).length > 0) base.push("categoria");
    base.push(
      "essenciais",
      "look",
      "cenario",
      "iluminacao",
      "acessorio",
      "paleta",
      "pose",
      "detalhes",
      "resumo",
    );
    return base;
  }, [config?.session_type]);

  if (query.isLoading) {
    return <Centered>Abrindo seu ensaio...</Centered>;
  }

  if (query.error || !query.data || !config) {
    return (
      <Centered>
        <p className="font-display text-3xl font-light">Link inválido</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Confira o endereço enviado pelo estúdio ou peça um novo link.
        </p>
      </Centered>
    );
  }

  const order = query.data.order;
  const step = steps[stepIndex] ?? "boas-vindas";

  function patchConfig(patch: Partial<OrderConfigData>) {
    const next = { ...config!, ...patch };
    setDraft(next);
    save.mutate({ config: patch as Record<string, unknown> });
  }

  function toggle(role: string, id: string, multi: boolean, max?: number) {
    const current = picked[role] ?? [];
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((value) => value !== id);
    } else if (multi) {
      if (max && current.length >= max) {
        toast.info(`Você já escolheu ${max}. Toque em uma para trocar.`);
        return;
      }
      next = [...current, id];
    } else {
      next = [id];
    }
    const merged = { ...picked, [role]: next };
    setSelections(merged);
    save.mutate({ selections: { [role]: next } });
  }

  function itemsOf(category: string) {
    return catalog.filter((item) => item.category === category);
  }

  const stepValid = (() => {
    switch (step) {
      case "tipo":
        return Boolean(config.session_type);
      case "essenciais":
        return Boolean(config.framing && config.outfit_mode && config.makeup && config.hair);
      case "look":
        return (picked["look"] ?? []).length > 0 || itemsOf("look").length === 0;
      case "cenario":
        return (picked["cenario"] ?? []).length > 0 || itemsOf("cenario").length === 0;
      case "iluminacao":
        return Boolean(config.lighting_mood);
      case "paleta":
        return Boolean(config.color_palette);
      case "pose":
        return (picked["pose"] ?? []).length > 0 || itemsOf("pose").length === 0;
      default:
        return true;
    }
  })();

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

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
        {step === "boas-vindas" ? (
          <section>
            <p className="eyebrow">Vamos começar</p>
            <h1 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight sm:text-5xl">
              Olá, {order.clientName.split(" ")[0]}.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Seu pacote tem <strong className="text-foreground">{order.photoCount} fotos</strong>.
              Nas próximas telas você vai escolher, olhando imagens, como quer que elas sejam.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Leva poucos minutos, tudo fica salvo automaticamente e você pode voltar depois.
            </p>
          </section>
        ) : null}

        {step === "tipo" ? (
          <StepShell
            eyebrow="Tipo de ensaio"
            title="Que tipo de ensaio você quer?"
            hint="Escolha o que mais se aproxima. Depois refinamos os detalhes."
          >
            <OptionList
              options={SESSION_TYPES.map((type) => ({ ...type }))}
              value={config.session_type}
              onSelect={(value) =>
                patchConfig({ session_type: value, session_subtype: null, category_answers: {} })
              }
            />
            {config.session_type === "aniversario" ? (
              <div className="mt-8">
                <p className="eyebrow mb-3">Aniversário de quem?</p>
                <OptionList
                  options={BIRTHDAY_SUBTYPES.map((label) => ({ value: label, label }))}
                  value={config.session_subtype}
                  onSelect={(value) => patchConfig({ session_subtype: value })}
                />
              </div>
            ) : null}
          </StepShell>
        ) : null}

        {step === "categoria" ? (
          <StepShell
            eyebrow="Detalhes do seu ensaio"
            title="Conte um pouco mais"
            hint="Só o que ajuda a montar a cena."
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
                        onSelect={update}
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
                      placeholder={question.placeholder}
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

        {step === "essenciais" ? (
          <StepShell
            eyebrow="O essencial"
            title="Como você quer aparecer?"
            hint="Quatro escolhas rápidas que valem para todas as fotos."
          >
            <div className="space-y-8">
              <Group label="Enquadramento">
                <OptionList
                  options={FRAMING_OPTIONS}
                  value={config.framing}
                  onSelect={(value) => patchConfig({ framing: value })}
                />
              </Group>
              <Group label="Roupa">
                <OptionList
                  options={OUTFIT_MODES}
                  value={config.outfit_mode}
                  onSelect={(value) => patchConfig({ outfit_mode: value })}
                />
              </Group>
              <Group label="Maquiagem">
                <OptionList
                  options={MAKEUP_OPTIONS}
                  value={config.makeup}
                  onSelect={(value) => patchConfig({ makeup: value })}
                />
              </Group>
              <Group label="Cabelo">
                <OptionList
                  options={HAIR_OPTIONS}
                  value={config.hair}
                  onSelect={(value) => patchConfig({ hair: value })}
                />
              </Group>
            </div>
          </StepShell>
        ) : null}

        {step === "look" ? (
          <StepShell
            eyebrow="Look"
            title="Qual roupa você quer usar?"
            hint="Toque na imagem que mais combina com você."
          >
            <VisualGrid
              items={itemsOf("look")}
              selected={picked["look"] ?? []}
              onToggle={(id) => toggle("look", id, false)}
            />
          </StepShell>
        ) : null}

        {step === "cenario" ? (
          <StepShell
            eyebrow="Cenário"
            title="Onde você imagina as fotos?"
            hint="O cenário fica o mesmo em todas as fotos do ensaio."
          >
            <VisualGrid
              items={itemsOf("cenario")}
              selected={picked["cenario"] ?? []}
              onToggle={(id) => toggle("cenario", id, false)}
            />
          </StepShell>
        ) : null}

        {step === "iluminacao" ? (
          <StepShell
            eyebrow="Luz"
            title="Que clima de luz você quer?"
            hint="A luz muda completamente a sensação da imagem."
          >
            <OptionList
              options={MOOD_OPTIONS}
              value={config.lighting_mood}
              onSelect={(value) => patchConfig({ lighting_mood: value })}
            />
            {itemsOf("iluminacao").length > 0 ? (
              <div className="mt-8">
                <p className="eyebrow mb-3">Referências de luz (opcional)</p>
                <VisualGrid
                  items={itemsOf("iluminacao")}
                  selected={picked["iluminacao"] ?? []}
                  onToggle={(id) => toggle("iluminacao", id, false)}
                />
              </div>
            ) : null}
          </StepShell>
        ) : null}

        {step === "acessorio" ? (
          <StepShell
            eyebrow="Acessórios"
            title="Quer incluir algum acessório?"
            hint="Pode escolher mais de um, ou seguir sem nenhum."
          >
            <VisualGrid
              multi
              items={itemsOf("acessorio")}
              selected={picked["acessorio"] ?? []}
              onToggle={(id) => toggle("acessorio", id, true)}
            />
          </StepShell>
        ) : null}

        {step === "paleta" ? (
          <StepShell
            eyebrow="Cores"
            title="Qual paleta você gosta mais?"
            hint="É o clima de cor geral das imagens."
          >
            <div className="grid grid-cols-2 gap-4">
              {PALETTE_OPTIONS.map((palette) => {
                const active = config.color_palette === palette.value;
                return (
                  <button
                    key={palette.value}
                    type="button"
                    onClick={() => patchConfig({ color_palette: palette.value })}
                    className={cn(
                      "overflow-hidden rounded-lg border text-left transition-colors",
                      active ? "border-foreground ring-1 ring-foreground" : "border-border",
                    )}
                  >
                    <span className="flex h-20">
                      {palette.colors.map((color) => (
                        <span key={color} className="flex-1" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="block p-3 font-display text-lg font-light">
                      {palette.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </StepShell>
        ) : null}

        {step === "pose" ? (
          <StepShell
            eyebrow="Poses"
            title={`Escolha até ${order.photoCount} poses`}
            hint="A ordem que você tocar é a ordem das fotos. Só a pose muda entre elas."
          >
            <p className="mb-4 text-sm text-muted-foreground">
              {(picked["pose"] ?? []).length} de {order.photoCount} escolhidas
            </p>
            <VisualGrid
              multi
              items={itemsOf("pose")}
              selected={picked["pose"] ?? []}
              onToggle={(id) => toggle("pose", id, true, order.photoCount)}
            />
          </StepShell>
        ) : null}

        {step === "detalhes" ? (
          <StepShell
            eyebrow="Últimos detalhes"
            title="Falta pouco"
            hint="Duas perguntas rápidas e terminamos."
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="visible_text" className="font-display text-xl font-light">
                  Algum texto, número ou idade deve aparecer na cena?
                </Label>
                <Textarea
                  id="visible_text"
                  rows={3}
                  placeholder="Ex: o número 30 em um balão. Se não quiser nada, deixe em branco."
                  value={config.visible_text_answer}
                  onChange={(event) => {
                    setDraft({ ...config, visible_text_answer: event.target.value });
                  }}
                  onBlur={(event) => patchConfig({ visible_text_answer: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-display text-xl font-light">
                  Quer nos contar mais alguma coisa?
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Qualquer observação importante para o seu ensaio."
                  value={config.special_notes}
                  onChange={(event) => setDraft({ ...config, special_notes: event.target.value })}
                  onBlur={(event) => patchConfig({ special_notes: event.target.value })}
                />
              </div>
            </div>
          </StepShell>
        ) : null}

        {step === "resumo" ? (
          <StepShell
            eyebrow="Revisão"
            title={config.confirmed ? "Tudo enviado" : "Confira suas escolhas"}
            hint={
              config.confirmed
                ? "O estúdio já recebeu o seu ensaio. Se quiser mudar algo, fale com a equipe."
                : "Se algo não estiver certo, volte e ajuste antes de enviar."
            }
          >
            <dl className="divide-y divide-border rounded-lg border border-border bg-card">
              {[
                ["Tipo de ensaio", SESSION_TYPES.find((t) => t.value === config.session_type)?.label],
                ["Fotos", `${order.photoCount}`],
                [
                  "Enquadramento",
                  FRAMING_OPTIONS.find((f) => f.value === config.framing)?.label,
                ],
                ["Roupa", OUTFIT_MODES.find((o) => o.value === config.outfit_mode)?.label],
                ["Maquiagem", MAKEUP_OPTIONS.find((m) => m.value === config.makeup)?.label],
                ["Cabelo", HAIR_OPTIONS.find((h) => h.value === config.hair)?.label],
                [
                  "Look",
                  catalog.find((item) => item.id === (picked["look"] ?? [])[0])?.name,
                ],
                [
                  "Cenário",
                  catalog.find((item) => item.id === (picked["cenario"] ?? [])[0])?.name,
                ],
                ["Luz", MOOD_OPTIONS.find((m) => m.value === config.lighting_mood)?.label],
                [
                  "Paleta",
                  PALETTE_OPTIONS.find((p) => p.value === config.color_palette)?.label,
                ],
                ["Poses escolhidas", `${(picked["pose"] ?? []).length}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-6 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-right font-display text-lg font-light">
                    {value || "Não escolhido"}
                  </dd>
                </div>
              ))}
            </dl>

            {!config.confirmed ? (
              <Button
                className="mt-8 w-full"
                size="lg"
                disabled={confirm.isPending}
                onClick={() => confirm.mutate()}
              >
                {confirm.isPending ? "Enviando..." : "Enviar para o estúdio"}
              </Button>
            ) : (
              <div className="mt-8 flex items-center gap-3 rounded-lg border border-border bg-secondary p-5">
                <Check className="size-5 shrink-0" />
                <p className="text-sm">
                  Recebido! Envie também suas fotos de referência pelo WhatsApp do estúdio — é delas
                  que vem o seu rosto nas imagens.
                </p>
              </div>
            )}
          </StepShell>
        ) : null}
      </main>

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

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm text-muted-foreground">{children}</div>
    </div>
  );
}
