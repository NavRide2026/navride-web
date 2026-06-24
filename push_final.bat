@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
taskkill /f /im git.exe 2>nul
del /f /q ".git\index.lock" 2>nul
git add -A
git commit -m "fix: restaurar archivos truncados + limpiar bat files" --allow-empty
git push
