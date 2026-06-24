@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: archivos pendientes mapa-en-vivo, perfil, supabase client"
git push
echo Listo. Pulsa cualquier tecla.
pause
