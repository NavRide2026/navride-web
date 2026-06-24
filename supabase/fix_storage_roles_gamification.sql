-- ============================================================
-- NavRide — fix_storage_roles_gamification.sql
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- Seguro de re-ejecutar (idempotente).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- BLOQUE 1: Eliminar políticas antiguas de storage (API vieja)
-- ────────────────────────────────────────────────────────────
-- La migración anterior usó INSERT INTO storage.policies (API obsoleta).
-- Borramos esas entradas y creamos las políticas correctas en storage.objects.

DELETE FROM storage.policies WHERE bucket_id = 'gpx';

-- ────────────────────────────────────────────────────────────
-- BLOQUE 2: Políticas modernas sobre storage.objects
-- ────────────────────────────────────────────────────────────

-- Lectura pública: cualquiera puede descargar GPX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'gpx: public read'
  ) THEN
    CREATE POLICY "gpx: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'gpx');
  END IF;
END;
$$;

-- Subida autenticada: solo puedes subir a tu propia carpeta (user_id/...)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'gpx: authenticated upload own folder'
  ) THEN
    CREATE POLICY "gpx: authenticated upload own folder"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'gpx' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END;
$$;

-- Borrado autenticado: solo puedes borrar tus propios archivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'gpx: authenticated delete own'
  ) THEN
    CREATE POLICY "gpx: authenticated delete own"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'gpx' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- BLOQUE 3: Columnas de gamificación en user_profiles
-- ────────────────────────────────────────────────────────────

-- Columna role (admin / police / user)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin', 'police'));

-- Columna puntos de gamificación
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- Contador de avisos creados (para stats de perfil)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS total_alerts INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- BLOQUE 4: Asignar rol admin al usuario administrador
-- ────────────────────────────────────────────────────────────

-- Crea o actualiza el perfil de navride@outlook.com con rol admin.
-- Si user_profiles aún no tiene fila para este usuario, la crea.
INSERT INTO public.user_profiles (id, display_name, role, points, total_alerts)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'Admin'),
  'admin',
  0,
  0
FROM auth.users u
WHERE u.email = 'navride@outlook.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin';

-- ────────────────────────────────────────────────────────────
-- BLOQUE 5: Política RLS en user_profiles para lectura propia
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: read own'
  ) THEN
    CREATE POLICY "user_profiles: read own"
      ON public.user_profiles FOR SELECT
      USING (auth.uid() = id OR auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: upsert own'
  ) THEN
    CREATE POLICY "user_profiles: upsert own"
      ON public.user_profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: update own'
  ) THEN
    CREATE POLICY "user_profiles: update own"
      ON public.user_profiles FOR UPDATE
      USING (auth.uid() = id OR auth.role() = 'service_role');
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- BLOQUE 6: Recargar caché de PostgREST
-- ────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────
-- Verificación final
-- ────────────────────────────────────────────────────────────

SELECT
  up.id,
  u.email,
  up.display_name,
  up.role,
  up.points,
  up.total_alerts
FROM public.user_profiles up
JOIN auth.users u ON u.id = up.id
ORDER BY up.role DESC
LIMIT 10;
