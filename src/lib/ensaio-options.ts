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

export const BIRTHDAY_SUBTYPES = SESSION_SUBTYPES_MAP.aniversario;

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
