@echo off
echo ==========================================
echo   F1 Telemetry Dashboard - Fast Startup
echo ==========================================
echo.

:: Start Backend Server
echo Starting Backend (Flask) on http://localhost:5000 ...
start "F1 Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

:: Wait for backend
timeout /t 3 /nobreak >nul

:: Start Frontend Server
echo Starting Frontend (Vite) on http://localhost:5173 ...
start "F1 Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait for servers
timeout /t 8 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo   Project started!
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:5173
echo ==========================================
pause >nul
