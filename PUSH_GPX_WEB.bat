@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git add app/mis-rutas/ lib/site/navigation.ts components/gpx/GpxEditor.tsx
git commit -m "feat(rutas): pagina mis-rutas + sync GPX + enlace navbar"
git push > push_gpx_web_result.txt 2>&1
echo Codigo: %errorlevel% >> push_gpx_web_result.txt
type push_gpx_web_result.txt
echo.
echo === LISTO Web ===
pause
