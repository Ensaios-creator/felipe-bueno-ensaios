export const CATEGORIES = [
  "look",
  "cenario",
  "maquiagem",
  "cabelo",
  "pose",
  "iluminacao",
  "acessorio",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  look: "Look / Vestuário",
  cenario: "Cenário",
  maquiagem: "Maquiagem",
  cabelo: "Cabelo",
  pose: "Poses",
  iluminacao: "Iluminação",
  acessorio: "Acessórios",
};

export const MULTI_CATEGORIES: Category[] = ["acessorio", "pose"];

export const SESSION_TYPES = [
  { value: "aniversario", label: "Aniversário", hint: "Seu dia, infantil, casal ou empresarial" },
  { value: "estudio", label: "Fotos de Estúdio", hint: "Fundo liso ou cenário elaborado" },
  { value: "casal", label: "Casal", hint: "Dois juntos, com jeito de revista" },
  { value: "casamento", label: "Casamento", hint: "Civil, gala ou pé na areia" },
  { value: "evento", label: "Evento especial", hint: "Halloween, Natal, Dia das Mães..." },
  { value: "gestante", label: "Gestante", hint: "A espera em imagens" },
  { value: "corporativo", label: "Corporativo / Perfil profissional", hint: "Presença e credibilidade" },
  { value: "religioso", label: "Religioso / Espiritual", hint: "Serenidade e simbolismo" },
  { value: "sensual", label: "Sensual", hint: "Sugestivo e artístico" },
  { value: "outro", label: "Outro", hint: "Conte pra gente o que você quer" },
] as const;

export const BIRTHDAY_SUBTYPES = [
  "Meu aniversário",
  "Aniversário infantil",
  "Aniversário casal",
  "Aniversário empresarial",
  "Outro",
];

export const FRAMING_OPTIONS = [
  { value: "corpo-inteiro", label: "Corpo inteiro" },
  { value: "cintura", label: "Da cintura para cima" },
  { value: "rosto-ombros", label: "Rosto e ombros" },
  { value: "variar", label: "Variar entre as fotos" },
];

export const OUTFIT_MODES = [
  { value: "fixa", label: "Uma roupa só em todas as fotos" },
  { value: "variar", label: "Variar a roupa entre as fotos" },
];

export const MAKEUP_OPTIONS = [
  { value: "natural", label: "Natural" },
  { value: "glam", label: "Glam" },
  { value: "nao-aplica", label: "Não se aplica" },
];

export const HAIR_OPTIONS = [
  { value: "solto", label: "Solto" },
  { value: "preso", label: "Preso" },
  { value: "penteado", label: "Um penteado específico" },
  { value: "manter", label: "Manter como está nas fotos que vou enviar" },
];

export const MOOD_OPTIONS = [
  { value: "natural", label: "Luz natural", hint: "Como um fim de tarde bonito" },
  { value: "dramatica", label: "Dramática", hint: "Sombras marcadas, muito contraste" },
  { value: "suave", label: "Suave", hint: "Tudo bem iluminado e delicado" },
  { value: "cinematografica", label: "Cinematográfica", hint: "Cara de cena de filme" },
];

export const PALETTE_OPTIONS = [
  { value: "vermelho-dourado", label: "Vermelho + dourado", colors: ["#7c1c22", "#c79a4b"] },
  { value: "neutros", label: "Neutros e areia", colors: ["#e6ded1", "#b7a794"] },
  { value: "preto-branco", label: "Preto e branco", colors: ["#1c1a18", "#f3f0ea"] },
  { value: "terrosos", label: "Terrosos", colors: ["#8a5a3b", "#c9a887"] },
  { value: "pastel", label: "Tons pastel", colors: ["#e8cfd4", "#cfd8e0"] },
  { value: "verde-esmeralda", label: "Verde esmeralda", colors: ["#1f4f42", "#9fc0ac"] },
  { value: "azul-noite", label: "Azul noite", colors: ["#1b2a44", "#8fa4c4"] },
  { value: "branco-luz", label: "Branco e luz", colors: ["#f7f5f0", "#dcd6c9"] },
];

