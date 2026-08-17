-- Migration: Configurações de Provedor e Chaves de IA na tabela studio_settings
-- SEGURANÇA: As chaves de API NÃO devem estar aqui em texto plano.
-- Elas são inseridas pelo administrador no painel "Perfil & Ajustes > IA & Visão"
-- e salvas com segurança via UPDATE autenticado no Supabase.
ALTER TABLE public.studio_settings
  ADD COLUMN IF NOT EXISTS ai_provider TEXT NOT NULL DEFAULT 'groq',
  ADD COLUMN IF NOT EXISTS groq_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT DEFAULT '';

-- Atualiza registro padrão 'default' sem sobrescrever chaves já configuradas
UPDATE public.studio_settings
SET
  ai_provider = COALESCE(ai_provider, 'groq'),
  updated_at = now()
WHERE id = 'default';
