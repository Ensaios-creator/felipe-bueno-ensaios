import {
  CATEGORY_QUESTIONS,
  FRAMING_OPTIONS,
  HAIR_OPTIONS,
  MAKEUP_OPTIONS,
  MOOD_OPTIONS,
  OUTFIT_MODES,
  PALETTE_OPTIONS,
  SESSION_TYPES,
  labelFor,
} from "./ensaio-options";
import type { CatalogItemPublic, OrderConfigData } from "./ensaio-types";

export type SummarySection = { title: string; body: string };

function itemsOf(catalog: CatalogItemPublic[], selections: Record<string, string[]>, role: string) {
  const ids = selections[role] ?? [];
  return ids
    .map((id) => catalog.find((c) => c.id === id))
    .filter((i): i is CatalogItemPublic => Boolean(i));
}

function describe(items: CatalogItemPublic[]) {
  if (items.length === 0) return "Não informado.";
  return items.map((i) => `[${i.code}] ${i.name}\n${i.aiDescription}`).join("\n\n");
}

function describeCategory(
  catalog: CatalogItemPublic[],
  selections: Record<string, string[]>,
  role: string,
  optionValue?: string | null,
  optionsList?: readonly { value: string; label: string; hint?: string }[],
) {
  const items = itemsOf(catalog, selections, role);
  if (items.length > 0) {
    const desc = describe(items);
    if (optionValue && optionsList) {
      const optLabel = labelFor(optionsList as { value: string; label: string }[], optionValue);
      return `${optLabel}\n\n${desc}`;
    }
    return desc;
  }
  if (optionValue && optionsList) {
    return labelFor(optionsList as { value: string; label: string }[], optionValue);
  }
  return "Não informado.";
}

export function sessionTypeLabel(config: OrderConfigData) {
  const base = SESSION_TYPES.find((t) => t.value === config.session_type)?.label ?? "Não informado";
  return config.session_subtype ? `${base} — ${config.session_subtype}` : base;
}

export function buildSummarySections(params: {
  orderNumber: number;
  clientName: string;
  photoCount: number;
  config: OrderConfigData;
  selections: Record<string, string[]>;
  catalog: CatalogItemPublic[];
}): SummarySection[] {
  const { orderNumber, clientName, photoCount, config, selections, catalog } = params;

  const header = [
    `PEDIDO #${orderNumber} — ${clientName}`,
    `Tipo de ensaio: ${sessionTypeLabel(config)}`,
    `Quantidade de fotos: ${photoCount}`,
    `Enquadramento: ${labelFor(FRAMING_OPTIONS, config.framing) || "Não informado"}`,
    `Roupa: ${labelFor(OUTFIT_MODES, config.outfit_mode) || "Não informado"}`,
    `Maquiagem: ${labelFor(MAKEUP_OPTIONS, config.makeup) || "Não informado"}`,
    `Cabelo: ${labelFor(HAIR_OPTIONS, config.hair) || "Não informado"}`,
    `Clima de luz: ${labelFor(MOOD_OPTIONS, config.lighting_mood) || "Não informado"}`,
  ].join("\n");

  const questions = CATEGORY_QUESTIONS[config.session_type ?? ""] ?? [];
  const specific = questions
    .map((q) => {
      const raw = config.category_answers?.[q.key];
      if (raw === undefined || raw === null || raw === "") return null;
      const value = typeof raw === "boolean" ? (raw ? "Sim" : "Não") : String(raw);
      return `${q.label} ${value}`;
    })
    .filter(Boolean)
    .join("\n");

  const poses = itemsOf(catalog, selections, "pose");
  const remaining = photoCount - poses.length;
  const posesBody =
    poses.length === 0
      ? "Não informado."
      : poses.map((p, i) => `${i + 1}. [${p.code}] ${p.name}\n${p.aiDescription}`).join("\n\n") +
        (remaining > 0
          ? `\n\n(${remaining} ${remaining === 1 ? "foto restante" : "fotos restantes"}: variar naturalmente dentro do estilo acima)`
          : "");

  const sections: SummarySection[] = [{ title: "PEDIDO", body: header }];

  if (specific) sections.push({ title: "DETALHES DA CATEGORIA", body: specific });

  sections.push(
    {
      title: "LOOK / VESTUÁRIO (wardrobe)",
      body: describeCategory(catalog, selections, "look", config.outfit_mode, OUTFIT_MODES),
    },
    { title: "CENÁRIO (scene)", body: describeCategory(catalog, selections, "cenario") },
    {
      title: "MAQUIAGEM",
      body: describeCategory(catalog, selections, "maquiagem", config.makeup, MAKEUP_OPTIONS),
    },
    {
      title: "CABELO",
      body: describeCategory(catalog, selections, "cabelo", config.hair, HAIR_OPTIONS),
    },
    { title: "ACESSÓRIOS", body: describeCategory(catalog, selections, "acessorio") },
    {
      title: "PALETA DE CORES",
      body:
        PALETTE_OPTIONS.find((p) => p.value === config.color_palette)?.label ?? "Não informado.",
    },
    {
      title: "ILUMINAÇÃO",
      body: describeCategory(catalog, selections, "iluminacao", config.lighting_mood, MOOD_OPTIONS),
    },
    { title: "POSES (ações)", body: posesBody },
    {
      title: "TEXTO/IDADE VISÍVEL NA CENA",
      body: config.visible_text_answer?.trim() || "Nada de texto, número ou idade visível na cena.",
    },
    {
      title: "OBSERVAÇÕES ESPECIAIS",
      body: config.special_notes?.trim() || "Nenhuma.",
    },
    {
      title: "REGRAS TRAVADAS",
      body: [
        "Rosto sempre frontal para a câmera em todas as poses.",
        config.outfit_mode === "variar"
          ? "O cliente pediu para variar a roupa entre as fotos."
          : "Wardrobe e scene travados e idênticos entre todas as fotos — só a pose/ação varia.",
        "Nenhuma característica física descrita em texto: a identidade vem das fotos reais do cliente.",
      ].join("\n"),
    },
  );

  return sections;
}

export function summaryToText(sections: SummarySection[]) {
  return sections.map((s, i) => (i === 0 ? s.body : `--- ${s.title} ---\n${s.body}`)).join("\n\n");
}

export function referenceImages(
  catalog: CatalogItemPublic[],
  selections: Record<string, string[]>,
) {
  const ids = Object.values(selections).flat();
  return catalog.filter((c) => ids.includes(c.id));
}
