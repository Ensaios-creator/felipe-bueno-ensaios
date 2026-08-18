import { AiProvider, StudioSettings, getStudioSettings } from "./studio-settings";

export interface ImageAiClassification {
  session_types: string[];
  people_count: number;
  gender: "feminino" | "masculino" | "misto";
  ambiance: "estudio" | "decorado" | "interno" | "externo" | "natureza";
  style: string;
  vibe: "festa" | "elegante" | "descontraido" | "poderoso" | "delicado" | "corporativo";
  has_cake: boolean;
  has_age_number: boolean;
  tags: string[];
  ai_description: string;
}

export type ProviderHealthStatus =
  | "online"
  | "rate_limited"
  | "invalid_key"
  | "model_unavailable"
  | "offline"
  | "unconfigured"
  | "checking";

export interface ProviderHealth {
  provider: AiProvider;
  status: ProviderHealthStatus;
  latencyMs?: number;
  message: string;
  detail?: string;
  checkedAt: number;
}

const SYSTEM_INSTRUCTION = `Você é um especialista em fotografia profissional e curadoria de ensaios fotográficos de estúdio com Inteligência Artificial.
Sua tarefa é analisar a imagem de referência fotográfica enviada e extrair metadados precisos e estruturados em formato JSON estrito para alimentar um catálogo de referências de ensaios.

REGRAS DE CLASSIFICAÇÃO:
1. "session_types": Lista com um ou mais tipos de ensaio adequados para esta foto. Escolha APENAS entre:
   - "aniversario" (se houver balões, números, bolo, taça, clima de comemoração de aniversário — de qualquer idade)
   - "infantil" (crianças ou bebês como protagonistas: mesversário, smash the cake, newborn, brinquedos, fantasia infantil)
   - "estudio" (fundo neutro/infinito, iluminação de estúdio, poses clássicas)
   - "casal" (duas pessoas em clima romântico/cumplicidade)
   - "casamento" (noiva, vestido branco longo, terno, véu, altar, buquê)
   - "evento" (festas temáticas, natal, reveillon, formatura, gala)
   - "gestante" (mulher grávida com barriga em evidência)
   - "corporativo" (roupa social/blazer, postura profissional, ambiente executivo)
   - "religioso" (batizado, comunhão, símbolos espirituais, vestes brancas)
   - "sensual" (roupa íntima, lingerie, clima intimista e artístico)
   - "outro" (quando não se encaixar nos anteriores)

   ⚠️ REGRA CRÍTICA DE COMBINAÇÃO DE TIPOS:
   - Foto de aniversário de CRIANÇA ou BEBÊ → use OBRIGATORIAMENTE ["aniversario", "infantil"]
   - Foto de smash the cake, mesversário, newborn → use OBRIGATORIAMENTE ["infantil"]
   - Foto de 15 anos / debutante → use ["aniversario", "evento"] e adicione tag "15anos" e "debutante"
   - Foto de aniversário de ADULTO (sem criança) → use ["aniversario"] APENAS, nunca junto com "infantil"
   - Foto de casamento civil (sem altar/véu/buquê formal) → use ["casamento", "casal"]
   - Foto de ensaio corporativo médico/saúde → use ["corporativo"] e adicione tags como "jaleco", "estetoscopio", "saude"
   - Foto de ensaio corporativo executivo/empresarial → use ["corporativo"] e adicione tags como "executivo", "blazer", "linkedin"
   - Foto de gestante em casal → use ["gestante", "casal"]
   - NUNCA misture "infantil" com "sensual", "casamento" ou "corporativo" no mesmo item

2. "people_count": Número inteiro de pessoas visíveis em destaque na foto (ex: 1, 2, 3...).
3. "gender": Escolha estritamente um: "feminino", "masculino" ou "misto".
4. "ambiance": Escolha estritamente um:
   - "estudio" (fundo liso, ciclorama, fundo infinito ou estúdio fotográfico)
   - "decorado" (cenário com balões, flores, festa ou decoração elaborada)
   - "interno" (dentro de casa, sala, quarto, hotel, escritório, igreja)
   - "externo" (rua, cidade, arquitetura urbana, terraço)
   - "natureza" (praia, campo, jardim, parque)
5. "vibe": Escolha estritamente um: "festa", "elegante", "descontraido", "poderoso", "delicado", "corporativo".
6. "style": Termo curto em português que resume o estilo estético (ex: "glamour", "minimalista", "festa", "romantico", "editorial", "casual chic", "executivo").
7. "has_cake": true se houver bolo ou velas visíveis na cena, false caso contrário.
8. "has_age_number": true se houver balões numéricos de idade ou números visíveis na decoração, false caso contrário.
9. "tags": Lista de 5 a 10 tags curtas em português descrevendo elementos visuais específicos.
   ⚠️ REGRAS OBRIGATÓRIAS PARA TAGS:
   - SEMPRE inclua uma tag de faixa etária: "infantil", "bebe", "crianca", "15anos", "debutante", "adulto", "idoso" conforme visível
   - Para corporativo: inclua tags de especialidade como "jaleco", "estetoscopio", "medico", "saude", "executivo", "blazer", "advogado", "engenheiro", "linkedin" conforme visível
   - Para sensual: inclua "lingerie", "boudoir", "sensual"
   - Para casamento: inclua "noiva", "noivo", "veu", "buque" conforme visível
   - Para gestante: inclua "gestante", "gravida", "barriga" conforme visível
   - Para religioso: inclua "batizado", "comunhao", "primeira_comunhao" conforme visível
   - Para smash the cake: inclua "smash_the_cake", "bolo", "infantil"
   - Para praia: inclua "praia", "areia", "mar"
   - Para igreja/casamento religioso: inclua "igreja", "altar"
   - Para casamento civil: inclua "civil", "cartorio" (se informal/sem véu)
   - Exemplos de outras tags úteis: "vestido vermelho", "taça de champanhe", "balões dourados", "iluminação de revista", "salto alto", "smoking", "terno", "laço", "fantasia"
10. "ai_description": Descrição detalhada e profissional em português (2 a 4 frases) explicando a iluminação, enquadramento, vestimenta, paleta de cores e atmosfera da imagem para servir de briefing e prompt de IA.

IMPORTANTE: Retorne APENAS o objeto JSON puro, sem blocos de markdown adicionais, sem explicações extras.`;

