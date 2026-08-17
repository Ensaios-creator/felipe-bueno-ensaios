import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Configurador de Ensaios — Estúdio de retratos autorais" },
      {
        name: "description",
        content:
          "Monte seu ensaio escolhendo look, cenário, luz e poses. Cada cliente recebe um link exclusivo para configurar as fotos.",
      },
      { property: "og:title", content: "Configurador de Ensaios — Estúdio de retratos autorais" },
      {
        property: "og:description",
        content:
          "Monte seu ensaio escolhendo look, cenário, luz e poses em poucos minutos, direto do celular.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  {
    title: "Você recebe um link",
    body: "O estúdio abre seu pedido e te envia um endereço exclusivo pelo WhatsApp. Não precisa criar conta nem senha.",
  },
  {
    title: "Você escolhe olhando",
    body: "Look, cenário, luz e poses aparecem em imagens. Basta tocar no que combina com você.",
  },
  {
    title: "A equipe produz",
    body: "Seu briefing chega pronto para o estúdio. Sua identidade vem das suas próprias fotos, nunca de descrição escrita.",
  },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg tracking-tight">Configurador de Ensaios</span>
        <ThemeToggle variant="ghost" size="icon" className="size-8" />
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="border-b border-border/70 py-16 sm:py-24">
          <p className="eyebrow">Retratos autorais</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
            Seu ensaio, desenhado antes da primeira foto.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Um caminho curto e visual para você dizer exatamente como imagina suas imagens — sem
            formulários intermináveis e sem termos técnicos.
          </p>
        </section>

        <section className="grid gap-10 py-16 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title}>
              <p className="font-display text-3xl font-light text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div className="hairline my-4" />
              <h2 className="font-display text-2xl font-light tracking-tight">{step.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-8 sm:p-12">
          <p className="eyebrow">Já tem um link?</p>
          <h2 className="mt-3 font-display text-3xl font-light tracking-tight">
            Abra o endereço que o estúdio enviou
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            O link é pessoal e guarda suas escolhas automaticamente. Você pode fechar e voltar
            depois de onde parou.
          </p>
        </section>
      </main>
    </div>
  );
}