export type CategoryQuestion =
  | { key: string; label: string; type: "choice"; options: string[] }
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "number"; placeholder?: string }
  | { key: string; label: string; type: "boolean" };

export const CATEGORY_QUESTIONS: Record<string, CategoryQuestion[]> = {
  aniversario: [
    { key: "idade", label: "Qual idade você vai completar?", type: "number", placeholder: "Ex: 27" },
    { key: "mostrar_idade", label: "Pode mostrar a idade na foto?", type: "boolean" },
    { key: "tema", label: "Tem um tema ou decoração em mente?", type: "text", placeholder: "Ex: jardim com velas" },
    { key: "bolo", label: "O bolo com velas aparece nas fotos?", type: "boolean" },
    { key: "pessoas", label: "Quantas pessoas aparecem nas fotos?", type: "number", placeholder: "Ex: 2" },
  ],
  estudio: [
    { key: "fundo", label: "Fundo liso ou cenário elaborado?", type: "choice", options: ["Fundo liso", "Cenário elaborado"] },
    { key: "estilo", label: "Qual estilo combina mais com você?", type: "choice", options: ["Editorial", "Clássico", "Moderno"] },
  ],
  casal: [
    { key: "proximidade", label: "Como vocês querem aparecer?", type: "choice", options: ["Mãos dadas", "Abraço", "Só o olhar", "Um pouco de cada"] },
    { key: "roupas", label: "As roupas combinam ou contrastam?", type: "choice", options: ["Combinando", "Contrastando"] },
    { key: "individuais", label: "Querem fotos individuais também?", type: "boolean" },
  ],
  casamento: [
    { key: "traje", label: "Que tipo de traje?", type: "choice", options: ["Civil", "Gala", "Praia"] },
    { key: "veu_buque", label: "Véu e buquê aparecem?", type: "boolean" },
    { key: "ambiente", label: "Ambiente interno ou externo?", type: "choice", options: ["Interno", "Externo"] },
  ],
  evento: [
    { key: "ocasiao", label: "Qual é a data ou ocasião?", type: "text", placeholder: "Ex: Natal, Halloween, Dia das Mães" },
    { key: "elementos", label: "Algum elemento típico precisa aparecer?", type: "text", placeholder: "Ex: árvore de Natal, abóboras" },
  ],
  gestante: [
    { key: "semanas", label: "De quantas semanas você está?", type: "number", placeholder: "Ex: 32" },
    { key: "barriga", label: "A barriga aparece à mostra?", type: "boolean" },
    { key: "acompanhado", label: "Alguém aparece com você?", type: "text", placeholder: "Ex: meu marido, minha filha" },
  ],
  corporativo: [
    { key: "uso", label: "Onde essas fotos vão ser usadas?", type: "choice", options: ["LinkedIn / perfil", "Site da empresa", "Material de divulgação", "Todos"] },
    { key: "formalidade", label: "Quão formal deve ser?", type: "choice", options: ["Bem formal", "Elegante mas leve", "Descontraído"] },
  ],
  religioso: [
    { key: "ocasiao", label: "Qual é a ocasião?", type: "text", placeholder: "Ex: batizado, primeira comunhão" },
    { key: "simbolos", label: "Algum símbolo precisa aparecer?", type: "text", placeholder: "Ex: terço, bíblia, véu" },
  ],
  sensual: [
    { key: "intensidade", label: "Quanto de ousadia você quer?", type: "choice", options: ["Bem discreto", "Sugestivo", "Mais ousado"] },
    { key: "ambiente", label: "Onde você imagina as fotos?", type: "choice", options: ["Quarto", "Estúdio", "Ao ar livre"] },
  ],
  outro: [
    { key: "descricao", label: "Descreva o ensaio que você imagina", type: "text", placeholder: "Conte com suas palavras" },
  ],
};

export function labelFor(options: { value: string; label: string }[], value?: string | null) {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
