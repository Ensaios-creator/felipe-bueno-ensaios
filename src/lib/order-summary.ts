import {
  CATEGORY_QUESTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  MAKEUP_OPTIONS,
  OUTFIT_MODES,
  SCENARIO_MODES,
  SESSION_TYPES,
  labelFor,
} from "./ensaio-options";
import type { CatalogItemPublic, CustomReference, OrderConfigData } from "./ensaio-types";

export type SummarySection = { title: string; body: string };

export type ReferenceViewItem = {
  id: string;
  imageUrl: string | null;
  style?: string | null;
  vibe?: string | null;
  peopleCount?: number | null;
  isCustom?: boolean;
};

export function sessionTypeLabel(config: OrderConfigData) {
  const base =
    SESSION_TYPES.find((t) => t.value === config.session_type)?.label ?? "Não informado";
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

  const chosenRefIds = selections["referencia"] ?? Object.values(selections).flat();
  const chosenRefs = catalog.filter((c) => chosenRefIds.includes(c.id));
  const customRefs =
    config.custom_references ??
    (config.category_answers?.["_custom_references"] as CustomReference[] | undefined) ??
    [];
  const totalRefsCount = chosenRefs.length + customRefs.length;

  const allRefsUnified = [
    ...chosenRefs.map((c) => ({ id: c.id, isCustom: false })),
    ...customRefs.map((c) => ({ id: c.id, isCustom: true })),
  ];

  // Descrição do Cabelo
  let hairDescription = "Não informado";
  if (config.hair === "manter") {
    hairDescription = "Manter como está nas fotos de identidade que o cliente enviará";
  } else if (config.hair) {
    const hairIdx = allRefsUnified.findIndex((r) => r.id === config.hair);
    if (hairIdx >= 0) {
      const refItem = allRefsUnified[hairIdx];
      hairDescription = refItem.isCustom
        ? `Copiar cabelo da Foto Própria do Cliente #${hairIdx + 1}`
        : `Copiar cabelo da Foto de Referência #${hairIdx + 1}`;
    } else {
      hairDescription = "Inspirar-se em foto de referência selecionada";
    }
  }

  // Descrição da Roupa
  let outfitDescription = "Não informado";
  if (config.outfit_mode === "fixa") {
    if (config.outfit_reference_id) {
      const outfitIdx = allRefsUnified.findIndex((r) => r.id === config.outfit_reference_id);
      if (outfitIdx >= 0) {
        const refItem = allRefsUnified[outfitIdx];
        outfitDescription = refItem.isCustom
          ? `Uma roupa só (Look da Foto Própria #${outfitIdx + 1})`
          : `Uma roupa só (Look da Foto de Referência #${outfitIdx + 1})`;
      } else {
        outfitDescription = "Uma roupa só (Look fixo da referência)";
      }
    } else {
      outfitDescription = "Uma roupa só em todas as fotos";
    }
  } else if (config.outfit_mode === "variar") {
    outfitDescription = "Variar a roupa entre as fotos (Looks diversos das referências)";
  }

  // Descrição do Cenário
  let scenarioDescription = "Não informado";
  if (photoCount === 1) {
    scenarioDescription = "Cenário da foto de referência única";
  } else if (config.scenario_mode === "fixo") {
    if (config.scenario_reference_id) {
      const scenarioIdx = allRefsUnified.findIndex((r) => r.id === config.scenario_reference_id);
      if (scenarioIdx >= 0) {
        const refItem = allRefsUnified[scenarioIdx];
        scenarioDescription = refItem.isCustom
          ? `Um cenário só (Cenário da Foto Própria #${scenarioIdx + 1})`
          : `Um cenário só (Cenário da Foto de Referência #${scenarioIdx + 1})`;
      } else {
        scenarioDescription = "Um cenário só (Cenário fixo da referência)";
      }
    } else {
      scenarioDescription = "Um cenário só em todas as fotos";
    }
  } else if (config.scenario_mode === "variar") {
    scenarioDescription = "Variar cenários entre as fotos (Ambientes diversos das referências)";
  }

  // Descrição da Expressão / Sorriso
  const expressionObj = EXPRESSION_OPTIONS.find((e) => e.value === config.expression);
  const expressionDescription = expressionObj
    ? `${expressionObj.icon} ${expressionObj.label}`
    : "Natural / Não especificado";

  const header = [
    `PEDIDO #${orderNumber} — ${clientName}`,
    `Tipo de ensaio: ${sessionTypeLabel(config)}`,
    `Quantidade de fotos do pacote: ${photoCount}`,
    `Fotos de referência escolhidas: ${totalRefsCount} de ${photoCount}${customRefs.length > 0 ? ` (${customRefs.length} enviadas pelo cliente)` : ""}`,
    `Expressão & Sorriso: ${expressionDescription}`,
    `Maquiagem: ${labelFor(MAKEUP_OPTIONS, config.makeup) || "Não informado"}`,
    `Enquadramento: ${labelFor(FRAMING_OPTIONS, config.framing) || "Não informado"}`,
    `Roupa / Look: ${outfitDescription}`,
    `Cenário / Ambiente: ${scenarioDescription}`,
    `Cabelo: ${hairDescription}`,
  ].join("\n");

  const questions = CATEGORY_QUESTIONS[config.session_type ?? ""] ?? [];
  const specific = questions
    .map((q) => {
      const raw = config.category_answers?.[q.key];
      if (raw === undefined || raw === null || raw === "") return null;
      const value = typeof raw === "boolean" ? (raw ? "Sim" : "Não") : String(raw);
      return `${q.label}: ${value}`;
    })
    .filter(Boolean)
    .join("\n");

  const sections: SummarySection[] = [{ title: "PEDIDO", body: header }];

  if (specific) {
    sections.push({ title: "DETALHES DO ENSAIO", body: specific });
  }

  sections.push({
    title: "DIRETRIZES DO ENSAIO",
    body: [
      `• Expressão & Sorriso: ${expressionDescription}`,
      `• Maquiagem: ${labelFor(MAKEUP_OPTIONS, config.makeup) || "Natural"}`,
      `• Enquadramento: ${labelFor(FRAMING_OPTIONS, config.framing) || "Variar"}`,
      `• Roupa / Look: ${outfitDescription}`,
      `• Cenário / Ambiente: ${scenarioDescription}`,
      `• Cabelo: ${hairDescription}`,
      `• As referências visuais escolhidas pelo cliente definem o look, iluminação, cenário, poses e atmosfera geral das fotos.`,
    ].join("\n"),
  });

  if (config.special_notes?.trim()) {
    sections.push({
      title: "OBSERVAÇÕES DO CLIENTE",
      body: config.special_notes.trim(),
    });
  }

  sections.push({
    title: "REGRAS ESSENCIAIS DE PRODUÇÃO (IA)",
    body: [
      "1. A identidade facial e características do rosto vêm 100% das fotos reais do cliente enviadas no WhatsApp.",
      `2. Expressão Facial: Seguir a preferência "${expressionDescription}".`,
      `3. Look & Roupa: ${config.outfit_mode === "fixa" ? "Manter o look da referência indicada em todas as fotos." : "Variar os looks entre as fotos conforme as referências."}`,
      `4. Cenário: ${config.scenario_mode === "fixo" ? "Manter o cenário e iluminação da referência indicada consistentes em todas as fotos." : "Variar cenários e atmosferas conforme as referências."}`,
      `5. Cabelo: ${config.hair === "manter" ? "Manter o corte, comprimento e textura natural do cliente." : "Inspirar-se no corte/penteado da foto de referência escolhida."}`,
    ].join("\n"),
  });

  return sections;
}

export function summaryToText(sections: SummarySection[]) {
  return sections.map((s, i) => (i === 0 ? s.body : `--- ${s.title} ---\n${s.body}`)).join("\n\n");
}

export function referenceImages(
  catalog: CatalogItemPublic[],
  selections: Record<string, string[]>,
  customReferences?: CustomReference[],
): ReferenceViewItem[] {
  const ids = selections["referencia"] ?? Object.values(selections).flat();
  const catalogRefs: ReferenceViewItem[] = catalog
    .filter((c) => ids.includes(c.id))
    .map((c) => ({
      id: c.id,
      imageUrl: c.imageUrl,
      style: c.style,
      vibe: c.vibe,
      peopleCount: c.peopleCount,
      isCustom: false,
    }));

  const customRefs: ReferenceViewItem[] = (customReferences ?? []).map((cr) => ({
    id: cr.id,
    imageUrl: cr.imageUrl,
    style: "Referência do cliente",
    vibe: "Foto própria anexada",
    peopleCount: 1,
    isCustom: true,
  }));

  return [...catalogRefs, ...customRefs];
}
