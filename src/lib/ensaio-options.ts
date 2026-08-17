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
  {
    value: "corporativo",
    label: "Corporativo / Perfil profissional",
    hint: "Presença e credibilidade",
  },
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
  { value: "natural", label: "Natural", hint: "Leve, pele bonita e cores suaves" },
  { value: "marcante", label: "Marcante", hint: "Mais cor, olho definido, batom forte" },
  { value: "nao-quero", label: "Não quero maquiagem" },
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

export type QuickElement = {
  id: string;
  label: string;
  icon: string;
  setAgeNumber?: boolean;
  setCake?: boolean;
};

export const SESSION_TYPE_ELEMENTS: Record<string, QuickElement[]> = {
  aniversario: [
    { id: "baloes", label: "Balões / Idade", icon: "🎈", setAgeNumber: true },
    { id: "bolo", label: "Bolo / Velas", icon: "🎂", setCake: true },
    { id: "confete", label: "Confete / Brilho", icon: "✨" },
    { id: "champanhe", label: "Champanhe / Taça", icon: "🍾" },
    { id: "vestido_festa", label: "Look Festa / Gala", icon: "👗" },
    { id: "tiara", label: "Tiara / Coroa", icon: "👑" },
    { id: "infantil", label: "Infantil / Bebê", icon: "🧸" },
    { id: "presentes", label: "Caixas de Presente", icon: "🎁" },
  ],
  corporativo: [
    { id: "executivo", label: "Terno / Blazer", icon: "💼" },
    { id: "notebook", label: "Notebook / Tablet", icon: "💻" },
    { id: "livros", label: "Livros / Biblioteca", icon: "📚" },
    { id: "cafe", label: "Café / Xícara", icon: "☕" },
    { id: "escritorio_luxo", label: "Escritório Moderno", icon: "🏢" },
    { id: "oculos", label: "Óculos de Grau", icon: "👓" },
  ],
  estudio: [
    { id: "fundo_clean", label: "Fundo Infinito Clean", icon: "📸" },
    { id: "banqueta", label: "Banqueta / Cadeira Estúdio", icon: "🪑" },
    { id: "luz_revista", label: "Luz de Revista / Rim Light", icon: "💡" },
    { id: "casual_chic", label: "Look Casual Chic", icon: "🧥" },
    { id: "acessorios_moda", label: "Óculos / Joias em Destaque", icon: "🕶️" },
  ],
  casal: [
    { id: "abraco", label: "Abraço Conectado", icon: "🫂" },
    { id: "maos_dadas", label: "Mãos Dadas", icon: "🤝" },
    { id: "brinde_dois", label: "Brinde a Dois", icon: "🥂" },
    { id: "por_do_sol", label: "Pôr do Sol / Golden Hour", icon: "🌅" },
    { id: "clima_intimo", label: "Sofá / Momento Íntimo", icon: "🛋️" },
    { id: "olhar_apaixonado", label: "Olhar / Cumplicidade", icon: "💖" },
  ],
  casamento: [
    { id: "vestido_noiva", label: "Vestido de Noiva Longo", icon: "👰" },
    { id: "veu_longo", label: "Véu Longo", icon: "🕊️" },
    { id: "buque", label: "Buquê de Flores", icon: "💐" },
    { id: "aliancas", label: "Alianças em Foco", icon: "💍" },
    { id: "smoking", label: "Smoking / Terno Noivo", icon: "🤵" },
    { id: "altar_igreja", label: "Altar / Igreja", icon: "⛪" },
    { id: "pe_na_areia", label: "Pé na Areia / Praia", icon: "🏖️" },
  ],
  gestante: [
    { id: "barriga_mostra", label: "Barriga à Mostra", icon: "🤰" },
    { id: "tecido_fluido", label: "Tecido Fluido / Véu", icon: "🕊️" },
    { id: "lingerie_delicada", label: "Lingerie / Body Rendado", icon: "🤍" },
    { id: "coroa_flores", label: "Coroa de Flores", icon: "🌸" },
    { id: "sapatinho_bebe", label: "Sapatinho / Roupinha", icon: "👟" },
    { id: "acompanhada", label: "Acompanhada (Marido/Filho)", icon: "👨‍👩‍👧" },
  ],
  sensual: [
    { id: "lingerie_renda", label: "Lingerie de Renda", icon: "🖤" },
    { id: "roupao_seda", label: "Roupão de Seda", icon: "👘" },
    { id: "cama_lencois", label: "Cama / Lençóis Brancos", icon: "🛏️" },
    { id: "taca_vinho", label: "Taça de Vinho", icon: "🍷" },
    { id: "luz_penumbra", label: "Luz Penumbra / Sombras", icon: "🕯️" },
    { id: "camisa_aberta", label: "Camisa Social Aberta", icon: "👔" },
  ],
  evento: [
    { id: "natal", label: "Natal / Luzes / Pinheiro", icon: "🎄" },
    { id: "halloween", label: "Halloween / Fantasia", icon: "🎃" },
    { id: "reveillon", label: "Ano Novo / Branco e Dourado", icon: "🎆" },
    { id: "carnaval", label: "Carnaval / Brilho / Fantasia", icon: "🎭" },
    { id: "dia_das_maes", label: "Dia das Mães / Família", icon: "💐" },
  ],
  religioso: [
    { id: "crucifixo", label: "Crucifixo / Terço", icon: "✝️" },
    { id: "biblia", label: "Bíblia / Livro Sagrado", icon: "📖" },
    { id: "vestes_brancas", label: "Vestes Brancas / Batizado", icon: "🕊️" },
    { id: "velas_espirituais", label: "Velas Espirituais", icon: "🕯️" },
    { id: "comunhao", label: "Primeira Comunhão", icon: "🍞" },
  ],
  outro: [
    { id: "carro_moto", label: "Carro / Moto", icon: "🚗" },
    { id: "luzes_neon", label: "Luzes / Neon", icon: "💡" },
    { id: "instrumento_musical", label: "Instrumento Musical", icon: "🎸" },
    { id: "pet_animal", label: "Pet / Animal de Estimação", icon: "🐾" },
    { id: "natureza_livre", label: "Ao Ar Livre / Paisagem", icon: "🌿" },
  ],
};

