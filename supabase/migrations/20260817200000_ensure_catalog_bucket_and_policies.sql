-- ============================================================
-- Migration: Garante existência do bucket 'catalog' e todas as policies
-- de storage. Idempotente — pode ser rodada múltiplas vezes sem erro.
-- ============================================================

-- 1. Cria o bucket 'catalog' como público (imagens acessíveis via URL pública)
--    ON CONFLICT DO NOTHING garante que não falha se já existir.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog',
  'catalog',
  true,
  52428800,  -- 50 MB por arquivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = GREATEST(storage.buckets.file_size_limit, 52428800),
  updated_at = now();

-- 2. Remove policies antigas que possam estar duplicadas ou com conflito
DROP POLICY IF EXISTS "catalog_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_write"  ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_delete" ON storage.objects;

-- 3. Leitura pública: qualquer pessoa pode ver as imagens do catálogo
CREATE POLICY "catalog_images_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'catalog');

-- 4. Upload: somente usuários autenticados (admin) podem subir imagens
CREATE POLICY "catalog_images_admin_write"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'catalog');

-- 5. Atualização: somente usuários autenticados
CREATE POLICY "catalog_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'catalog');

-- 6. Deleção: somente usuários autenticados
CREATE POLICY "catalog_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'catalog');

-- ============================================================
-- Garante que a tabela catalog_items existe com as colunas certas
-- ============================================================

-- Adiciona colunas novas caso a migration anterior não tenha rodado
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS session_types  text[]  NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS people_count   integer,
  ADD COLUMN IF NOT EXISTS gender         text,
  ADD COLUMN IF NOT EXISTS ambiance       text,
  ADD COLUMN IF NOT EXISTS vibe           text,
  ADD COLUMN IF NOT EXISTS has_cake       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_age_number boolean NOT NULL DEFAULT false;

-- Remove o CHECK antigo de category que impedia inserts do novo sistema
ALTER TABLE public.catalog_items
  DROP CONSTRAINT IF EXISTS catalog_items_category_check;

-- Garante defaults nos campos obrigatórios legados para que o insert sem
-- esses campos funcione (o novo sistema não precisa informar code/name/category).
ALTER TABLE public.catalog_items
  ALTER COLUMN code        SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN name        SET DEFAULT '',
  ALTER COLUMN category    SET DEFAULT 'referencia',
  ALTER COLUMN ai_description SET DEFAULT '';

-- ============================================================
-- Garante RLS e permissões na catalog_items
-- ============================================================

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT SELECT                         ON public.catalog_items TO anon;
GRANT ALL                            ON public.catalog_items TO service_role;

DROP POLICY IF EXISTS "catalog_items_admin_all"   ON public.catalog_items;
DROP POLICY IF EXISTS "catalog_items_public_read" ON public.catalog_items;

-- Admin (autenticado) pode fazer tudo
CREATE POLICY "catalog_items_admin_all"
  ON public.catalog_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Clientes anônimos podem ler itens ativos (para o ensaio.$token.tsx)
CREATE POLICY "catalog_items_public_read"
  ON public.catalog_items
  FOR SELECT
  TO anon
  USING (active = true);
