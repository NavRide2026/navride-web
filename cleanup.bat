@echo off
cd /d "C:\Users\Nitropc\Desktop\web-navride\web-navride"
git rm --cached git_commit.bat
del /f /q git_commit.bat
git commit -m "chore: remove temp git_commit.bat"
git push
echo Listo. Pulsa cualquier tecla.
pause