const JSON_SCHEMA_PROMPT = `{
  "session_types": ["aniversario", "infantil"],
  "people_count": 1,
  "gender": "feminino",
  "ambiance": "decorado",
  "style": "festa infantil",
  "vibe": "festa",
  "has_cake": true,
  "has_age_number": true,
  "tags": ["infantil", "crianca", "bolo", "baloes", "vestido_festa", "smash_the_cake", "decoracao_colorida"],
  "ai_description": "Retrato de criança em festa de aniversário com cenário decorado, bolo com velas e balões coloridos. Iluminação suave e ambiente festivo com cores vibrantes. A criança usa vestido de festa e interage com a decoração de forma natural e espontânea."
}`;

export async function fileToBase64DataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export async function urlToBase64DataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("data:")) return imageUrl;
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return fileToBase64DataUrl(blob);
}

function cleanAndParseJson(text: string): ImageAiClassification {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const parsed = JSON.parse(cleaned);

  const validSessionTypes = [
    "aniversario", "infantil", "estudio", "casal", "casamento", "evento",
    "gestante", "corporativo", "religioso", "sensual", "outro"
  ];
  const validGenders = ["feminino", "masculino", "misto"];
  const validAmbiances = ["estudio", "decorado", "interno", "externo", "natureza"];
  const validVibes = ["festa", "elegante", "descontraido", "poderoso", "delicado", "corporativo"];

  const rawSessionTypes = Array.isArray(parsed.session_types) ? parsed.session_types : [];
  const session_types = rawSessionTypes
    .map((s: unknown) => String(s).toLowerCase().trim())
    .filter((s: string) => validSessionTypes.includes(s));

  if (session_types.length === 0) session_types.push("estudio");

  const gender = validGenders.includes(parsed.gender) ? parsed.gender : "feminino";
  const ambiance = validAmbiances.includes(parsed.ambiance) ? parsed.ambiance : "estudio";
  const vibe = validVibes.includes(parsed.vibe) ? parsed.vibe : "elegante";

  return {
    session_types,
    people_count: typeof parsed.people_count === "number" && parsed.people_count > 0 ? Math.round(parsed.people_count) : 1,
    gender,
    ambiance,
    style: typeof parsed.style === "string" && parsed.style ? parsed.style : "festa",
    vibe,
    has_cake: Boolean(parsed.has_cake),
    has_age_number: Boolean(parsed.has_age_number),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
    ai_description: typeof parsed.ai_description === "string" ? parsed.ai_description.trim() : "",
  };
}

