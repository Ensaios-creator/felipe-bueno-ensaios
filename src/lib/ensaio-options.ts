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
  { value: "aniversario", label: "Aniversário", icon: "🎂", hint: "Seu dia, infantil, 15 anos, casal ou empresa" },
  { value: "infantil", label: "Crianças & Bebês", icon: "🧸", hint: "Mesversário, Smash the Cake, Newborn, Temático" },
  { value: "estudio", label: "Fotos de Estúdio", icon: "📸", hint: "Fundo liso clean, editorial ou casual chic" },
  { value: "casal", label: "Casal & Romance", icon: "💍", hint: "Dois juntos, namoro, pré-wedding ou bodas" },
  { value: "casamento", label: "Casamento & Noivos", icon: "👰", hint: "Civil, gala tradicional, igreja ou praia" },
  { value: "gestante", label: "Gestante & Maternidade", icon: "🤰", hint: "A espera em imagens inesquecíveis" },
  {
    value: "corporativo",
    label: "Corporativo & Profissional",
    icon: "💼",
    hint: "Presença, autoridade e credibilidade",
  },
  { value: "religioso", label: "Religioso & Espiritual", icon: "🕊️", hint: "Batizado, comunhão e serenidade" },
  { value: "sensual", label: "Sensual & Boudoir", icon: "🍷", hint: "Sugestivo, íntimo e artístico" },
  { value: "evento", label: "Evento Especial", icon: "✨", hint: "Natal, formatura, datas comemorativas" },
  { value: "outro", label: "Outro Ensaio", icon: "🎨", hint: "Conte pra gente o que você quer" },
] as const;

export type SubtypeOption = {
  value: string;
  label: string;
  icon: string;
  hint?: string;
};

export const SESSION_SUBTYPES_MAP: Record<string, SubtypeOption[]> = {
  aniversario: [
    { value: "Meu aniversário", label: "Meu aniversário (Adulto)", icon: "🎉", hint: "Seu dia especial individual" },
    { value: "Aniversário infantil", label: "Aniversário infantil", icon: "🧸", hint: "Festa de 1 a 12 anos com decoração" },
    { value: "Aniversário 15 anos", label: "15 Anos / Debutante", icon: "👑", hint: "Gala, vestido e celebração marcante" },
    { value: "Aniversário casal", label: "Aniversário casal / Bodas", icon: "🥂", hint: "Comemoração a dois com estilo" },
    { value: "Aniversário empresarial", label: "Aniversário empresarial", icon: "🏢", hint: "Comemoração da empresa ou equipe" },
    { value: "Outro aniversário", label: "Outro estilo de aniversário", icon: "✨", hint: "Outro formato de comemoração" },
  ],
  infantil: [
    { value: "Mesversário / Acompanhamento", label: "Acompanhamento / Mesversário", icon: "🍼", hint: "Evolução mês a mês do bebê" },
    { value: "Smash the Cake / 1 Ano", label: "Smash the Cake / 1 Aninho", icon: "🎂", hint: "Bolo, diversão e primeiro aninho" },
    { value: "Criança / Temático / Fantasia", label: "Temático / Fantasia / Personagens", icon: "🦸", hint: "Heróis, princesas ou temas lúdicos" },
    { value: "Newborn / Recém-nascido", label: "Newborn / Recém-nascido", icon: "👶", hint: "Primeiros dias de vida com máxima delicadeza" },
    { value: "Irmãos / Família", label: "Irmãos / Em família", icon: "👨‍👩‍👧‍👦", hint: "Crianças com os irmãos ou pais" },
    { value: "Outro infantil", label: "Outro ensaio infantil", icon: "✨", hint: "Outro estilo para crianças" },
  ],
  estudio: [
    { value: "Fundo liso clean", label: "Fundo liso clean / Minimalista", icon: "📸", hint: "Foco total na sua postura e beleza" },
    { value: "Editorial / Moda de revista", label: "Editorial / Moda de revista", icon: "💎", hint: "Iluminação de passarela e glamour" },
    { value: "Casual chic", label: "Casual chic / Retrato autoral", icon: "🧥", hint: "Moderno, elegante e descontraído" },
    { value: "Cenário decorado", label: "Cenário decorado", icon: "🪑", hint: "Poltrona, luzes e elementos de estúdio" },
  ],
  casal: [
    { value: "Namoro / Pré-Wedding", label: "Namoro / Pré-Wedding", icon: "💍", hint: "Noivado, aliança e expectativa do casamento" },
    { value: "Romântico / Intimista", label: "Romântico / Intimista", icon: "💖", hint: "Abraços, conexão e carinho" },
    { value: "Casual ao ar livre", label: "Casual ao ar livre / Pôr do sol", icon: "🌅", hint: "Golden hour, praia ou campo" },
    { value: "Bodas / Comemoração", label: "Bodas / Comemoração a dois", icon: "🥂", hint: "Celebração de anos juntos" },
  ],
  casamento: [
    { value: "Civil / Cartório", label: "Civil / Cartório", icon: "📄", hint: "Traje elegante, leve e contemporâneo" },
    { value: "Gala / Tradicional / Igreja", label: "Gala / Igreja / Tradicional", icon: "⛪", hint: "Vestido de noiva clássico, smoking e véu" },
    { value: "Praia / Campo / Pé na areia", label: "Praia / Campo / Ao ar livre", icon: "🏖️", hint: "Leveza, natureza e pôr do sol" },
    { value: "Pré ou Pós Wedding", label: "Ensaio Pré / Pós Wedding", icon: "🕊️", hint: "Fotos artísticas dos noivos com calma" },
  ],
  gestante: [
    { value: "Individual / Barriga em destaque", label: "Individual / Barriga em destaque", icon: "🤰", hint: "A mãe e a espera do bebê" },
    { value: "Com o marido / Em família", label: "Com o marido / Em família", icon: "👨‍👩‍👧", hint: "Amor compartilhado pelo bebê que vai chegar" },
    { value: "Tecido fluido / Véu artístico", label: "Tecido fluido / Artístico", icon: "🕊️", hint: "Tecidos voando e poses esculturais" },
    { value: "Lingerie / Body rendado", label: "Lingerie / Body delicado", icon: "🤍", hint: "Intimista, suave e elegante" },
  ],
  corporativo: [
    { value: "Executivo / Formal", label: "Executivo formal / Terno / Blazer", icon: "💼", hint: "Autoridade e alta liderança" },
    { value: "Casual business / Tech", label: "Casual business / Moderno", icon: "💻", hint: "Startup, consultoria e negócios dinâmicos" },
    { value: "Médicos / Saúde / Estética", label: "Médicos / Saúde / Estética", icon: "🩺", hint: "Jaleco, clínica ou consultório" },
    { value: "Advogados / Jurídico", label: "Advogados / Jurídico", icon: "⚖️", hint: "Credibilidade e postura clássica" },
    { value: "Criativos / Palestrantes / Coaches", label: "Criativos / Palestrantes / Autores", icon: "🎤", hint: "Carisma, expressão e presença de palco" },
  ],
  religioso: [
    { value: "Batizado", label: "Batizado", icon: "🕊️", hint: "Vestes brancas, vela e bênção" },
    { value: "Primeira comunhão / Crisma", label: "Primeira Comunhão / Crisma", icon: "🍞", hint: "Celebração sagrada" },
    { value: "Espiritual / Oração / Fé", label: "Espiritual / Oração / Fé", icon: "✝️", hint: "Bíblia, terço, serenidade e devoção" },
  ],
  sensual: [
    { value: "Discreto & Elegante", label: "Discreto & Elegante", icon: "✨", hint: "Sugestivo, sofisticado e artístico" },
    { value: "Lingerie & Renda", label: "Lingerie de renda", icon: "🖤", hint: "Sensualidade marcante" },
    { value: "Intimista / Quarto", label: "Intimista / Cama / Lençóis", icon: "🛏️", hint: "Conforto e clima intimista" },
    { value: "Silhueta & Sombras", label: "Silhueta & Penumbra", icon: "🕯️", hint: "Luz dramática e mistério" },
  ],
  evento: [
    { value: "Natal / Fim de ano", label: "Natal / Ano Novo", icon: "🎄", hint: "Árvore de natal, luzes e celebração" },
    { value: "Formatura", label: "Formatura / Colação", icon: "🎓", hint: "Beca, diploma e conquista" },
    { value: "Halloween / Fantasia", label: "Halloween / Fantasia", icon: "🎃", hint: "Temático, sombrio ou divertido" },
    { value: "Dia das Mães / Pais / Família", label: "Datas familiares comemorativas", icon: "💐", hint: "União e carinho familiar" },
  ],
  outro: [
    { value: "Personalizado", label: "Ensaio personalizado livre", icon: "🎨", hint: "Criamos a atmosfera exata que você descrever" },
  ],
};

