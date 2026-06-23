-- supabase/expire_alerts.sql
-- Ciclo de vida automático de route_alerts: caducidad por tiempo y por votos.

-- ── 1. Caducidad por tiempo ─────────────────────────────────────────────────
-- Desactiva alertas que llevan más de 4 horas activas.

CREATE OR REPLACE FUNCTION expire_old_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE route_alerts
  SET is_active = false
  WHERE created_at < NOW() - INTERVAL '4 hours'
    AND is_active = true;
END;
$$;

-- Para activar la ejecución automática cada 15 minutos con pg_cron:
-- 1. En el Dashboard de Supabase → Database → Extensions → habilitar "pg_cron"
-- 2. Ejecutar la siguiente instrucción en el SQL Editor:
--
--    SELECT cron.schedule('expire-alerts', '*/15 * * * *', 'SELECT expire_old_alerts()');
--
-- Para ver los jobs activos:
--    SELECT * FROM cron.job;
--
-- Para eliminar el job si fuera necesario:
--    SELECT cron.unschedule('expire-alerts');


-- ── 2. Caducidad por votos negativos ────────────────────────────────────────
-- Desactiva una alerta cuando tiene 3 o más votos negativos y más votos
-- negativos que positivos. Se ejecuta como BEFORE trigger en cada UPDATE.

CREATE OR REPLACE FUNCTION votes_auto_expire()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.votes_down >= 3 AND NEW.votes_down > NEW.votes_up THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_votes_auto_expire ON route_alerts;
CREATE TRIGGER trg_votes_auto_expire
  BEFORE UPDATE OF votes_down ON route_alerts
  FOR EACH ROW
  EXECUTE FUNCTION votes_auto_expire();
