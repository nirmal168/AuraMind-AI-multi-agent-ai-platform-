@echo off
title Multi-Agent AI Platform Launcher
echo ====================================================
echo Starting Multi-Agent AI Platform...
echo ====================================================

start "Backend Microservices (5000-5004)" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend UI (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend (Ports 5000-5004) and Frontend (Port 5173) are running!
echo Open your browser at: http://localhost:5173
echo ====================================================
