import {
  CATEGORY_QUESTIONS,
  FRAMING_OPTIONS,
  MAKEUP_OPTIONS,
  OUTFIT_MODES,
  SESSION_TYPES,
  labelFor,
} from "./ensaio-options";
import type { CatalogItemPublic, OrderConfigData } from "./ensaio-types";

export type SummarySection = { title: string; body: string };

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

  let hairDescription = "Não informado";
  if (config.hair === "manter") {
    hairDescription = "Manter como está nas fotos de identidade que o cliente enviará";
  } else if (config.hair) {
    const hairIdx = chosenRefIds.indexOf(config.hair);
    hairDescription =
      hairIdx >= 0
        ? `Inspirar-se no cabelo da Foto de Referência #${hairIdx + 1}`
        : "Inspirar-se em foto de referência selecionada";
  }

  const header = [
    `PEDIDO #${orderNumber} — ${clientName}`,
    `Tipo de ensaio: ${sessionTypeLabel(config)}`,
    `Quantidade de fotos do pacote: ${photoCount}`,
    `Fotos de referência escolhidas: ${chosenRefs.length} de ${photoCount}`,
    `Maquiagem: ${labelFor(MAKEUP_OPTIONS, config.makeup) || "Não informado"}`,
    `Enquadramento: ${labelFor(FRAMING_OPTIONS, config.framing) || "Não informado"}`,
    `Roupa: ${labelFor(OUTFIT_MODES, config.outfit_mode) || "Não informado"}`,
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
      `• Maquiagem: ${labelFor(MAKEUP_OPTIONS, config.makeup) || "Natural"}`,
      `• Enquadramento: ${labelFor(FRAMING_OPTIONS, config.framing) || "Variar"}`,
      `• Roupa: ${labelFor(OUTFIT_MODES, config.outfit_mode) || "Uma roupa só"}`,
      `• Cabelo: ${hairDescription}`,
      `• As referências visuais escolhidas pelo cliente definem o look, iluminação, cenário, poses e clima geral das fotos.`,
    ].join("\n"),
  });

  if (config.special_notes?.trim()) {
    sections.push({
      title: "OBSERVAÇÕES DO CLIENTE",
      body: config.special_notes.trim(),
    });
  }

  sections.push({
    title: "REGRAS ESSENCIAIS",
    body: [
      "1. A identidade facial e características do rosto vêm 100% das fotos reais do cliente enviadas no WhatsApp.",
      "2. Estilo de iluminação, ambiente, roupa, cores e poses devem seguir o padrão das fotos de referência escolhidas.",
      config.outfit_mode === "variar"
        ? "3. Variar levemente a roupa/estilo entre as fotos geradas conforme solicitado pelo cliente."
        : "3. Manter a roupa e cenário coesos e consistentes em todas as fotos do ensaio.",
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
) {
  const ids = selections["referencia"] ?? Object.values(selections).flat();
  return catalog.filter((c) => ids.includes(c.id));
}
