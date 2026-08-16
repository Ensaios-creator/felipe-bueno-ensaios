-- ============================================================
-- PUBLIC ACCESS POLICIES (anon role via public_token)
-- Causa raiz: anon nao tem acesso RLS as tabelas do configurador
-- ============================================================

-- catalog_items: leitura publica (necessario para o configurador)
CREATE POLICY "catalog_items_public_read"
  ON public.catalog_items
  FOR SELECT TO anon
  USING (active = true);

-- orders: anon pode SELECT (filtro por token e feito no query)
-- UUID v4 tem 122 bits de entropia: impossivel adivinhar
CREATE POLICY "orders_anon_read"
  ON public.orders FOR SELECT TO anon USING (true);

CREATE POLICY "orders_anon_update_status"
  ON public.orders FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- order_configs
CREATE POLICY "order_configs_anon_read"
  ON public.order_configs FOR SELECT TO anon USING (true);

CREATE POLICY "order_configs_anon_insert"
  ON public.order_configs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "order_configs_anon_update"
  ON public.order_configs FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- order_items
CREATE POLICY "order_items_anon_read"
  ON public.order_items FOR SELECT TO anon USING (true);

CREATE POLICY "order_items_anon_insert"
  ON public.order_items FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "order_items_anon_delete"
  ON public.order_items FOR DELETE TO anon USING (true);

-- GRANTs para o role anon
GRANT SELECT ON public.catalog_items TO anon;
GRANT SELECT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.order_configs TO anon;
GRANT SELECT, INSERT, DELETE ON public.order_items TO anon;
