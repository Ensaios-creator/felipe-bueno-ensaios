# Configurador de Ensaios — continuação do plano

## Onde estamos hoje (verificado)

Já funcionando: backend ativo, todas as tabelas com regras de acesso, catálogo semeado, design system editorial, login do admin, lista de pedidos com criação/link/status/prioridade/prazo/checkbox de fotos de identidade, gestão de catálogo com upload, fluxo do cliente completo em 11 etapas com salvamento automático, página de briefing do pedido no admin e download .zip das referências.

Teste real feito no navegador: link do pedido → escolhas → resumo → envio funcionou sem erros de console.

O que ainda falta para fechar 100% da especificação está abaixo, em três entregas.

## Entrega A — Admin: fila de produção completa (fecha a Fase 2)

- Alternância Kanban ↔ Tabela, com o Kanban usando uma coluna por status cadastrado.
- Arrastar o cartão entre colunas para mudar o status.
- Ordenação por prazo, prioridade e data de criação, além do filtro de status já existente.
- Painel de alerta no topo listando todos os pedidos com ensaio montado e fotos de identidade ainda não recebidas; cartão/linha desses pedidos em vermelho destacado.
- Edição inline de notas internas e do pacote direto na linha/cartão.
- Tela de status: adicionar, renomear, reordenar e remover status da lista.

## Entrega B — Admin: catálogo profissional (fecha a Fase 3)

- Filtros por categoria, estilo e cor + busca por nome, código e tags.
- Duplicar item e desativar/ativar em lote (seleção múltipla).
- Reordenar itens dentro da categoria (define a ordem que a cliente vê).
- Dicas de preenchimento no campo "descrição para IA", em linguagem de direção de fotografia.

## Entrega C — Resumo público, ajustes do cliente e acabamento (fecha as Fases 4, 5 e 6)

Cliente:

- Aviso de poses: quando escolher menos poses que a quantidade de fotos, mostrar "Você escolheu X poses para Y fotos — as restantes vão variar naturalmente dentro do mesmo estilo" e registrar isso no resumo.
- Tela dedicada explicando que as fotos de identidade vão pelo WhatsApp.
- No resumo, botão para voltar direto a qualquer etapa e, após confirmar, botão que abre o WhatsApp com "Meu ensaio está pronto! Pedido #1234".

Resumo do pedido (entregável para o Claude):

- Página pública por token, exibida após a confirmação e acessível ao operador sem login.
- Texto estruturado no formato exato da especificação, puxando as descrições longas do catálogo.
- "Copiar tudo" e cópia por seção.
- Galeria das referências: miniatura abre em tamanho grande, download individual e "Baixar todas as imagens deste pedido" em .zip.
- Faixa fixa no topo quando as fotos de identidade não estão marcadas como recebidas: "Não gere os prompts ainda".

Acabamento:

- Título e descrição próprios em cada rota; admin fora dos buscadores.
- Revisão em tela real: catálogo no celular, admin no desktop, com screenshots.
- Teste ponta a ponta: criar pedido → montar ensaio → confirmar → resumo → baixar imagens → mover status até Entregue.
- Revisão das políticas de acesso e remoção do pedido de teste.

## Notas técnicas

- O resumo público vira uma rota nova por token, reaproveitando `order-summary.ts` e as funções de servidor já existentes; o briefing do admin passa a consumir o mesmo gerador para não haver dois formatos.
- Kanban e reordenação de catálogo usam arrastar-e-soltar nativo (HTML5), sem nova biblioteca.
- Imagens do catálogo continuam em bucket privado com URLs assinadas.
