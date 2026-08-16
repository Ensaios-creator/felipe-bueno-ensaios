# Configurador de Ensaios por IA + Painel Admin — Plano de Construção

Projeto novo (template limpo). Plano do zero até 100% do MVP descrito na especificação, em 6 fases entregáveis.

---

## Fase 0 — Fundação e identidade visual

- Ativar o backend (Lovable Cloud) para banco, login do admin e armazenamento de imagens.
- Criar o sistema de design "estúdio editorial de alto padrão": paleta neutra e sóbria (off-white, grafite, areia) com um acento discreto (dourado queimado / bordô), tipografia serifada display + sans elegante para texto, espaçamento generoso, transições suaves. Tudo em tokens semânticos — sem estética genérica de IA (nada de roxo/azul, robôs ou emojis).
- Componentes base reutilizados nas duas áreas: card de escolha com imagem grande, barra de progresso, chip de tag, swatch de cor, sheet/modal.

## Fase 1 — Modelo de dados

Tabelas:

- `catalog_items` — codigo, categoria (look, cenario, maquiagem, cabelo, pose, iluminacao, acessorio), nome, imagem, cor/paleta, estilo, tags, `descricao_ia` (texto longo), ativo, ordem.
- `orders` — numero sequencial do pedido, nome do cliente, telefone, quantidade de fotos, status, `identity_photos_received` (checkbox), prioridade, prazo, notas internas, token público único, timestamps.
- `order_config` — respostas do cliente (tipo de ensaio + subtipo, enquadramento, roupa fixa/variar, maquiagem, cabelo, paleta, texto/idade visível, respostas específicas por categoria, observações) + itens escolhidos.
- `order_items` — ligação pedido ↔ item do catálogo, com papel (look, cenário, pose, etc.) e ordem (para numerar as poses).
- `order_status_options` — lista de status editável pelo operador (começa com: Aguardando cliente montar ensaio, Ensaio montado, Aguardando fotos de identidade, Pronto para produção, Em produção, Entregue).

Regras de acesso: catálogo e pedido são lidos/escritos publicamente **apenas** por quem tem o token único do pedido (via funções de servidor, nunca acesso direto amplo à tabela); tudo do admin exige login. Nenhum dado sensível de negócio exposto.

Seed inicial: um conjunto de itens de exemplo em cada categoria para o catálogo já funcionar na primeira abertura.

## Fase 2 — Admin: pedidos e cronograma (`/admin`)

- Login por email/senha (autenticação real, sem senha no código) e proteção de todas as rotas do admin.
- **Fila de produção** com alternância Kanban ↔ Tabela, filtros e ordenação por status, data e prioridade.
- **Criar pedido**: nome, telefone, quantidade de fotos, notas → gera o link único e um botão de copiar link.
- Edição inline de status, prioridade, prazo e notas; arrastar cartão entre colunas no Kanban.
- **Trava operacional**: checkbox "Fotos de identidade recebidas". Quando o ensaio está montado e as fotos não chegaram, o cartão/linha ganha alerta vermelho destacado. Um painel de topo lista todos os pedidos nessa situação.
- Atalho para abrir a página de resumo de cada pedido.

## Fase 3 — Admin: gestão do catálogo

- Grade de itens filtrável por categoria, estilo, cor e busca por tags/código.
- Criar/editar/duplicar/desativar item, com upload da imagem de referência e todos os campos (incluindo o texto longo "descrição para IA", com dicas de preenchimento no estilo diretor de fotografia).
- Reordenar itens (define a ordem que o cliente vê) e ações em lote (ativar/desativar).
- Expansível sem tocar em código.

## Fase 4 — Catálogo do cliente (`/ensaio/{token}`) — mobile-first

Fluxo em etapas, com progresso no topo, possibilidade de voltar e editar qualquer etapa, salvamento automático a cada passo, e linguagem 100% leiga ("Escolha a luz que você quer").

1. Boas-vindas com identidade do estúdio.
2. Tipo de ensaio (cards grandes) + subtipos de aniversário + "Outro" com campo texto.
3. Perguntas universais: enquadramento, roupa fixa ou variada, maquiagem, cabelo, acessórios, clima de luz, paleta, "aparece texto/número/idade na cena?", observações.
4. Perguntas específicas por categoria (aniversário, estúdio, casal, casamento, evento especial, gestante, corporativo, religioso, sensual) — renderizadas conforme a escolha da etapa 2.
5. Escolhas visuais no catálogo: look, paleta, cenário, cabelo e maquiagem, acessórios, poses, iluminação.
6. Poses com a regra: no máximo a quantidade de fotos do pedido; se escolher menos, aviso "Você escolheu X poses para Y fotos — as restantes vão variar naturalmente dentro do mesmo estilo", registrado no resumo.
7. Tela explicando que as fotos de identidade vão pelo WhatsApp, não pelo catálogo.
8. Observações especiais (texto livre).
9. Resumo visual com edição por etapa e botão "Confirmar ensaio" → muda o status para "Ensaio montado" + botão opcional que abre o WhatsApp com uma mensagem curta ("Meu ensaio está pronto! Pedido #1234").

Nenhuma pergunta sobre aparência física em nenhuma etapa.

## Fase 5 — Página de resumo do pedido (o entregável para o Claude)

Mesma URL, exibida após a confirmação; acessível ao operador sem login.

- Bloco de texto estruturado exatamente no formato da especificação (cabeçalho do pedido + seções LOOK, CENÁRIO, MAQUIAGEM, CABELO, ACESSÓRIOS, PALETA, ILUMINAÇÃO, POSES numeradas com a nota das fotos restantes, TEXTO/IDADE VISÍVEL, OBSERVAÇÕES), puxando as descrições longas do catálogo.
- Botão "Copiar tudo" e cópia por seção.
- Galeria de imagens de referência usadas: cada miniatura abre em tamanho grande e baixa individualmente, mais um botão **"Baixar todas as imagens deste pedido"** em .zip.
- Aviso fixo no topo quando as fotos de identidade ainda não foram marcadas como recebidas: "Não gere os prompts ainda".

## Fase 6 — Acabamento e verificação

- Metadados de página (título/descrição próprios por rota), rota inicial `/` levando ao contexto correto, e admin fora dos buscadores.
- Revisão mobile do catálogo e desktop do admin em tela real, com screenshots.
- Teste do fluxo ponta a ponta: criar pedido → abrir link → montar ensaio → confirmar → resumo → baixar imagens → mover status até Entregue.
- Revisão de segurança das políticas de acesso.

---

## Notas técnicas

- Rotas: `/` (entrada), `/ensaio/$token` (catálogo + resumo, público por token), `/admin` (fila), `/admin/pedidos/$id`, `/admin/catalogo`, `/admin/login`.
- Leitura e escrita do catálogo público via funções de servidor validando o token do pedido; admin usa sessão autenticada.
- Zip das referências gerado no servidor a partir do armazenamento de imagens.
- Fora de escopo (não será construído): e-mail, API oficial do WhatsApp, Pinterest, login do cliente, pagamento, CRM, integração com API do Claude, upload das fotos de identidade.

## Ordem de entrega

Fase 0 → 1 → 2 → 3 → 4 → 5 → 6. Ao fim da Fase 3 o operador já consegue cadastrar catálogo e pedidos; ao fim da Fase 5 o ciclo completo do negócio funciona.
