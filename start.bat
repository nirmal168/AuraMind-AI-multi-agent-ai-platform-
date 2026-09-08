@echo off
title Multi-Agent AI Platform Launcher
echo ====================================================
echo Starting Multi-Agent AI Platform...
echo ====================================================

start "Backend Microservices (5050, 5001-5004)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend UI (Port 5174)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend Gateway (Port 5050), Services (5001-5004) and Frontend (Port 5174) are launching...
echo Opening browser at: http://localhost:5174
echo ====================================================

timeout /t 4 /nobreak >nul
start http://localhost:5174
