import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Paintbrush,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneNumber, useStudioSettings } from "@/lib/studio-settings";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export function AdminProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, saveSettings } = useStudioSettings();

  // Account State
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingAccount, setUpdatingAccount] = useState(false);

  // Studio Settings State
  const [studioName, setStudioName] = useState(settings.studioName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setCurrentEmail(data.user.email);
        setNewEmail(data.user.email);
      }
    });
  }, [open]);

  useEffect(() => {
    setStudioName(settings.studioName);
    setWhatsappNumber(settings.whatsappNumber);
  }, [settings]);

  async function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("As senhas digitadas não coincidem.");
      return;
    }

    setUpdatingAccount(true);
    try {
      const payload: { email?: string; password?: string } = {};
      const isEmailChanging = newEmail.trim() && newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

      if (isEmailChanging) {
        payload.email = newEmail.trim();
      }
      if (newPassword) {
        payload.password = newPassword;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração nos dados de acesso.");
        return;
      }

      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;

      if (isEmailChanging) {
        toast.success(
          "E-mail de confirmação enviado para o novo endereço! Confirme na sua caixa de entrada para concluir a alteração.",
          { duration: 6000 },
        );
      } else {
        toast.success("Credenciais de acesso atualizadas com sucesso!");
      }

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar credenciais.");
    } finally {
      setUpdatingAccount(false);
    }
  }

  async function handleSaveStudioSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      toast.error("Informe um número de WhatsApp válido.");
      return;
    }

    setSavingSettings(true);
    try {
      await saveSettings({
        studioName: studioName.trim(),
        whatsappNumber: whatsappNumber.trim(),
      });
      toast.success("Configurações do estúdio salvas!");
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada com segurança.");
    onOpenChange(false);
    navigate({ to: "/auth" });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
              <User className="size-5 text-foreground" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl font-light">
                Perfil & Configurações
              </DialogTitle>
              <DialogDescription className="text-xs">
                Gerencie seus dados de acesso, preferências do estúdio e segurança.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="acesso" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="acesso" className="gap-1.5 text-xs">
              <KeyRound className="size-3.5" />
              Acesso
            </TabsTrigger>
            <TabsTrigger value="estudio" className="gap-1.5 text-xs">
              <MessageCircle className="size-3.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="gap-1.5 text-xs">
              <Paintbrush className="size-3.5" />
              Aparência
            </TabsTrigger>
          </TabsList>

          {/* ── ABA 1: ACESSO & SEGURANÇA ──────────────────────────────────── */}
          <TabsContent value="acesso" className="mt-4 space-y-5">
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Logado como:</span>
                <Badge variant="outline" className="font-mono text-[0.7rem]">
                  {currentEmail || "admin"}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email" className="text-xs font-medium">
                  E-mail de Login
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                <p className="text-[0.7rem] text-muted-foreground">
                  Ao trocar o e-mail, uma confirmação será enviada para o novo endereço.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-password" className="text-xs font-medium">
                  Nova Senha (opcional)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="profile-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-9 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {newPassword ? (
                <div className="space-y-2">
                  <Label htmlFor="profile-confirm-password" className="text-xs font-medium">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="profile-confirm-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              ) : null}

              <Button type="submit" disabled={updatingAccount} className="w-full">
                {updatingAccount ? "Salvando..." : "Salvar Alterações de Acesso"}
              </Button>
            </form>
          </TabsContent>

          {/* ── ABA 2: ESTÚDIO & WHATSAPP ──────────────────────────────────── */}
          <TabsContent value="estudio" className="mt-4 space-y-5">
            <form onSubmit={handleSaveStudioSettings} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studio-name" className="text-xs font-medium">
                  Nome do Estúdio
                </Label>
                <Input
                  id="studio-name"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Ex: Felipe Bueno Retratos"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studio-whatsapp" className="text-xs font-medium">
                  Número do WhatsApp do Estúdio
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="studio-whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Ex: 5537991377328 ou (37) 99137-7328"
                    className="pl-9 text-sm font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
                  <span>Formatado: {formatPhoneNumber(whatsappNumber)}</span>
                  <a
                    href={whatsappLink(whatsappNumber, "Olá! Teste de configuração do estúdio.")}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Testar número <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Como este número é usado:</p>
                <p className="mt-1">
                  • Quando o cliente finaliza o ensaio e clica em "Enviar pelo WhatsApp", ele é
                  direcionado para este número.
                </p>
                <p className="mt-1">
                  • Os botões de envio de fotos de identidade e links rápidos usarão este número.
                </p>
              </div>

              <Button type="submit" disabled={savingSettings} className="w-full">
                {savingSettings ? "Salvando..." : "Salvar Configurações de WhatsApp"}
              </Button>
            </form>
          </TabsContent>

          {/* ── ABA 3: APARÊNCIA ───────────────────────────────────────────── */}
          <TabsContent value="aparencia" className="mt-4 space-y-4">
            <div>
              <Label className="text-xs font-medium">Tema da Interface</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Escolha como deseja visualizar o painel do estúdio e o configurador.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                    theme === "dark"
                      ? "border-foreground bg-secondary ring-1 ring-foreground"
                      : "border-border bg-card opacity-70 hover:opacity-100",
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-background border border-border shadow">
                    <Moon className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-display text-base font-light">Modo Escuro</p>
                    <p className="text-[0.7rem] text-muted-foreground">Estilo editorial clássico</p>
                  </div>
                  {theme === "dark" && <Check className="size-4 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                    theme === "light"
                      ? "border-foreground bg-secondary ring-1 ring-foreground"
                      : "border-border bg-card opacity-70 hover:opacity-100",
                  )}
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-background border border-border shadow">
                    <Sun className="size-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-display text-base font-light">Modo Claro</p>
                    <p className="text-[0.7rem] text-muted-foreground">Visual limpo e luminoso</p>
                  </div>
                  {theme === "light" && <Check className="size-4 text-emerald-500" />}
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── BOTÃO DE LOGOUT / SAIR DA CONTA ─────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Sessão autenticada e protegida</span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-xs"
          >
            <LogOut className="size-3.5" />
            Sair da Conta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