export type CategoryQuestion =
  | { key: string; label: string; type: "choice"; options: string[] }
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "number"; placeholder?: string }
  | { key: string; label: string; type: "boolean" };

export const CATEGORY_QUESTIONS: Record<string, CategoryQuestion[]> = {
  aniversario: [
    {
      key: "idade",
      label: "Qual idade você vai completar?",
      type: "number",
      placeholder: "Ex: 30",
    },
    { key: "mostrar_idade", label: "Pode mostrar a idade/balões na foto?", type: "boolean" },
    {
      key: "pessoas",
      label: "Quantas pessoas aparecem nas fotos?",
      type: "number",
      placeholder: "Ex: 1",
    },
  ],
  estudio: [
    {
      key: "fundo",
      label: "Fundo liso ou cenário elaborado?",
      type: "choice",
      options: ["Fundo liso", "Cenário elaborado"],
    },
    {
      key: "estilo",
      label: "Qual clima combina mais com você?",
      type: "choice",
      options: ["Elegante & Sofisticado", "Moderno & Minimalista", "Casual Chic"],
    },
  ],
  casal: [
    {
      key: "proximidade",
      label: "Como vocês querem aparecer?",
      type: "choice",
      options: ["Mãos dadas", "Abraço", "Só o olhar", "Um pouco de cada"],
    },
    {
      key: "roupas",
      label: "As roupas combinam ou contrastam?",
      type: "choice",
      options: ["Combinando", "Contrastando"],
    },
    { key: "individuais", label: "Querem fotos individuais também?", type: "boolean" },
  ],
  casamento: [
    {
      key: "traje",
      label: "Que tipo de traje?",
      type: "choice",
      options: ["Civil / Casual", "Gala / Tradicional", "Praia / Pé na areia"],
    },
    { key: "veu_buque", label: "Véu e buquê aparecem?", type: "boolean" },
    {
      key: "ambiente",
      label: "Ambiente interno ou externo?",
      type: "choice",
      options: ["Interno / Salão / Altar", "Externo / Praia / Campo"],
    },
  ],
  evento: [
    {
      key: "ocasiao",
      label: "Qual é a data ou ocasião?",
      type: "text",
      placeholder: "Ex: Natal, Halloween, Dia das Mães, Ano Novo",
    },
    {
      key: "elementos",
      label: "Algum elemento típico precisa aparecer?",
      type: "text",
      placeholder: "Ex: árvore de Natal, luzes, abóboras",
    },
  ],
  gestante: [
    {
      key: "semanas",
      label: "De quantas semanas você está?",
      type: "number",
      placeholder: "Ex: 30",
    },
    { key: "barriga", label: "A barriga aparece à mostra?", type: "boolean" },
    {
      key: "acompanhado",
      label: "Alguém aparece com você?",
      type: "text",
      placeholder: "Ex: meu marido, meu filho mais velho",
    },
  ],
  corporativo: [
    {
      key: "uso",
      label: "Onde essas fotos vão ser usadas?",
      type: "choice",
      options: ["LinkedIn / Perfil profissional", "Site da empresa / Portfólio", "Material de divulgação / Palestras", "Todos"],
    },
    {
      key: "formalidade",
      label: "Quão formal deve ser?",
      type: "choice",
      options: ["Bem formal (Terno / Blazer)", "Elegante mas leve", "Descontraído (Casual chic)"],
    },
  ],
  religioso: [
    {
      key: "ocasiao",
      label: "Qual é a ocasião?",
      type: "text",
      placeholder: "Ex: batizado, primeira comunhão, celebração",
    },
    {
      key: "simbolos",
      label: "Algum símbolo precisa aparecer?",
      type: "text",
      placeholder: "Ex: terço, bíblia, vela, vestes brancas",
    },
  ],
  sensual: [
    {
      key: "intensidade",
      label: "Quanto de ousadia você quer?",
      type: "choice",
      options: ["Bem discreto & Elegante", "Sugestivo & Sensual", "Mais ousado / Intimista"],
    },
    {
      key: "ambiente",
      label: "Onde você imagina as fotos?",
      type: "choice",
      options: ["Quarto / Cama", "Estúdio", "Ao ar livre / Banho"],
    },
  ],
  outro: [
    {
      key: "descricao",
      label: "Descreva o ensaio que você imagina",
      type: "text",
      placeholder: "Conte com suas palavras o estilo e tema",
    },
  ],
};

export function labelFor(options: { value: string; label: string }[], value?: string | null) {
  if (!value) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}
