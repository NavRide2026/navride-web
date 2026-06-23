-- ============================================================
-- NavRide — migration_gpx_routes.sql
-- Garantiza que gpx_routes + bucket GPX + RPC están listos.
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Seguro de re-ejecutar (idempotente).
-- ============================================================

-- 1. Crear tabla gpx_routes si no existe
CREATE TABLE IF NOT EXISTS public.gpx_routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id        UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  difficulty       TEXT NOT NULL DEFAULT 'medium'
                     CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  distance_m       DOUBLE PRECISION,
  waypoints_count  INTEGER,
  elevation_gain_m DOUBLE PRECISION,
  country_code     TEXT,
  region           TEXT,
  tags             TEXT[] DEFAULT '{}',
  storage_url      TEXT NOT NULL,
  preview_url      TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  is_public        BOOLEAN NOT NULL DEFAULT FALSE,
  download_count   INTEGER NOT NULL DEFAULT 0,
  rating_avg       NUMERIC(3,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Añadir waypoints_count si falta (columna usada por la web)
ALTER TABLE public.gpx_routes
  ADD COLUMN IF NOT EXISTS waypoints_count INTEGER;

-- 3. Trigger updated_at (seguro si ya existía)
CREATE OR REPLACE FUNCTION public.handle_gpx_routes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'gpx_routes_updated_at'
  ) THEN
    CREATE TRIGGER gpx_routes_updated_at
      BEFORE UPDATE ON public.gpx_routes
      FOR EACH ROW EXECUTE FUNCTION public.handle_gpx_routes_updated_at();
  END IF;
END;
$$;

-- 4. Índices
CREATE INDEX IF NOT EXISTS gpx_routes_author_idx
  ON public.gpx_routes (author_id);

CREATE INDEX IF NOT EXISTS gpx_routes_public_created_idx
  ON public.gpx_routes (created_at DESC)
  WHERE is_public = TRUE;

-- 5. RLS
ALTER TABLE public.gpx_routes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Autor ve sus rutas; todos ven las públicas
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpx_routes' AND policyname = 'gpx_routes: select public'
  ) THEN
    CREATE POLICY "gpx_routes: select public"
      ON public.gpx_routes FOR SELECT
      USING (is_public = TRUE OR auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpx_routes' AND policyname = 'gpx_routes: insert own'
  ) THEN
    CREATE POLICY "gpx_routes: insert own"
      ON public.gpx_routes FOR INSERT
      WITH CHECK (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpx_routes' AND policyname = 'gpx_routes: update own'
  ) THEN
    CREATE POLICY "gpx_routes: update own"
      ON public.gpx_routes FOR UPDATE
      USING (auth.uid() = author_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpx_routes' AND policyname = 'gpx_routes: delete own'
  ) THEN
    CREATE POLICY "gpx_routes: delete own"
      ON public.gpx_routes FOR DELETE
      USING (auth.uid() = author_id);
  END IF;
END;
$$;

-- 6. Realtime para gpx_routes (app recibe nuevas rutas sin polling)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gpx_routes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- 7. Función RPC: incrementar download_count (evita race conditions)
CREATE OR REPLACE FUNCTION public.increment_download_count(route_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.gpx_routes
  SET download_count = download_count + 1
  WHERE id = route_id;
END;
$$;

-- 8. Storage bucket "gpx" — ejecutar SOLO si no existe todavía
-- (si ya existe en tu Supabase, este bloque lanzará error — simplemente ignóralo)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gpx', 'gpx', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Política de storage: usuario autenticado puede subir a su carpeta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies
    WHERE name = 'gpx_auth_upload'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'gpx_auth_upload',
      'gpx',
      'INSERT',
      '(auth.uid()::text = (storage.foldername(name))[1])'
    );
  END IF;
END;
$$;

-- 10. Política de storage: lectura pública del bucket gpx
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies
    WHERE name = 'gpx_public_read'
  ) THEN
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES (
      'gpx_public_read',
      'gpx',
      'SELECT',
      'TRUE'
    );
  END IF;
END;
$$;

-- Verificación final
SELECT id, author_id, title, distance_m, is_public, created_at
FROM public.gpx_routes
ORDER BY created_at DESC
LIMIT 5;
