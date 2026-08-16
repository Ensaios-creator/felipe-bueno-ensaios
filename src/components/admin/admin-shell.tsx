import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Pedidos" },
  { to: "/admin/catalogo", label: "Catálogo" },
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

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5">
          <Link to="/admin" className="font-display text-xl tracking-tight">
            Configurador de Ensaios
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={signOut}>
            <LogOut className="mr-2 size-4" />
            Sair
          </Button>
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
    </div>
  );
}
