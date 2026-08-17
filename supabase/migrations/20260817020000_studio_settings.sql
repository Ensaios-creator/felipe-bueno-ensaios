-- Migration: Tabela de configurações do estúdio (WhatsApp, nome do estúdio, tema)
CREATE TABLE IF NOT EXISTS public.studio_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  studio_name TEXT NOT NULL DEFAULT 'Felipe Bueno Retratos',
  whatsapp_number TEXT NOT NULL DEFAULT '5537991377328',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "studio_settings_admin_all" ON public.studio_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "studio_settings_public_read" ON public.studio_settings
  FOR SELECT TO anon USING (true);

GRANT SELECT ON public.studio_settings TO anon;
GRANT ALL ON public.studio_settings TO authenticated;
GRANT ALL ON public.studio_settings TO service_role;

-- Registro padrão inicial
INSERT INTO public.studio_settings (id, studio_name, whatsapp_number)
VALUES ('default', 'Felipe Bueno Retratos', '5537991377328')
ON CONFLICT (id) DO NOTHING;
