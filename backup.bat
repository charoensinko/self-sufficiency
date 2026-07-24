@echo off
rem Backup Kasian Suk data from Supabase (double-click to run)
rem Thai messages come from the Node script itself
chcp 65001 >nul
cd /d "%~dp0"
call npm run backup
echo.
pause
