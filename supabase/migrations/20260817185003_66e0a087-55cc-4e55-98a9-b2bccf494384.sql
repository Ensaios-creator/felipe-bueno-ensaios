ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_category_check;

ALTER TABLE public.catalog_items
  ALTER COLUMN code SET DEFAULT gen_random_uuid()::text,
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN category SET DEFAULT 'referencia',
  ALTER COLUMN ai_description SET DEFAULT '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalog_items_admin_all" ON public.catalog_items;
CREATE POLICY "catalog_items_admin_all"
  ON public.catalog_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "catalog_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "catalog_images_admin_delete" ON storage.objects;

CREATE POLICY "catalog_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'catalog');
CREATE POLICY "catalog_images_admin_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'catalog');
CREATE POLICY "catalog_images_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'catalog');
CREATE POLICY "catalog_images_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'catalog');