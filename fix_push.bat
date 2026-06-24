@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "fix: supabase client fallback PUBLISHABLE_KEY + ANON_KEY para Vercel"
git push
echo Listo. Pulsa cualquier tecla.
pause
