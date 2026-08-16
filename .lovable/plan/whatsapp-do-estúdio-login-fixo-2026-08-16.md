# WhatsApp do estúdio + login fixo

## 1. Número do estúdio

- Cadastrar o número real do estúdio: `+55 37 99137-7328` → `5537991377328` em `src/lib/whatsapp.ts` (`STUDIO_WHATSAPP`).
- Garantir que todo botão de "enviar" abra o WhatsApp direto:
  - Na tela final da cliente, o botão "Confirmar/Enviar ensaio" passa a, após salvar, abrir o WhatsApp do estúdio já com a mensagem pronta (pedido #, aviso das fotos de identidade) — sem passo intermediário.
  - No admin, os botões "Enviar link" e "Pedir fotos" continuam abrindo a conversa com o telefone da cliente.
- Abertura em nova aba via `wa.me`, com a mensagem já preenchida.

## 2. Login fixo do estúdio

Na tela `/auth`:

- Remover o botão "Continuar com o Google".
- Remover o link "Não tenho acesso ainda" (criação de conta) e todo o modo de cadastro.
- Deixar apenas e-mail + senha para entrar, com o e-mail do estúdio já preenchido.
- Aceitar apenas o acesso do estúdio: `lflavio916@gmail.com`.

No backend:

- Criar/atualizar esse usuário com a senha `37869825`, e-mail já confirmado.
- Desativar novos cadastros no projeto, de modo que a única forma de mudar o acesso seja por dentro (backend/administração), não pela tela.

## Nota técnica

- `STUDIO_WHATSAPP = "5537991377328"`.
- `/auth` fica só com `signInWithPassword`; sem `signUp` e sem OAuth.
- Usuário criado via Admin API com `email_confirm: true`; `disable_signup` ativado nas configurações de autenticação.
