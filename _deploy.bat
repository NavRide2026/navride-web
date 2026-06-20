@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
echo === NavRide Web — Git commit y push ===
git add -A
git status
git commit -m "feat: Rider Dashboard completo (auth, login, mi-garaje, editor-gpx, MapLibre)"
git push
echo.
echo === HECHO. Vercel desplegara automaticamente. ===
pause
