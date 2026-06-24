-- ============================================================
-- NavRide — 20260624_profiles_votos_ttl.sql
-- BLOQUE 1: Perfil usuario + privacidad
-- BLOQUE 2: Votaciones con deduplicación
-- BLOQUE 3: TTL inteligente (ver Edge Function expire-alerts)
-- Seguro de re-ejecutar (idempotente).
-- ============================================================

-- ── BLOQUE 1A: Columnas nuevas en user_profiles ──────────────

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS show_username_on_reports BOOLEAN NOT NULL DEFAULT false;

-- ── BLOQUE 1B: user_id en route_alerts ───────────────────────
-- Permite saber qué usuario reportó cada alerta (nullable → anónimas OK).

ALTER TABLE public.route_alerts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_route_alerts_user_id
  ON public.route_alerts(user_id)
  WHERE user_id IS NOT NULL;

-- ── BLOQUE 1C: Storage bucket avatares ───────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars: public read'
  ) THEN
    CREATE POLICY "avatars: public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars: authenticated upload own folder'
  ) THEN
    CREATE POLICY "avatars: authenticated upload own folder"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars: authenticated update own folder'
  ) THEN
    CREATE POLICY "avatars: authenticated update own folder"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END;
$$;

-- ── BLOQUE 1D: RLS — lectura pública de perfiles que optaron in ──

-- Añadir política sin borrar las existentes (RLS usa OR semántico).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'user_profiles: public reporters'
  ) THEN
    CREATE POLICY "user_profiles: public reporters"
      ON public.user_profiles FOR SELECT
      USING (show_username_on_reports = true);
  END IF;
END;
$$;

-- ── BLOQUE 2: Tabla alerta_votos (previene duplicados por usuario) ──

CREATE TABLE IF NOT EXISTS public.alerta_votos (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id  UUID        NOT NULL REFERENCES public.route_alerts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voto       TEXT        NOT NULL CHECK (voto IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(alerta_id, user_id)
);

ALTER TABLE public.alerta_votos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alerta_votos' AND policyname = 'alerta_votos: read own'
  ) THEN
    CREATE POLICY "alerta_votos: read own"
      ON public.alerta_votos FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alerta_votos' AND policyname = 'alerta_votos: insert own'
  ) THEN
    CREATE POLICY "alerta_votos: insert own"
      ON public.alerta_votos FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alerta_votos' AND policyname = 'alerta_votos: update own'
  ) THEN
    CREATE POLICY "alerta_votos: update own"
      ON public.alerta_votos FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END;
$$;

-- ── Notificar a PostgREST que recargue el esquema ─────────────

NOTIFY pgrst, 'reload schema';

-- ── Verificación ──────────────────────────────────────────────

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('username', 'avatar_url', 'show_username_on_reports')
ORDER BY column_name;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'route_alerts' AND column_name = 'user_id';
