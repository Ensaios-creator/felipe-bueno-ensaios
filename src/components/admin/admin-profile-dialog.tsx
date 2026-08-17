import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Activity,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Paintbrush,
  Phone,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Zap,
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
import { AiProvider, formatPhoneNumber, useStudioSettings } from "@/lib/studio-settings";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  ProviderHealth,
  checkAllProvidersHealth,
  checkProviderHealth,
  testAiConnection,
} from "@/lib/vision-ai";
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

  // AI Settings State
  const [aiProvider, setAiProvider] = useState<AiProvider>(settings.aiProvider);
  const [groqApiKey, setGroqApiKey] = useState(settings.groqApiKey);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [openrouterApiKey, setOpenrouterApiKey] = useState(settings.openrouterApiKey);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  // Health Diagnostics State
  const [healthMap, setHealthMap] = useState<
    Record<AiProvider, ProviderHealth | { status: "idle" | "checking" }>
  >({
    groq: { status: "idle" },
    gemini: { status: "idle" },
    openrouter: { status: "idle" },
  });
  const [checkingHealth, setCheckingHealth] = useState(false);

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
    setAiProvider(settings.aiProvider);
    setGroqApiKey(settings.groqApiKey);
    setGeminiApiKey(settings.geminiApiKey);
    setOpenrouterApiKey(settings.openrouterApiKey);
  }, [settings]);

  // Executa diagnóstico automático quando o modal é aberto
  useEffect(() => {
    if (open) {
      runDiagnostics();
    }
  }, [open]);

  async function runDiagnostics(overrideSettings?: {
    groqApiKey?: string;
    geminiApiKey?: string;
    openrouterApiKey?: string;
  }) {
    setCheckingHealth(true);
    setHealthMap({
      groq: { status: "checking" },
      gemini: { status: "checking" },
      openrouter: { status: "checking" },
    });

    try {
      const results = await checkAllProvidersHealth({
        ...settings,
        groqApiKey: overrideSettings?.groqApiKey ?? groqApiKey,
        geminiApiKey: overrideSettings?.geminiApiKey ?? geminiApiKey,
        openrouterApiKey: overrideSettings?.openrouterApiKey ?? openrouterApiKey,
      });
      setHealthMap(results);
    } catch {
      // ignore
    } finally {
      setCheckingHealth(false);
    }
  }

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

  async function handleSaveAiSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSavingAi(true);
    try {
      await saveSettings({
        aiProvider,
        groqApiKey: groqApiKey.trim(),
        geminiApiKey: geminiApiKey.trim(),
        openrouterApiKey: openrouterApiKey.trim(),
      });
      toast.success("Configurações de Inteligência Artificial salvas!");
      // Roda novo diagnóstico com as chaves salvas
      runDiagnostics({
        groqApiKey: groqApiKey.trim(),
        geminiApiKey: geminiApiKey.trim(),
        openrouterApiKey: openrouterApiKey.trim(),
      });
    } catch (err) {
      toast.error("Erro ao salvar configurações de IA.");
    } finally {
      setSavingAi(false);
    }
  }

  async function handleTestActiveAi() {
    const key =
      aiProvider === "groq"
        ? groqApiKey
        : aiProvider === "gemini"
          ? geminiApiKey
          : openrouterApiKey;

    if (!key.trim()) {
      toast.error(`Informe a chave de API para o provedor ${aiProvider.toUpperCase()} antes de testar.`);
      return;
    }

    setTestingAi(true);
    const toastId = toast.loading(`Diagnosticando ${aiProvider.toUpperCase()}...`);
    try {
      const res = await checkProviderHealth(aiProvider, key);
      toast.dismiss(toastId);
      setHealthMap((prev) => ({ ...prev, [aiProvider]: res }));

      if (res.status === "online") {
        toast.success(`🟢 ${aiProvider.toUpperCase()}: ${res.message}!`);
      } else {
        toast.error(`🔴 ${aiProvider.toUpperCase()}: ${res.message}`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Falha no teste de conexão.");
    } finally {
      setTestingAi(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada com segurança.");
    onOpenChange(false);
    navigate({ to: "/auth" });
  }

  // Renderizador de Badge Animado de Status do Provedor
  function renderProviderStatusBadge(provider: AiProvider) {
    const health = healthMap[provider];

    if (!health || health.status === "idle" || health.status === "checking") {
      return (
        <div className="flex items-center gap-1 rounded-full bg-secondary/80 border border-border px-2 py-0.5 text-[0.62rem] text-muted-foreground">
          <Loader2 className="size-2.5 animate-spin text-amber-500" />
          <span>Verificando...</span>
        </div>
      );
    }

    if (health.status === "online") {
      return (
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[0.62rem] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span>Online ({health.latencyMs}ms)</span>
        </div>
      );
    }

    if (health.status === "unconfigured") {
      return (
        <div className="flex items-center gap-1 rounded-full bg-muted/60 border border-border/60 px-2 py-0.5 text-[0.62rem] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          <span>Sem chave</span>
        </div>
      );
    }

    // Erros (Rate limit, Chave inválida, Offline)
    const label =
      health.status === "rate_limited"
        ? "Limite Excedido"
        : health.status === "invalid_key"
          ? "Chave Inválida"
          : health.status === "model_unavailable"
            ? "Indisponível"
            : "Falha / Erro";

    return (
      <div className="flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[0.62rem] font-medium text-rose-600 dark:text-rose-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
        </span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
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
                Gerencie acesso, WhatsApp, motor de IA e preferências visuais do estúdio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="acesso" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="acesso" className="gap-1.5 text-xs">
              <KeyRound className="size-3.5" />
              Acesso
            </TabsTrigger>
            <TabsTrigger value="estudio" className="gap-1.5 text-xs">
              <MessageCircle className="size-3.5" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-1.5 text-xs">
              <Sparkles className="size-3.5 text-amber-500" />
              IA & Visão
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

          {/* ── ABA 3: INTELIGÊNCIA ARTIFICIAL (MULTI-PROVEDOR & STATUS) ─────── */}
          <TabsContent value="ia" className="mt-4 space-y-5">
            <form onSubmit={handleSaveAiSettings} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-medium">Provedor de Visão Ativo & Saúde dos Motores</Label>
                  <button
                    type="button"
                    disabled={checkingHealth}
                    onClick={() => runDiagnostics()}
                    className="inline-flex items-center gap-1 text-[0.7rem] text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={cn("size-3", checkingHealth && "animate-spin")} />
                    <span>{checkingHealth ? "Diagnosticando..." : "Atualizar Status"}</span>
                  </button>
                </div>
                <p className="text-[0.72rem] text-muted-foreground mb-3">
                  Escolha o motor prioritário. Indicadores verdes mostram que o serviço está operacional; vermelhos indicam falhas com a causa detalhada.
                </p>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Option 1: Groq */}
                  <button
                    type="button"
                    onClick={() => setAiProvider("groq")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all relative overflow-hidden",
                      aiProvider === "groq"
                        ? "border-foreground bg-secondary ring-1 ring-foreground"
                        : "border-border bg-card/60 opacity-80 hover:opacity-100",
                    )}
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium">Groq</p>
                      <p className="text-[0.62rem] text-muted-foreground">Llama 3.2 Vision</p>
                    </div>

                    {/* Status Badge Animado */}
                    {renderProviderStatusBadge("groq")}

                    {aiProvider === "groq" && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="size-3.5 text-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Option 2: Gemini */}
                  <button
                    type="button"
                    onClick={() => setAiProvider("gemini")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all relative overflow-hidden",
                      aiProvider === "gemini"
                        ? "border-foreground bg-secondary ring-1 ring-foreground"
                        : "border-border bg-card/60 opacity-80 hover:opacity-100",
                    )}
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium">Gemini</p>
                      <p className="text-[0.62rem] text-muted-foreground">2.0 / 1.5 Flash</p>
                    </div>

                    {/* Status Badge Animado */}
                    {renderProviderStatusBadge("gemini")}

                    {aiProvider === "gemini" && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="size-3.5 text-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Option 3: OpenRouter */}
                  <button
                    type="button"
                    onClick={() => setAiProvider("openrouter")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all relative overflow-hidden",
                      aiProvider === "openrouter"
                        ? "border-foreground bg-secondary ring-1 ring-foreground"
                        : "border-border bg-card/60 opacity-80 hover:opacity-100",
                    )}
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-purple-500/15 text-purple-500">
                      <Radio className="size-4" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium">OpenRouter</p>
                      <p className="text-[0.62rem] text-muted-foreground">Modelos Free / Open</p>
                    </div>

                    {/* Status Badge Animado */}
                    {renderProviderStatusBadge("openrouter")}

                    {aiProvider === "openrouter" && (
                      <div className="absolute top-1.5 right-1.5">
                        <Check className="size-3.5 text-foreground" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Caixa Informativa de Diagnóstico Detalhado */}
                {(() => {
                  const activeHealth = healthMap[aiProvider];
                  if (!activeHealth || activeHealth.status === "idle" || activeHealth.status === "checking") {
                    return null;
                  }

                  if (activeHealth.status === "online") {
                    return (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <Activity className="size-4 shrink-0 text-emerald-500" />
                        <span>
                          <strong>{aiProvider.toUpperCase()} operacional:</strong> {activeHealth.message}.{" "}
                          {activeHealth.detail}
                        </span>
                      </div>
                    );
                  }

                  if (activeHealth.status === "rate_limited") {
                    return (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="font-semibold">⚠️ Limite de Requisições / Cota Excedida no {aiProvider.toUpperCase()}</p>
                          <p className="mt-0.5 text-[0.72rem] opacity-90 leading-relaxed">
                            {activeHealth.detail || "Sua conta atingiu a cota temporária do provedor."} Durante uploads, o sistema usará os outros provedores configurados como contingência automática.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (activeHealth.status === "invalid_key") {
                    return (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                        <AlertCircle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="font-semibold">🔴 Chave de API Inválida ({aiProvider.toUpperCase()})</p>
                          <p className="mt-0.5 text-[0.72rem] opacity-90 leading-relaxed">
                            A chave informada foi rejeitada ou expirou. Por favor, confira o campo de chave abaixo e salve.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="size-4 shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Falha ao conectar com {aiProvider.toUpperCase()}</p>
                        <p className="mt-0.5 text-[0.72rem] opacity-90 leading-relaxed">
                          {activeHealth.message} — {activeHealth.detail}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Chaves de API */}
              <div className="space-y-3.5 border-t border-border pt-3.5">
                {/* Groq Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="groq-key" className="text-xs font-medium flex items-center gap-1.5">
                      <Zap className="size-3 text-amber-500" />
                      Chave API Groq (gsk_...)
                    </Label>
                    <span className="text-[0.65rem] text-muted-foreground">Llama 3.2 11B/90B</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="groq-key"
                      type={showGroqKey ? "text" : "password"}
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="gsk_..."
                      className="pr-9 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showGroqKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gemini-key" className="text-xs font-medium flex items-center gap-1.5">
                      <Sparkles className="size-3 text-blue-500" />
                      Chave API Google Gemini
                    </Label>
                    <span className="text-[0.65rem] text-muted-foreground">Gemini 2.0 / 1.5 Flash</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="gemini-key"
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Chave do Google AI Studio"
                      className="pr-9 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showGeminiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* OpenRouter Key */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openrouter-key" className="text-xs font-medium flex items-center gap-1.5">
                      <Radio className="size-3 text-purple-500" />
                      Chave API OpenRouter (sk-or-v1-...)
                    </Label>
                    <span className="text-[0.65rem] text-muted-foreground">Modelos Free</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="openrouter-key"
                      type={showOpenrouterKey ? "text" : "password"}
                      value={openrouterApiKey}
                      onChange={(e) => setOpenrouterApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="pr-9 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showOpenrouterKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingAi || checkingHealth}
                  onClick={handleTestActiveAi}
                  className="flex-1 gap-1.5 text-xs"
                >
                  <Zap className="size-3.5 text-amber-500" />
                  {testingAi ? "Testando..." : `Diagnosticar ${aiProvider.toUpperCase()}`}
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={savingAi}
                  className="flex-1 text-xs"
                >
                  {savingAi ? "Salvando..." : "Salvar Configurações de IA"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* ── ABA 4: APARÊNCIA ───────────────────────────────────────────── */}
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


