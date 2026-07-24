@echo off
rem Restore Kasian Suk data into Supabase (double-click to run)
rem The Node script lists backups and asks for confirmation in Thai
rem Full recovery steps: docs\backup-restore.md
chcp 65001 >nul
cd /d "%~dp0"
node scripts\restore.mjs
echo.
pause
