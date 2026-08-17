import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, Sparkles, User, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AdminProfileDialog } from "@/components/admin/admin-profile-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStudioSettings } from "@/lib/studio-settings";
import { checkProviderHealth, ProviderHealth } from "@/lib/vision-ai";

const NAV = [
  { to: "/admin", label: "Pedidos" },
  { to: "/admin/catalogo", label: "Banco de Referências" },
  { to: "/admin/status", label: "Status" },
] as const;

export function AdminShell({
  children,
  title,
  eyebrow,
  action,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { settings } = useStudioSettings();
  const [aiHealth, setAiHealth] = useState<ProviderHealth | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  // Diagnóstico rápido em background do provedor ativo para atualizar a pílula do header
  useEffect(() => {
    const key =
      settings.aiProvider === "groq"
        ? settings.groqApiKey
        : settings.aiProvider === "gemini"
          ? settings.geminiApiKey
          : settings.openrouterApiKey;

    if (key?.trim()) {
      checkProviderHealth(settings.aiProvider, key).then((res) => {
        setAiHealth(res);
      });
    }
  }, [settings.aiProvider, settings.groqApiKey, settings.geminiApiKey, settings.openrouterApiKey]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="font-display text-xl tracking-tight font-light">
              {settings.studioName || "Configurador de Ensaios"}
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                className="text-muted-foreground transition-colors hover:text-foreground text-xs uppercase tracking-wider"
                activeProps={{ className: "text-foreground font-semibold border-b-2 border-foreground pb-0.5" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Pílula Dinâmica de Status de IA */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title="Clique para gerenciar provedores de IA"
            >
              <Sparkles className="size-3 text-amber-500" />
              <span className="font-medium text-foreground text-[0.72rem]">
                IA: {settings.aiProvider.toUpperCase()}
              </span>

              {/* Indicador Animado */}
              {aiHealth?.status === "online" ? (
                <span className="flex items-center gap-1 text-[0.68rem] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
                  </span>
                  <span>{aiHealth.latencyMs}ms</span>
                </span>
              ) : aiHealth && aiHealth.status !== "unconfigured" && aiHealth.status !== "checking" ? (
                <span className="flex items-center gap-1 text-[0.68rem] text-rose-600 dark:text-rose-400 font-medium">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex size-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
                  </span>
                  <span>Falha</span>
                </span>
              ) : null}
            </button>

            <ThemeToggle variant="ghost" size="icon" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileOpen(true)}
              className="gap-2 text-xs"
            >
              <User className="size-3.5" />
              <span>Perfil & Ajustes</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sair da conta"
              className="size-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1 className="font-display text-4xl font-light tracking-tight">{title}</h1>
          </div>
          {action}
        </div>
        {children}
      </main>

      <AdminProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

