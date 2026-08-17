-- Migration: Torna o banco de referências compatível com o fluxo moderno de upload
-- O novo sistema usa session_types[] + metadados de IA ao invés de category/code/name
-- obrigatórios. Vamos tornar esses campos opcionais e remover o CHECK antigo.

-- 1. Remove a constraint CHECK antiga de category (valores do sistema legado)
ALTER TABLE public.catalog_items
  DROP CONSTRAINT IF EXISTS catalog_items_category_check;

-- 2. Torna code, name e category opcionais com defaults automáticos
ALTER TABLE public.catalog_items
  ALTER COLUMN code SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN category SET DEFAULT 'referencia',
  ALTER COLUMN ai_description SET DEFAULT '';

-- 3. Garante que code e name aceitam NULL implicitamente via default
-- (o NOT NULL continua, mas o default garante que inserts sem esses campos funcionem)

-- 4. Reconfirma as policies de RLS para o admin autenticado
-- (garante compatibilidade caso outra migration tenha sobrescrito)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'catalog_items'
      AND policyname = 'catalog_items_admin_all'
  ) THEN
    CREATE POLICY "catalog_items_admin_all"
      ON public.catalog_items
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Garante que o bucket 'catalog' existe e tem as policies de storage corretas
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog', 'catalog', true)
ON CONFLICT (id) DO NOTHING;

-- Limpa policies de storage duplicadas e recria
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
