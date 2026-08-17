-- ==============================================================================
-- SCRIPT CONSOLIDADO DE CORREÇÃO DO SUPABASE
-- Projeto: Felipe Bueno Ensaios (rujdtxdfdpqkkuipbnyc)
--
-- Execute este script no SQL Editor do seu Dashboard do Supabase:
-- https://supabase.com/dashboard/project/rujdtxdfdpqkkuipbnyc/sql/new
-- ==============================================================================

-- 1. TABELA STUDIO_SETTINGS (Armazenamento de WhatsApp, Nome do Estúdio e Chaves de IA)
CREATE TABLE IF NOT EXISTS public.studio_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  studio_name TEXT NOT NULL DEFAULT 'Felipe Bueno Retratos',
  whatsapp_number TEXT NOT NULL DEFAULT '5537991377328',
  ai_provider TEXT NOT NULL DEFAULT 'groq',
  groq_api_key TEXT DEFAULT '',
  gemini_api_key TEXT DEFAULT '',
  openrouter_api_key TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilita RLS na studio_settings
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- Garante que admin autenticado tem controle total e anon pode ler
DROP POLICY IF EXISTS "studio_settings_admin_all" ON public.studio_settings;
DROP POLICY IF EXISTS "studio_settings_public_read" ON public.studio_settings;

CREATE POLICY "studio_settings_admin_all" ON public.studio_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "studio_settings_public_read" ON public.studio_settings
  FOR SELECT TO anon USING (true);

GRANT SELECT ON public.studio_settings TO anon;
GRANT ALL ON public.studio_settings TO authenticated;
GRANT ALL ON public.studio_settings TO service_role;

-- Insere o registro padrão se ainda não existir
INSERT INTO public.studio_settings (id, studio_name, whatsapp_number, ai_provider)
VALUES ('default', 'Felipe Bueno Retratos', '5537991377328', 'groq')
ON CONFLICT (id) DO NOTHING;


-- 2. ATUALIZAÇÃO DA TABELA CATALOG_ITEMS (Campos de Metadados de IA e Ensaio)

-- Adiciona as colunas necessárias para as referências e classificação por IA
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS session_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS people_count integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS ambiance text,
  ADD COLUMN IF NOT EXISTS vibe text,
  ADD COLUMN IF NOT EXISTS has_cake boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_age_number boolean NOT NULL DEFAULT false;

-- Remove a restrição CHECK antiga de category que bloqueava o novo formato de upload
ALTER TABLE public.catalog_items
  DROP CONSTRAINT IF EXISTS catalog_items_category_check;

-- Configura defaults nos campos legados para permitir inserts sem informá-los
ALTER TABLE public.catalog_items
  ALTER COLUMN code SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN category SET DEFAULT 'referencia',
  ALTER COLUMN ai_description SET DEFAULT '';

-- Garante permissões e RLS corretas na catalog_items
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT SELECT ON public.catalog_items TO anon;
GRANT ALL ON public.catalog_items TO service_role;

DROP POLICY IF EXISTS "catalog_items_admin_all" ON public.catalog_items;
DROP POLICY IF EXISTS "catalog_items_public_read" ON public.catalog_items;

CREATE POLICY "catalog_items_admin_all"
  ON public.catalog_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "catalog_items_public_read"
  ON public.catalog_items
  FOR SELECT
  TO anon
  USING (active = true);


-- 3. STORAGE: BUCKET 'catalog' E POLICIES DE IMAGENS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog',
  'catalog',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = GREATEST(storage.buckets.file_size_limit, 52428800),
  updated_at = now();

DROP POLICY IF EXISTS "catalog_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_delete" ON storage.objects;

CREATE POLICY "catalog_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalog');

CREATE POLICY "catalog_images_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catalog');

CREATE POLICY "catalog_images_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catalog');

CREATE POLICY "catalog_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'catalog');
