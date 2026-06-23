-- ============================================================
-- NavRide — ensure_realtime.sql
-- Garantiza que route_alerts funciona con Realtime + RLS.
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Seguro de re-ejecutar (idempotente).
-- ============================================================

-- 1. Crear tabla si aún no existe (no falla si ya existe)
CREATE TABLE IF NOT EXISTS public.route_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude         DOUBLE PRECISION NOT NULL,
  longitude        DOUBLE PRECISION NOT NULL,
  alert_category   TEXT NOT NULL,
  alert_type       TEXT NOT NULL,
  description      TEXT,
  location_name    TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  confidence_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  votes_up         INTEGER NOT NULL DEFAULT 0,
  votes_down       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Añadir location_name si no existe (para instancias antiguas)
ALTER TABLE public.route_alerts
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- 3. Publicación Realtime — añade la tabla si falta
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.route_alerts;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- ya estaba, sin problema
END;
$$;

-- 4. Índice para queries bbox del cliente Flutter
CREATE INDEX IF NOT EXISTS idx_route_alerts_geo
  ON public.route_alerts (latitude, longitude)
  WHERE is_active = TRUE;

-- 5. Índice para polling incremental de la web (created_at > lastTs)
CREATE INDEX IF NOT EXISTS idx_route_alerts_created_at
  ON public.route_alerts (created_at DESC)
  WHERE is_active = TRUE;

-- 6. Índice para filtros por categoría
CREATE INDEX IF NOT EXISTS idx_route_alerts_active_category
  ON public.route_alerts (alert_category, created_at DESC)
  WHERE is_active = TRUE;

-- 7. RLS — habilitar (seguro si ya estaba activado)
ALTER TABLE public.route_alerts ENABLE ROW LEVEL SECURITY;

-- 8. Política: lectura anónima (todos pueden ver alertas activas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'route_alerts' AND policyname = 'route_alerts_anon_read'
  ) THEN
    CREATE POLICY "route_alerts_anon_read"
      ON public.route_alerts FOR SELECT
      USING (TRUE);
  END IF;
END;
$$;

-- 9. Política: INSERT anónimo (usuarios sin cuenta pueden reportar avisos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'route_alerts' AND policyname = 'route_alerts_anon_insert'
  ) THEN
    CREATE POLICY "route_alerts_anon_insert"
      ON public.route_alerts FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END;
$$;

-- 10. Política: UPDATE anónimo (votos up/down sin cuenta)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'route_alerts' AND policyname = 'route_alerts_anon_update'
  ) THEN
    CREATE POLICY "route_alerts_anon_update"
      ON public.route_alerts FOR UPDATE
      USING (TRUE)
      WITH CHECK (TRUE);
  END IF;
END;
$$;

-- Verificación final
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'route_alerts'
ORDER BY policyname;

SELECT pubname, tablename
FROM pg_publication_tables
WHERE tablename = 'route_alerts';
