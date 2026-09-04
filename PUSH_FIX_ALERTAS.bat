@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git add app/mapa-en-vivo/page.tsx
git commit -m "fix(alertas): user_id -> author_id en INSERT route_alerts"
git push > push_fix_alertas_result.txt 2>&1
echo Codigo: %errorlevel% >> push_fix_alertas_result.txt
type push_fix_alertas_result.txt
echo.
echo === LISTO ===
pause
