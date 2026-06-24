-- ============================================================
-- NavRide — fix_gpx_storage_upload_rls.sql
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Corrige: "new row violates row-level security policy" al subir GPX
-- Seguro de re-ejecutar (idempotente).
-- ============================================================

-- Perfil obligatorio (FK author_id en gpx_routes)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.user_profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', SPLIT_PART(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles: select own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: insert own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: update own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles: read own" ON public.user_profiles;

CREATE POLICY "user_profiles: select own"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "user_profiles: insert own"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles: update own"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Bucket gpx
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

-- Políticas storage (causa del error al subir archivo)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "navride_gpx_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_select" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_update_own" ON storage.objects;
DROP POLICY IF EXISTS "navride_gpx_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "gpx: public read" ON storage.objects;
DROP POLICY IF EXISTS "gpx: authenticated upload own folder" ON storage.objects;
DROP POLICY IF EXISTS "gpx: authenticated delete own" ON storage.objects;
DROP POLICY IF EXISTS "gpx: authenticated update own" ON storage.objects;

CREATE POLICY "navride_gpx_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "navride_gpx_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'gpx');

CREATE POLICY "navride_gpx_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "navride_gpx_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gpx'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- gpx_routes (insert tras subir archivo)
ALTER TABLE public.gpx_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gpx_routes: select public" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: insert own" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: update own" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes: delete own" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes_select" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes_insert" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes_update" ON public.gpx_routes;
DROP POLICY IF EXISTS "gpx_routes_delete" ON public.gpx_routes;

CREATE POLICY "gpx_routes_select"
  ON public.gpx_routes FOR SELECT TO authenticated, anon
  USING (is_public = TRUE OR auth.uid() = author_id);

CREATE POLICY "gpx_routes_insert"
  ON public.gpx_routes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gpx_routes_update"
  ON public.gpx_routes FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "gpx_routes_delete"
  ON public.gpx_routes FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE 'navride_gpx%'
ORDER BY policyname;