export const BIRTHDAY_SUBTYPES = SESSION_SUBTYPES_MAP['aniversario'];

export const FRAMING_OPTIONS = [
  { value: "corpo-inteiro", label: "Corpo inteiro", icon: "🧍", hint: "Aparece o look completo da cabeça aos pés" },
  { value: "cintura", label: "Da cintura para cima", icon: "👤", hint: "Ideal para destacar roupas e expressões" },
  { value: "rosto-ombros", label: "Rosto e ombros", icon: "🤳", hint: "Foco total na sua beleza, maquiagem e olhar" },
  { value: "variar", label: "Variar entre as fotos", icon: "🔄", hint: "Algumas de corpo inteiro e outras mais aproximadas" },
];

export const OUTFIT_MODES = [
  { value: "fixa", label: "Uma roupa só em todas as fotos", icon: "👗", hint: "O mesmo look e estilo em todo o ensaio" },
  { value: "variar", label: "Variar a roupa entre as fotos", icon: "👚", hint: "Looks e peças diferentes entre as fotos" },
];

export const SCENARIO_MODES = [
  { value: "fixo", label: "Um cenário só em todas as fotos", icon: "🏛️", hint: "Todas as fotos no mesmo ambiente e decoração" },
  { value: "variar", label: "Variar o cenário entre as fotos", icon: "🎨", hint: "Cenários e atmosferas diferentes entre as fotos" },
];

export const EXPRESSION_OPTIONS = [
  {
    value: "sorrindo-suave",
    label: "Sorriso leve e natural",
    icon: "😊",
    hint: "Suave, acolhedor, autêntico e elegante",
  },
  {
    value: "sorrindo-dentes",
    label: "Sorrindo mostrando os dentes",
    icon: "😁",
    hint: "Alegre, radiante, espontâneo e festivo",
  },
  {
    value: "serio",
    label: "Sério / Marcante / Editorial",
    icon: "😐",
    hint: "Olhar penetrante, presença forte e ar sofisticado",
  },
  {
    value: "variar",
    label: "Variar expressões entre as fotos",
    icon: "✨",
    hint: "Algumas fotos sorrindo e outras mais sérias/marcantes",
  },
];

