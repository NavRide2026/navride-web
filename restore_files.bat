@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git checkout -- app/perfil/page.tsx app/mapa-en-vivo/page.tsx
git status --short
echo Listo. Pulsa cualquier tecla.
pause
