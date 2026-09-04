@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
taskkill /f /im git.exe 2>nul
powershell -command "Remove-Item '.git\index.lock' -Force -ErrorAction SilentlyContinue"
ping -n 2 127.0.0.1 >nul
git add vercel.json
git status --short
git commit -m "fix: restaurar vercel.json" 
git push
