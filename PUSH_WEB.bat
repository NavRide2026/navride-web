@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
del /f /q ".git\index.lock" 2>nul
git push > push_web_result.txt 2>&1
echo Codigo: %errorlevel% >> push_web_result.txt
type push_web_result.txt
echo.
echo === LISTO ===
pause
