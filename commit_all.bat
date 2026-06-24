@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "feat: alertas votos+TTL, perfiles usuario, API votar, Edge Function expire-alerts"
git push
echo Listo. Pulsa cualquier tecla.
pause