// ─── CLASSIFICADOR GROQ (LLaMA 4 Maverick Vision) ───────────────────────────
async function classifyWithGroq(
  imageDataUrl: string,
  apiKey: string,
): Promise<ImageAiClassification> {
  // llama-3.2-11b-vision-preview foi descontinuado pela Groq em 2025.
  // llama-4-scout-17b-16e-instruct foi descontinuado em Jun/2026.
  // Usando llama-4-maverick-17b-128e-instruct (multimodal nativo, suporte a imagens).
  const model = "meta-llama/llama-4-maverick-17b-128e-instruct";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: `${SYSTEM_INSTRUCTION}\nExemplo do formato JSON esperado:\n${JSON_SCHEMA_PROMPT}` },
        {
          role: "user",
          content: [
            { type: "text", text: "Analise esta foto de referência para ensaio e retorne o JSON com a classificação:" },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_completion_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[HTTP ${response.status}] ${errorBody}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq não retornou conteúdo na resposta.");

  return cleanAndParseJson(content);
}

// ─── CLASSIFICADOR GOOGLE GEMINI FLASH ──────────────────────────────────────
async function classifyWithGemini(
  imageDataUrl: string,
  apiKey: string,
): Promise<ImageAiClassification> {
  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) throw new Error("Formato de imagem inválido para o Gemini.");
  const mimeType = match[1] ?? "image/jpeg";
  const base64Data = match[2] ?? "";

  // gemini-2.0-flash foi descontinuado em Jun/2026, gemini-1.5-flash também.
  // Usando a geração atual (Gemini 3.x) com fallback progressivo.
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `Analise a foto e retorne a classificação em JSON seguindo este formato:\n${JSON_SCHEMA_PROMPT}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[HTTP ${response.status}] ${errorText}`);
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error(`Resposta vazia do Gemini ${model}`);

      return cleanAndParseJson(rawText);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Falha ao comunicar com a API do Google Gemini.");
}

// ─── CLASSIFICADOR OPENROUTER ──────────────────────────────────────────────
async function classifyWithOpenRouter(
  imageDataUrl: string,
  apiKey: string,
): Promise<ImageAiClassification> {
  // Modelos free com suporte a visão disponíveis em Agosto/2026:
  // - llama-3.2-11b-vision-instruct foi descontinuado na maioria dos providers.
  // - google/gemini-2.0-flash-exp:free foi removido junto com gemini-2.0-flash.
  // - Usando modelos atuais com visão: Nemotron VL, Gemma 4 e Llama 4 Maverick.
  const models = [
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "meta-llama/llama-4-maverick-17b-128e-instruct:free",
    "openrouter/auto",
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://felipebueno.com",
          "X-Title": "Felipe Bueno Ensaios IA",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `${SYSTEM_INSTRUCTION}\nExemplo do formato JSON esperado:\n${JSON_SCHEMA_PROMPT}` },
            {
              role: "user",
              content: [
                { type: "text", text: "Analise esta foto de referência para ensaio e retorne o JSON estruturado:" },
                {
                  type: "image_url",
                  image_url: { url: imageDataUrl },
                },
              ],
            },
          ],
          // Não forçamos response_format: json_object pois nem todos os modelos
          // free do OpenRouter suportam JSON mode — cleanAndParseJson já trata
          // respostas em texto e markdown code blocks.
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[HTTP ${response.status}] ${errorText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error(`OpenRouter ${model} sem conteúdo na resposta.`);

      return cleanAndParseJson(content);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Falha ao comunicar com a API do OpenRouter.");
}

