@echo off
TITLE Student Admission System - Production Server Launcher
echo ===================================================================
echo   Student Admission System (FastAPI + Async Database + React)
echo ===================================================================
echo.
echo [1/3] Launching FastAPI Backend Server (Port 8090)...
start "FastAPI Backend" /min cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8090 --reload"

echo [2/3] Launching React Frontend Server (Port 3000)...
start "React Frontend" /min cmd /k "cd /d %~dp0frontend && cmd /c npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening Student Admission Portal in your default browser...
start http://localhost:3000

echo.
echo ===================================================================
echo   System Running Live!
echo   - Web Admission Portal: http://localhost:3000
echo   - Interactive API Docs: http://127.0.0.1:8090/docs
echo   - Service Health Check: http://127.0.0.1:8090/health
echo ===================================================================
timeout /t 5