export const MAKEUP_OPTIONS = [
  { value: "natural", label: "Natural", icon: "🌸", hint: "Leve, pele bonita e cores suaves" },
  { value: "marcante", label: "Marcante", icon: "💄", hint: "Mais cor, olho definido, batom forte" },
  { value: "nao-quero", label: "Não quero maquiagem", icon: "✨", hint: "Rosto o mais natural possível" },
];

export const HAIR_OPTIONS = [
  { value: "solto", label: "Solto", icon: "💇‍♀️" },
  { value: "preso", label: "Preso", icon: "👱‍♀️" },
  { value: "penteado", label: "Um penteado específico", icon: "👑" },
  { value: "manter", label: "Manter como está nas fotos que vou enviar", icon: "✨" },
];

export const MOOD_OPTIONS = [
  { value: "natural", label: "Luz natural", icon: "☀️", hint: "Como um fim de tarde bonito" },
  { value: "dramatica", label: "Dramática", icon: "🕯️", hint: "Sombras marcadas, muito contraste" },
  { value: "suave", label: "Suave", icon: "🌤️", hint: "Tudo bem iluminado e delicado" },
  { value: "cinematografica", label: "Cinematográfica", icon: "🎬", hint: "Cara de cena de filme" },
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
  infantil: [
    { id: "brinquedo", label: "Brinquedos / Ursinho", icon: "🧸" },
    { id: "bolo_infantil", label: "Bolo / Smash the cake", icon: "🎂", setCake: true },
    { id: "baloes_infantis", label: "Balões Coloridos", icon: "🎈", setAgeNumber: true },
    { id: "fantasia", label: "Fantasia / Personagem", icon: "🦸" },
    { id: "newborn_cesta", label: "Cestinha / Manta Newborn", icon: "👶" },
    { id: "coroa_infantil", label: "Coroa / Tiara Infantil", icon: "👑" },
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
  infantil: [
    {
      key: "idade_crianca",
      label: "Qual a idade da criança / bebê?",
      type: "text",
      placeholder: "Ex: 6 meses, 1 aninho, 4 anos...",
    },
    {
      key: "tema_infantil",
      label: "Tem algum tema ou personagem favorito?",
      type: "text",
      placeholder: "Ex: Safari, Princesas, Ursinho, Carros, Cores pastel...",
    },
    {
      key: "pessoas",
      label: "Quantas crianças ou pessoas aparecem?",
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

// ─── MOTOR DE REGRAS DE SUBNICHOS E FILTRAGEM COMBINATÓRIA ──────────────────

export interface SubtypeFilterRule {
  subtypeValue: string;
  parentSessionType: string;
  positiveKeywords: string[];
  preferredSessionTypes?: string[];
  negativeKeywords?: string[];
  negativeSessionTypes?: string[];
  minPeopleCount?: number;
  maxPeopleCount?: number;
  exactPeopleCount?: number;
  requiredGender?: "feminino" | "masculino" | "misto";
  excludedGenders?: ("feminino" | "masculino" | "misto")[];
  preferredAmbiances?: string[];
  excludedAmbiances?: string[];
  requiresCake?: boolean;
  requiresAgeNumber?: boolean;
}

export const SUBTYPE_RULES: SubtypeFilterRule[] = [
  // ── ANIVERSÁRIO ──────────────────────────────────────────────────────────
  {
    subtypeValue: "Meu aniversário",
    parentSessionType: "aniversario",
    positiveKeywords: [
      "adulto", "champanhe", "taça", "taca", "gala", "glamour", "mulher", "homem",
      "vinho", "festa adulta", "comemoração", "comemoracao", "balões dourados",
      "baloes dourados", "balões prateados", "baloes prateados", "salto alto"
    ],
    preferredSessionTypes: ["aniversario", "estudio"],
    negativeKeywords: [
      "infantil", "criança", "crianca", "bebê", "bebe", "kids", "smash the cake",
      "smash", "mesversário", "mesversario", "newborn", "brinquedo", "15 anos",
      "debutante", "bodas", "urso", "ursinho"
    ],
    negativeSessionTypes: ["infantil"],
    maxPeopleCount: 1,
  },
  {
    subtypeValue: "Aniversário infantil",
    parentSessionType: "aniversario",
    positiveKeywords: [
      "infantil", "criança", "crianca", "bebê", "bebe", "kids", "1 ano", "2 anos",
      "3 anos", "4 anos", "5 anos", "6 anos", "7 anos", "8 anos", "9 anos", "10 anos",
      "11 anos", "12 anos", "brinquedo", "mesversário", "mesversario", "smash",
      "smash the cake", "balões coloridos", "baloes coloridos", "bolo infantil",
      "ursinho", "fantasia", "tema infantil", "aniversário infantil", "aniversario infantil"
    ],
    preferredSessionTypes: ["aniversario", "infantil"],
    negativeKeywords: [
      "champanhe", "taça de champanhe", "taca de champanhe", "vinho", "taça de vinho",
      "sensual", "boudoir", "lingerie", "executivo", "blazer", "smoking", "noiva",
      "gala adulto", "gala adulta", "salto alto", "casamento", "bodas", "corporativo"
    ],
    negativeSessionTypes: ["sensual", "corporativo", "casamento"],
  },
  {
    subtypeValue: "Aniversário 15 anos",
    parentSessionType: "aniversario",
    positiveKeywords: [
      "15 anos", "debutante", "15", "coroa", "tiara", "vestido de gala", "vestido de debutante",
      "valsa", "princesa", "gala", "brilho", "quinze anos"
    ],
    preferredSessionTypes: ["aniversario"],
    negativeKeywords: [
      "bebe", "bebê", "criança pequena", "crianca pequena", "smash the cake", "smash",
      "newborn", "mesversário", "mesversario", "bodas", "corporativo", "executivo", "jaleco"
    ],
    negativeSessionTypes: ["corporativo"],
  },
  {
    subtypeValue: "Aniversário casal",
    parentSessionType: "aniversario",
    positiveKeywords: [
      "casal", "bodas", "romântico", "romantico", "dois", "brinde a dois", "namorados",
      "parceiro", "marido", "esposa", "comemoração a dois"
    ],
    preferredSessionTypes: ["aniversario", "casal"],
    minPeopleCount: 2,
    negativeKeywords: [
      "bebe", "bebê", "infantil", "smash the cake", "newborn", "15 anos", "debutante"
    ],
  },
  {
    subtypeValue: "Aniversário empresarial",
    parentSessionType: "aniversario",
    positiveKeywords: [
      "corporativo", "empresa", "equipe", "escritório", "escritorio",
      "comemoração da empresa", "negócios", "trabalho"
    ],
    preferredSessionTypes: ["aniversario", "corporativo"],
    negativeKeywords: [
      "infantil", "bebe", "bebê", "sensual", "lingerie", "debutante", "15 anos", "noiva"
    ],
  },
  {
    subtypeValue: "Outro aniversário",
    parentSessionType: "aniversario",
    positiveKeywords: ["aniversario", "aniversário", "baloes", "bolo", "festa"],
    preferredSessionTypes: ["aniversario"],
  },

  // ── INFANTIL ─────────────────────────────────────────────────────────────
  {
    subtypeValue: "Mesversário / Acompanhamento",
    parentSessionType: "infantil",
    positiveKeywords: [
      "mesversario", "mesversário", "acompanhamento", "meses", "bebe", "bebê",
      "manta", "fofo", "newborn", "pequeno", "cesta"
    ],
    preferredSessionTypes: ["infantil"],
    negativeKeywords: ["adulto", "corporativo", "sensual", "casamento", "15 anos", "debutante", "champanhe"],
  },
  {
    subtypeValue: "Smash the Cake / 1 Ano",
    parentSessionType: "infantil",
    positiveKeywords: [
      "smash the cake", "smash", "1 ano", "1 aninho", "primeiro aninho", "bolo",
      "lambuzar", "confeito", "bolo infantil"
    ],
    preferredSessionTypes: ["infantil", "aniversario"],
    negativeKeywords: ["adulto", "corporativo", "sensual", "casamento", "champanhe"],
  },
  {
    subtypeValue: "Criança / Temático / Fantasia",
    parentSessionType: "infantil",
    positiveKeywords: [
      "fantasia", "personagem", "heroi", "herói", "super-heroi", "princesa",
      "tematico", "temático", "ludico", "lúdico", "desenho", "crianca", "criança",
      "ursinho", "safari"
    ],
    preferredSessionTypes: ["infantil"],
    negativeKeywords: ["adulto", "corporativo", "sensual", "casamento"],
  },
  {
    subtypeValue: "Newborn / Recém-nascido",
    parentSessionType: "infantil",
    positiveKeywords: [
      "newborn", "recem-nascido", "recém-nascido", "cesta", "manta", "dormindo",
      "primeiros dias", "bebe", "bebê", "delicado"
    ],
    preferredSessionTypes: ["infantil"],
    negativeKeywords: ["adulto", "criança grande", "10 anos", "15 anos", "corporativo", "sensual", "champanhe"],
  },
  {
    subtypeValue: "Irmãos / Família",
    parentSessionType: "infantil",
    positiveKeywords: [
      "irmaos", "irmãos", "familia", "família", "pais", "crianças e pais", "dupla infantil"
    ],
    preferredSessionTypes: ["infantil"],
    minPeopleCount: 2,
    negativeKeywords: ["sensual", "boudoir", "lingerie"],
  },
  {
    subtypeValue: "Outro infantil",
    parentSessionType: "infantil",
    positiveKeywords: ["infantil", "criança", "crianca", "bebe", "bebê"],
    preferredSessionTypes: ["infantil"],
  },

  // ── ESTÚDIO ──────────────────────────────────────────────────────────────
  {
    subtypeValue: "Fundo liso clean",
    parentSessionType: "estudio",
    positiveKeywords: [
      "fundo liso", "clean", "minimalista", "fundo infinito", "estúdio", "estudio",
      "ciclorama", "fundo neutro", "fundo cinza", "fundo branco", "fundo preto"
    ],
    preferredAmbiances: ["estudio"],
    preferredSessionTypes: ["estudio"],
  },
  {
    subtypeValue: "Editorial / Moda de revista",
    parentSessionType: "estudio",
    positiveKeywords: [
      "editorial", "moda", "revista", "rim light", "passarela", "glamour",
      "high fashion", "iluminação de revista", "luz de recorte", "dramático"
    ],
    preferredSessionTypes: ["estudio"],
  },
  {
    subtypeValue: "Casual chic",
    parentSessionType: "estudio",
    positiveKeywords: [
      "casual chic", "descontraído", "descontraido", "moderno", "casual",
      "elegante", "autoral", "jaqueta", "blazer leve"
    ],
    preferredSessionTypes: ["estudio"],
  },
  {
    subtypeValue: "Cenário decorado",
    parentSessionType: "estudio",
    positiveKeywords: [
      "cenario decorado", "cenário decorado", "poltrona", "cadeira",
      "luzes de estúdio", "elementos de estúdio", "cenografia"
    ],
    preferredAmbiances: ["decorado", "estudio"],
    preferredSessionTypes: ["estudio"],
  },

  // ── CASAL ────────────────────────────────────────────────────────────────
  {
    subtypeValue: "Namoro / Pré-Wedding",
    parentSessionType: "casal",
    positiveKeywords: [
      "namoro", "pre-wedding", "pré-wedding", "noivado", "aliança", "alianca", "alianças"
    ],
    preferredSessionTypes: ["casal", "casamento"],
    minPeopleCount: 2,
  },
  {
    subtypeValue: "Romântico / Intimista",
    parentSessionType: "casal",
    positiveKeywords: [
      "romantico", "romântico", "intimista", "abraço", "abraco", "carinho",
      "beijo", "afeto", "olhar apaixonado", "conexão", "cumplicidade"
    ],
    preferredSessionTypes: ["casal"],
    minPeopleCount: 2,
  },
  {
    subtypeValue: "Casual ao ar livre",
    parentSessionType: "casal",
    positiveKeywords: [
      "ao ar livre", "ar livre", "praia", "campo", "golden hour", "pôr do sol",
      "por do sol", "natureza", "parque", "gramado"
    ],
    preferredAmbiances: ["natureza", "externo"],
    preferredSessionTypes: ["casal"],
    minPeopleCount: 2,
  },
  {
    subtypeValue: "Bodas / Comemoração",
    parentSessionType: "casal",
    positiveKeywords: [
      "bodas", "comemoração", "comemoracao", "brinde", "anos juntos",
      "bodas de prata", "bodas de ouro", "champanhe a dois"
    ],
    preferredSessionTypes: ["casal", "aniversario"],
    minPeopleCount: 2,
  },

  // ── CASAMENTO ────────────────────────────────────────────────────────────
  {
    subtypeValue: "Civil / Cartório",
    parentSessionType: "casamento",
    positiveKeywords: [
      "civil", "cartório", "cartorio", "terno claro", "vestido civil",
      "minimalista", "moderno", "traje leve", "vestido curto ou midi"
    ],
    preferredSessionTypes: ["casamento"],
    negativeKeywords: ["igreja tradicional", "altar de igreja", "véu de 5 metros", "catedral"],
  },
  {
    subtypeValue: "Gala / Tradicional / Igreja",
    parentSessionType: "casamento",
    positiveKeywords: [
      "gala", "tradicional", "igreja", "altar", "véu longo", "veu longo", "véu",
      "vestido de noiva", "smoking", "buquê", "buque", "clássico", "classico", "catedral"
    ],
    preferredSessionTypes: ["casamento"],
    negativeKeywords: ["praia descalço", "pé na areia", "casual tech"],
  },
  {
    subtypeValue: "Praia / Campo / Pé na areia",
    parentSessionType: "casamento",
    positiveKeywords: [
      "praia", "campo", "pé na areia", "pe na areia", "pôr do sol", "por do sol",
      "ao ar livre", "natureza", "vestido fluido", "leveza"
    ],
    preferredAmbiances: ["natureza", "externo"],
    preferredSessionTypes: ["casamento"],
  },
  {
    subtypeValue: "Pré ou Pós Wedding",
    parentSessionType: "casamento",
    positiveKeywords: [
      "pre wedding", "pré wedding", "pos wedding", "pós wedding",
      "ensaio dos noivos", "artístico", "vestido de noiva com calma"
    ],
    preferredSessionTypes: ["casamento", "casal"],
  },

  // ── GESTANTE ─────────────────────────────────────────────────────────────
  {
    subtypeValue: "Individual / Barriga em destaque",
    parentSessionType: "gestante",
    positiveKeywords: [
      "individual", "barriga em destaque", "barriga à mostra", "barriga a mostra",
      "barriga", "mãe solo", "espera do bebê"
    ],
    preferredSessionTypes: ["gestante"],
    exactPeopleCount: 1,
    requiredGender: "feminino",
    negativeKeywords: ["com marido", "em família", "com filho mais velho", "casal"],
  },
  {
    subtypeValue: "Com o marido / Em família",
    parentSessionType: "gestante",
    positiveKeywords: [
      "marido", "família", "familia", "filho", "acompanhada", "casal",
      "mãos na barriga", "abraço na barriga"
    ],
    preferredSessionTypes: ["gestante", "casal"],
    minPeopleCount: 2,
  },
  {
    subtypeValue: "Tecido fluido / Véu artístico",
    parentSessionType: "gestante",
    positiveKeywords: [
      "tecido fluido", "tecido", "véu artístico", "veu artistico", "véu",
      "voando", "escultural", "artístico", "poses esculturais", "tecido voando"
    ],
    preferredSessionTypes: ["gestante"],
  },
  {
    subtypeValue: "Lingerie / Body rendado",
    parentSessionType: "gestante",
    positiveKeywords: [
      "lingerie", "body", "renda", "rendado", "body delicado", "intimista", "suave", "elegante", "branco"
    ],
    preferredSessionTypes: ["gestante", "sensual"],
  },

  // ── CORPORATIVO ──────────────────────────────────────────────────────────
  {
    subtypeValue: "Executivo / Formal",
    parentSessionType: "corporativo",
    positiveKeywords: [
      "executivo", "formal", "terno", "blazer", "gravata", "alta liderança",
      "liderança", "diretoria", "corporativo clássico", "postura de poder"
    ],
    preferredSessionTypes: ["corporativo"],
    negativeKeywords: ["jaleco", "estetoscópio", "festa", "balões", "sensual", "lingerie", "infantil", "bebe"],
  },
  {
    subtypeValue: "Casual business / Tech",
    parentSessionType: "corporativo",
    positiveKeywords: [
      "casual business", "tech", "startup", "notebook", "laptop", "moderno",
      "descontraído", "descontraido", "camisa sem gravata", "consultoria"
    ],
    preferredSessionTypes: ["corporativo"],
    negativeKeywords: ["jaleco", "estetoscópio", "sensual", "lingerie", "infantil"],
  },
  {
    subtypeValue: "Médicos / Saúde / Estética",
    parentSessionType: "corporativo",
    positiveKeywords: [
      "médico", "medico", "médica", "medica", "saúde", "saude", "estética", "estetica",
      "jaleco", "clínica", "clinica", "consultório", "consultorio", "estetoscópio",
      "estetoscopio", "dentista", "biomédica", "biomedica", "dermatologista",
      "nutricionista", "hospital", "saúde e estética", "jaleco branco"
    ],
    preferredSessionTypes: ["corporativo"],
    negativeKeywords: ["sensual", "lingerie", "festa infantil", "balões de aniversário", "baloes"],
  },
  {
    subtypeValue: "Advogados / Jurídico",
    parentSessionType: "corporativo",
    positiveKeywords: [
      "advogado", "advogada", "jurídico", "juridico", "direito", "oab", "tribunal",
      "escritório", "escritorio", "biblioteca", "livros", "postura clássica", "advocacia"
    ],
    preferredSessionTypes: ["corporativo"],
    negativeKeywords: ["jaleco", "estetoscópio", "sensual", "lingerie", "festa infantil", "balões"],
  },
  {
    subtypeValue: "Criativos / Palestrantes / Coaches",
    parentSessionType: "corporativo",
    positiveKeywords: [
      "palestrante", "coach", "autor", "autora", "criativo", "criativa", "microfone",
      "palco", "expressivo", "carisma", "gestos", "livro autoral", "workshop"
    ],
    preferredSessionTypes: ["corporativo"],
    negativeKeywords: ["jaleco", "estetoscópio", "sensual", "lingerie", "infantil"],
  },

  // ── RELIGIOSO ────────────────────────────────────────────────────────────
  {
    subtypeValue: "Batizado",
    parentSessionType: "religioso",
    positiveKeywords: [
      "batizado", "vestes brancas", "vela", "bênção", "bencao", "água benta",
      "agua benta", "bebê", "bebe", "criança", "padrinhos"
    ],
    preferredSessionTypes: ["religioso", "infantil"],
  },
  {
    subtypeValue: "Primeira comunhão / Crisma",
    parentSessionType: "religioso",
    positiveKeywords: [
      "primeira comunhão", "primeira comunhao", "comunhão", "crisma",
      "sagrado", "eucaristia", "hóstia", "vela da comunhão"
    ],
    preferredSessionTypes: ["religioso", "infantil"],
  },
  {
    subtypeValue: "Espiritual / Oração / Fé",
    parentSessionType: "religioso",
    positiveKeywords: [
      "oração", "oracao", "fé", "fe", "bíblia", "biblia", "terço", "terco",
      "crucifixo", "serenidade", "devoção", "devocional", "meditação"
    ],
    preferredSessionTypes: ["religioso"],
  },

  // ── SENSUAL ──────────────────────────────────────────────────────────────
  {
    subtypeValue: "Discreto & Elegante",
    parentSessionType: "sensual",
    positiveKeywords: [
      "discreto", "elegante", "sofisticado", "sugestivo", "penumbra", "camisa aberta", "arte", "sutil"
    ],
    preferredSessionTypes: ["sensual", "estudio"],
  },
  {
    subtypeValue: "Lingerie & Renda",
    parentSessionType: "sensual",
    positiveKeywords: [
      "lingerie", "renda", "body rendado", "sensualidade", "preto", "rendado", "lingerie de renda", "marcante"
    ],
    preferredSessionTypes: ["sensual"],
  },
  {
    subtypeValue: "Intimista / Quarto",
    parentSessionType: "sensual",
    positiveKeywords: [
      "quarto", "cama", "lençóis", "lencois", "intimista", "roupão", "roupao", "conforto", "lençóis brancos", "seda"
    ],
    preferredAmbiances: ["interno"],
    preferredSessionTypes: ["sensual"],
  },
  {
    subtypeValue: "Silhueta & Sombras",
    parentSessionType: "sensual",
    positiveKeywords: [
      "silhueta", "sombras", "penumbra", "luz dramática", "luz dramatica", "mistério", "misterio", "claroscuro", "luz de recorte"
    ],
    preferredSessionTypes: ["sensual", "estudio"],
  },

  // ── EVENTO ───────────────────────────────────────────────────────────────
  {
    subtypeValue: "Natal / Fim de ano",
    parentSessionType: "evento",
    positiveKeywords: [
      "natal", "árvore de natal", "arvore de natal", "ano novo", "reveillon",
      "réveillon", "luzes de natal", "pinheiro", "festas de fim de ano", "vermelho e dourado"
    ],
    preferredSessionTypes: ["evento"],
  },
  {
    subtypeValue: "Formatura",
    parentSessionType: "evento",
    positiveKeywords: [
      "formatura", "colação", "colacao", "beca", "diploma", "capelo", "conquista", "formando", "formanda"
    ],
    preferredSessionTypes: ["evento", "corporativo"],
  },
  {
    subtypeValue: "Halloween / Fantasia",
    parentSessionType: "evento",
    positiveKeywords: [
      "halloween", "abóbora", "abobora", "fantasia", "sombrio", "temático", "tematico", "bruxa", "vampiro"
    ],
    preferredSessionTypes: ["evento"],
  },
  {
    subtypeValue: "Dia das Mães / Pais / Família",
    parentSessionType: "evento",
    positiveKeywords: [
      "dia das mães", "dia das maes", "dia dos pais", "família", "familia",
      "união", "uniao", "carinho familiar", "gerações"
    ],
    preferredSessionTypes: ["evento", "casal", "infantil"],
  },
];

function normalizeText(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Motor Inteligente de Filtragem e Classificação de Referências.
 * Combina nicho principal, subtipo escolhido, respostas contextuais e tags
 * para retornar apenas as referências visualmente corretas e relevantes.
 */
export function filterAndRankCatalogItems<T extends {
  id: string;
  sessionTypes: string[];
  tags?: string[];
  style?: string | null;
  vibe?: string | null;
  ambiance?: string | null;
  peopleCount?: number | null;
  gender?: string | null;
  hasCake?: boolean;
  hasAgeNumber?: boolean;
  position: number;
}>(params: {
  catalog: T[];
  sessionType: string | null;
  sessionSubtype?: string | null;
  categoryAnswers?: Record<string, unknown>;
}): T[] {
  const { catalog, sessionType, sessionSubtype, categoryAnswers = {} } = params;

  if (!sessionType) return catalog;

  const normalizedSessionType = normalizeText(sessionType);
  const normalizedSubtype = normalizeText(sessionSubtype);

  // Encontra a regra do subtipo selecionado com matching bidirecional
  const activeRule = SUBTYPE_RULES.find(
    (r) =>
      normalizeText(r.parentSessionType) === normalizedSessionType &&
      (normalizedSubtype
        ? normalizeText(r.subtypeValue) === normalizedSubtype ||
          normalizedSubtype.includes(normalizeText(r.subtypeValue)) ||
          normalizeText(r.subtypeValue).includes(normalizedSubtype)
        : false)
  );

  type ScoredItem = {
    item: T;
    score: number;
    isTier1Match: boolean;
    isCompatible: boolean;
  };

  const scoredList: ScoredItem[] = [];

  for (const item of catalog) {
    const itemAny = item as Record<string, unknown>;
    const rawTypes = (
      (item.sessionTypes ?? (itemAny["session_types"] as string[] | undefined) ?? [])
    ).map((t) => normalizeText(t));

    const rawTags = (
      (item.tags ?? (itemAny["tags"] as string[] | undefined) ?? [])
    ).map((t) => normalizeText(t));

    const rawStyle = normalizeText(item.style ?? (itemAny["style"] as string | null | undefined));
    const rawVibe = normalizeText(item.vibe ?? (itemAny["vibe"] as string | null | undefined));
    const rawAmbiance = normalizeText(item.ambiance ?? (itemAny["ambiance"] as string | null | undefined));
    const rawGender = normalizeText(item.gender ?? (itemAny["gender"] as string | null | undefined));
    const peopleCount = (item.peopleCount ?? (itemAny["people_count"] as number | null | undefined)) ?? null;
    const hasCake = Boolean(item.hasCake ?? itemAny["has_cake"]);
    const hasAgeNumber = Boolean(item.hasAgeNumber ?? itemAny["has_age_number"]);

    const allTokens = [...rawTags, rawStyle, rawVibe, ...rawTypes];

    // 1. VERIFICAÇÃO DE EXCLUSÃO RÍGIDA (Hard Exclusions)
    let isExcluded = false;

    // Regras de exclusão do subtipo ativo
    if (activeRule) {
      if (activeRule.negativeSessionTypes?.some((negType) => rawTypes.includes(normalizeText(negType)))) {
        isExcluded = true;
      }
      if (activeRule.negativeKeywords?.some((negKw) => {
        const normNeg = normalizeText(negKw);
        return allTokens.some((tok) => tok.includes(normNeg));
      })) {
        isExcluded = true;
      }
      if (activeRule.excludedGenders?.some((g) => normalizeText(g) === rawGender)) {
        isExcluded = true;
      }
      if (activeRule.excludedAmbiances?.some((a) => normalizeText(a) === rawAmbiance)) {
        isExcluded = true;
      }
      if (activeRule.maxPeopleCount !== undefined && peopleCount && peopleCount > activeRule.maxPeopleCount) {
        if (activeRule.maxPeopleCount === 1 && peopleCount > 1) isExcluded = true;
      }
      if (activeRule.exactPeopleCount !== undefined && peopleCount && peopleCount !== activeRule.exactPeopleCount) {
        isExcluded = true;
      }
    }

    // Exclusão entre nichos incompatíveis (ex: fotos puramente sensuais nunca vão para infantil/religioso)
    if (normalizedSessionType === "infantil" || (normalizedSessionType === "aniversario" && normalizedSubtype.includes("infantil"))) {
      if (rawTypes.includes("sensual") || rawTags.some((t) => t.includes("lingerie") || t.includes("champanhe") || t.includes("boudoir"))) {
        isExcluded = true;
      }
    }
    if (normalizedSessionType === "religioso") {
      if (rawTypes.includes("sensual") || rawTags.some((t) => t.includes("lingerie") || t.includes("boudoir"))) {
        isExcluded = true;
      }
    }
    if (normalizedSessionType === "corporativo") {
      if (rawTypes.includes("sensual") || rawTags.some((t) => t.includes("smash the cake") || t.includes("lingerie"))) {
        isExcluded = true;
      }
    }

    if (isExcluded) continue;

    // 2. CÁLCULO DE RELEVÂNCIA E CLASSIFICAÇÃO EM TIERS
    let score = 100;
    let isTier1Match = false;

    // Match no Tipo Principal
    const hasPrimaryTypeMatch = rawTypes.includes(normalizedSessionType);
    if (hasPrimaryTypeMatch) {
      score += 60;
    }

    // Match de Subtipo
    if (activeRule) {
      // Sinais Positivos do Subtipo
      const positiveMatches = activeRule.positiveKeywords.filter((posKw) => {
        const normPos = normalizeText(posKw);
        return allTokens.some((tok) => tok.includes(normPos));
      });

      const typeMatches = (activeRule.preferredSessionTypes || []).filter((prefType) =>
        rawTypes.includes(normalizeText(prefType))
      );

      if (positiveMatches.length > 0 || typeMatches.length > 1) {
        isTier1Match = true;
        score += 100 + positiveMatches.length * 25;
      }

      if (activeRule.minPeopleCount && peopleCount && peopleCount >= activeRule.minPeopleCount) {
        score += 30;
      }
      if (activeRule.requiredGender && rawGender === normalizeText(activeRule.requiredGender)) {
        score += 30;
      }
      if (activeRule.preferredAmbiances && activeRule.preferredAmbiances.map(normalizeText).includes(rawAmbiance)) {
        score += 25;
      }
    } else {
      // Se não há regra específica, qualquer item do tipo principal é Tier 1
      if (hasPrimaryTypeMatch) isTier1Match = true;
    }

    // 3. PONTUAÇÃO DE PERGUNTAS ESPECÍFICAS DA CATEGORIA
    if (categoryAnswers["mostrar_idade"] === true && hasAgeNumber) {
      score += 40;
    }
    if (hasCake && (normalizedSubtype.includes("smash") || normalizedSubtype.includes("bolo") || categoryAnswers["mostrar_idade"])) {
      score += 35;
    }
    if (categoryAnswers["fundo"] === "Fundo liso" && rawAmbiance === "estudio") {
      score += 30;
    } else if (categoryAnswers["fundo"] === "Cenário elaborado" && (rawAmbiance === "decorado" || rawAmbiance === "interno")) {
      score += 30;
    }

    // Compatibilidade com o nicho
    const isCompatible = hasPrimaryTypeMatch || isTier1Match;

    if (isTier1Match || isCompatible) {
      scoredList.push({
        item,
        score,
        isTier1Match,
        isCompatible,
      });
    }
  }

  // 4. DIVISÃO EM TIERS E RETORNO
  const tier1Items = scoredList.filter((s) => s.isTier1Match);
  const tier2Compatible = scoredList.filter((s) => !s.isTier1Match && s.isCompatible);

  // Se tivermos itens suficientes no Tier 1 (Match Exato de Subnicho), usamos apenas eles!
  // Se forem poucos (menos de 6), mesclamos com o Tier 2 compatível ordenado por pontuação
  let finalPool: ScoredItem[];
  if (tier1Items.length >= 6 || !sessionSubtype) {
    finalPool = tier1Items;
  } else if (tier1Items.length > 0) {
    finalPool = [...tier1Items, ...tier2Compatible];
  } else {
    // Se não há match direto de subtipo cadastrado no catálogo, usa todas as compatíveis
    finalPool = tier2Compatible.length > 0 ? tier2Compatible : scoredList;
  }

  // Se o catálogo estiver vazio para este nicho, fallback seguro para estúdio neutro
  if (finalPool.length === 0) {
    const studioFallbacks = catalog.filter(
      (img) =>
        (img.sessionTypes || []).some((t) => normalizeText(t) === "estudio") ||
        (img.sessionTypes || []).length === 0
    );
    return studioFallbacks;
  }

  finalPool.sort((a, b) => b.score - a.score || a.item.position - b.item.position);
  return finalPool.map((s) => s.item);
}
