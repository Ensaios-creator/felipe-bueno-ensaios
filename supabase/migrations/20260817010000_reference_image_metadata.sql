-- Migration: Metadados para filtragem inteligente de imagens de referência
-- As imagens de referência são fotos de ensaios prontos com metadados para
-- filtrar e exibir apenas as imagens relevantes para cada cliente.

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS session_types  text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_count   integer,
  ADD COLUMN IF NOT EXISTS gender         text,
  ADD COLUMN IF NOT EXISTS ambiance       text,
  ADD COLUMN IF NOT EXISTS vibe           text,
  ADD COLUMN IF NOT EXISTS has_cake       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_age_number boolean DEFAULT false;

-- Índice GIN para consultas de array (session_types @> '{aniversario}')
CREATE INDEX IF NOT EXISTS idx_catalog_session_types
  ON catalog_items USING GIN (session_types);
