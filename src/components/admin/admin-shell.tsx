import { Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, LogOut } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setCurrentEmail(data.user.email);
        setNewEmail(data.user.email);
      }
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/auth" });
  }

  async function handleUpdateAccount(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword && newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setUpdating(true);
    try {
      const payload: { email?: string; password?: string } = {};
      if (newEmail.trim() && newEmail.trim() !== currentEmail) {
        payload.email = newEmail.trim();
      }
      if (newPassword) {
        payload.password = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração detectada.");
        setAccountOpen(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;

      if (payload.email) {
        setCurrentEmail(payload.email);
      }
      setNewPassword("");
      setConfirmPassword("");
      setAccountOpen(false);
      toast.success("Credenciais de acesso atualizadas!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar dados.");
    } finally {
      setUpdating(false);
    }
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
          <div className="ml-auto flex items-center gap-2">
            <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <KeyRound className="mr-2 size-4" />
                  Alterar Acesso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl font-light">
                    Alterar dados de acesso
                  </DialogTitle>
                  <DialogDescription>
                    Atualize seu e-mail de login ou defina uma nova senha de acesso ao estúdio.
                  </DialogDescription>
                </DialogHeader>
                <form id="update-account-form" onSubmit={handleUpdateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-email">E-mail de acesso</Label>
                    <Input
                      id="account-email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-password">Nova senha</Label>
                    <Input
                      id="account-password"
                      type="password"
                      placeholder="Deixe em branco para não alterar"
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  {newPassword ? (
                    <div className="space-y-2">
                      <Label htmlFor="account-confirm-password">Confirmar nova senha</Label>
                      <Input
                        id="account-confirm-password"
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  ) : null}
                </form>
                <DialogFooter>
                  <Button type="submit" form="update-account-form" disabled={updating}>
                    {updating ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 size-4" />
              Sair
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
    </div>
  );
}