// ─── DISPATCHER MULTI-PROVEDOR COM FALLBACK ────────────────────────────────
export async function classifyCatalogImage(params: {
  image: File | Blob | string;
  provider?: AiProvider;
  settings?: StudioSettings;
}): Promise<ImageAiClassification> {
  const settings = params.settings || getStudioSettings();
  const provider = params.provider || settings.aiProvider || "groq";

  let imageDataUrl: string;
  if (typeof params.image === "string") {
    imageDataUrl = params.image.startsWith("data:")
      ? params.image
      : await urlToBase64DataUrl(params.image);
  } else {
    imageDataUrl = await fileToBase64DataUrl(params.image);
  }

  const providersToTry: { name: AiProvider; key: string }[] = [];

  if (provider === "groq" && settings.groqApiKey) {
    providersToTry.push({ name: "groq", key: settings.groqApiKey });
  } else if (provider === "gemini" && settings.geminiApiKey) {
    providersToTry.push({ name: "gemini", key: settings.geminiApiKey });
  } else if (provider === "openrouter" && settings.openrouterApiKey) {
    providersToTry.push({ name: "openrouter", key: settings.openrouterApiKey });
  }

  if (settings.groqApiKey && !providersToTry.some((p) => p.name === "groq")) {
    providersToTry.push({ name: "groq", key: settings.groqApiKey });
  }
  if (settings.openrouterApiKey && !providersToTry.some((p) => p.name === "openrouter")) {
    providersToTry.push({ name: "openrouter", key: settings.openrouterApiKey });
  }
  if (settings.geminiApiKey && !providersToTry.some((p) => p.name === "gemini")) {
    providersToTry.push({ name: "gemini", key: settings.geminiApiKey });
  }

  if (providersToTry.length === 0) {
    throw new Error(
      "Nenhuma chave de IA configurada. Acesse 'Perfil & Ajustes' > 'IA & Visão' e informe sua chave API.",
    );
  }

  let lastError: Error | null = null;

  for (const item of providersToTry) {
    try {
      if (item.name === "groq") {
        return await classifyWithGroq(imageDataUrl, item.key);
      }
      if (item.name === "gemini") {
        return await classifyWithGemini(imageDataUrl, item.key);
      }
      if (item.name === "openrouter") {
        return await classifyWithOpenRouter(imageDataUrl, item.key);
      }
    } catch (err) {
      console.warn(`[VisionAI] Falha no provedor ${item.name}, tentando próximo se houver:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Não foi possível analisar a imagem com os provedores configurados.");
}

// ─── DIAGNÓSTICO E SAÚDE EM TEMPO REAL DOS PROVEDORES ───────────────────────

const TEST_PIXEL_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export async function checkProviderHealth(
  provider: AiProvider,
  apiKey: string,
): Promise<ProviderHealth> {
  const trimmedKey = apiKey?.trim() || "";
  const now = Date.now();

  if (!trimmedKey) {
    return {
      provider,
      status: "unconfigured",
      message: "Chave API não informada",
      detail: "Adicione sua chave para ativar este provedor.",
      checkedAt: now,
    };
  }

  const startTime = performance.now();

  try {
    if (provider === "groq") {
      await classifyWithGroq(TEST_PIXEL_DATA_URL, trimmedKey);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        provider,
        status: "online",
        latencyMs,
        message: `Online e pronto (${latencyMs}ms)`,
        detail: "LLaMA 4 Maverick Vision respondendo normalmente.",
        checkedAt: now,
      };
    }

    if (provider === "gemini") {
      await classifyWithGemini(TEST_PIXEL_DATA_URL, trimmedKey);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        provider,
        status: "online",
        latencyMs,
        message: `Online e pronto (${latencyMs}ms)`,
        detail: "Google Gemini 3.5 Flash respondendo normalmente.",
        checkedAt: now,
      };
    }

    if (provider === "openrouter") {
      await classifyWithOpenRouter(TEST_PIXEL_DATA_URL, trimmedKey);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        provider,
        status: "online",
        latencyMs,
        message: `Online e pronto (${latencyMs}ms)`,
        detail: "OpenRouter Vision (Nemotron / Gemma 4) respondendo normalmente.",
        checkedAt: now,
      };
    }

    return {
      provider,
      status: "offline",
      message: "Provedor desconhecido",
      checkedAt: now,
    };
  } catch (err) {
    const errorStr = err instanceof Error ? err.message : String(err);
    const latencyMs = Math.round(performance.now() - startTime);

    // Identificação inteligente do tipo de falha
    if (
      errorStr.includes("401") ||
      errorStr.includes("403") ||
      errorStr.includes("API key not valid") ||
      errorStr.includes("INVALID_ARGUMENT") ||
      errorStr.includes("invalid_api_key") ||
      errorStr.includes("Unauthorized")
    ) {
      return {
        provider,
        status: "invalid_key",
        latencyMs,
        message: "Chave de API inválida ou expirada",
        detail: "Verifique se a chave foi copiada corretamente ou gere uma nova.",
        checkedAt: now,
      };
    }

    if (
      errorStr.includes("429") ||
      errorStr.includes("quota") ||
      errorStr.includes("rate limit") ||
      errorStr.includes("RESOURCE_EXHAUSTED") ||
      errorStr.includes("402") ||
      errorStr.includes("credits")
    ) {
      return {
        provider,
        status: "rate_limited",
        latencyMs,
        message: "Limite de requisições ou créditos esgotados",
        detail: "Limite diário/minuto atingido na sua conta deste provedor.",
        checkedAt: now,
      };
    }

    if (
      errorStr.includes("404") ||
      errorStr.includes("model_not_found") ||
      errorStr.includes("not found")
    ) {
      return {
        provider,
        status: "model_unavailable",
        latencyMs,
        message: "Modelo indisponível no provedor",
        detail: "O modelo de visão pode estar em manutenção temporária.",
        checkedAt: now,
      };
    }

    return {
      provider,
      status: "offline",
      latencyMs,
      message: "Falha de conexão / Servidor indisponível",
      detail: errorStr.slice(0, 120),
      checkedAt: now,
    };
  }
}

export async function checkAllProvidersHealth(
  settings: StudioSettings,
): Promise<Record<AiProvider, ProviderHealth>> {
  const [groq, gemini, openrouter] = await Promise.all([
    checkProviderHealth("groq", settings.groqApiKey),
    checkProviderHealth("gemini", settings.geminiApiKey),
    checkProviderHealth("openrouter", settings.openrouterApiKey),
  ]);

  return { groq, gemini, openrouter };
}

export async function testAiConnection(
  provider: AiProvider,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const health = await checkProviderHealth(provider, apiKey);
  if (health.status === "online") {
    return {
      success: true,
      message: `Conexão bem-sucedida! ${health.detail || ""} (${health.latencyMs}ms)`,
    };
  }
  return {
    success: false,
    message: `${health.message}${health.detail ? ` — ${health.detail}` : ""}`,
  };
}
