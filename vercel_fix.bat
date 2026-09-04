@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
taskkill /f /im git.exe 2>nul
ping -n 2 127.0.0.1 >nul
del /f /q ".git\index.lock" 2>nul
git add vercel.json
git commit -m "fix: restaurar vercel.json"
git push
