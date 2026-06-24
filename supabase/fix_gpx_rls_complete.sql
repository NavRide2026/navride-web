-- ============================================================
-- NavRide — fix_gpx_rls_complete.sql
-- Ejecutar UNA VEZ en Supabase Dashboard → SQL Editor
-- Corrige: RLS gpx_routes + storage bucket "gpx" + perfiles huérfanos
-- ============================================================

-- 0. Perfil obligatorio (FK author_id → user_profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Usuarios legacy sin fila en user_profiles
INSERT INTO public.user_profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles: select own" ON public.user_profiles;
CREATE POLICY "user_profiles: select own"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles: insert own" ON public.user_profiles;
CREATE POLICY "user_profiles: insert own"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles: update own" ON public.user_profiles;
CREATE POLICY "user_profiles: update own"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 1. Tabla gpx_routes (columnas mínimas)
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

ALTER TABLE public.gpx_routes
  ADD COLUMN IF NOT EXISTS waypoints_count INTEGER;

ALTER TABLE public.gpx_routes ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas antiguas (nombres legacy)
DROP POLICY IF EXISTS "gpx_routes: select public" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: insert own" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: update own" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: delete own" ON public.gpx_routes;
DROP POLICY IF EXISTS "Leer rutas públicas" ON public.gpx_routes;
DROP POLICY IF EXISTS "Leer mis rutas" ON public.gpx_routes;
DROP POLICY IF EXISTS "Insertar mis rutas" ON public.gpx_routes;
DROP POLICY IF EXISTS "Actualizar mis rutas" ON public.gpx_routes;
DROP POLICY IF EXISTS "Borrar mis rutas" ON public.gpx_routes;

CREATE POLICY "gpx_routes_select"
  ON public.gpx_routes FOR SELECT
  TO authenticated, anon
  USING (is_public = TRUE OR auth.uid() = author_id);

CREATE POLICY "gpx_routes_insert"
  ON public.gpx_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gpx_routes_update"
  ON public.gpx_routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gpx_routes_delete"
  ON public.gpx_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 2. Realtime (app + web perfil)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.gpx_routes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;

-- 3. Bucket storage "gpx"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gpx',
  'gpx',
  TRUE,
  52428800,
  ARRAY['application/gpx+xml', 'application/xml', 'text/xml', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. RLS storage.objects (API moderna — causa habitual del error al subir)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "navride_gpx_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_select" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_update_own" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_delete_own" ON storage.objects;

CREATE POLICY "navride_gpx_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "navride_gpx_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'gpx');

CREATE POLICY "navride_gpx_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "navride_gpx_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. RPC downloads
CREATE OR REPLACE FUNCTION public.increment_download_count(route_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.gpx_routes
  SET download_count = download_count + 1
  WHERE id = route_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_download_count(UUID) TO authenticated, anon;

-- Verificación
SELECT 'gpx_routes policies' AS check, COUNT(*) AS n
FROM pg_policies WHERE tablename = 'gpx_routes';

SELECT 'storage gpx policies' AS check, policyname
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'navride_gpx%';
