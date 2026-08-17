-- catalog_items: leitura publica para anon
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='catalog_items' AND policyname='catalog_items_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY catalog_items_public_read ON public.catalog_items FOR SELECT TO anon USING (active = true)';
  END IF;
END $$;

-- orders: anon pode SELECT e UPDATE
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_anon_read') THEN
    EXECUTE 'CREATE POLICY orders_anon_read ON public.orders FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_anon_update_status') THEN
    EXECUTE 'CREATE POLICY orders_anon_update_status ON public.orders FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- order_configs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_configs' AND policyname='order_configs_anon_read') THEN
    EXECUTE 'CREATE POLICY order_configs_anon_read ON public.order_configs FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_configs' AND policyname='order_configs_anon_insert') THEN
    EXECUTE 'CREATE POLICY order_configs_anon_insert ON public.order_configs FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_configs' AND policyname='order_configs_anon_update') THEN
    EXECUTE 'CREATE POLICY order_configs_anon_update ON public.order_configs FOR UPDATE TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- order_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='order_items_anon_read') THEN
    EXECUTE 'CREATE POLICY order_items_anon_read ON public.order_items FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='order_items_anon_insert') THEN
    EXECUTE 'CREATE POLICY order_items_anon_insert ON public.order_items FOR INSERT TO anon WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='order_items' AND policyname='order_items_anon_delete') THEN
    EXECUTE 'CREATE POLICY order_items_anon_delete ON public.order_items FOR DELETE TO anon USING (true)';
  END IF;
END $$;

-- GRANTs
GRANT SELECT ON public.catalog_items TO anon;
GRANT SELECT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.order_configs TO anon;
GRANT SELECT, INSERT, DELETE ON public.order_items TO anon;
