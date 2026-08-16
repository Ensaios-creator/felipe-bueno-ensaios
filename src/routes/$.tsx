import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Página não encontrada — Configurador de Ensaios" },
      {
        name: "description",
        content: "O link acessado não existe ou expirou. Volte ao início do configurador.",
      },
      { property: "og:title", content: "Página não encontrada" },
      { property: "og:description", content: "O link acessado não existe ou expirou." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="font-display text-4xl font-light tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        O link que você acessou não existe ou expirou. Se você recebeu um link do estúdio, peça um
        novo pelo WhatsApp.
      </p>
      <Button asChild variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </main>
  );
}
