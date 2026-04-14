@echo off
echo ==========================================
echo   F1 Telemetry Dashboard - Startup Script
echo ==========================================
echo.

:: Start Backend Server in new window
echo Starting Backend (Flask) on http://localhost:5000 ...
start "F1 Backend" cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt && python app.py"

:: Wait a bit for backend to initialize
timeout /t 5 /nobreak >nul

:: Start Frontend Server in new window
echo Starting Frontend (Vite) on http://localhost:5173 ...
start "F1 Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

:: Wait for frontend to start
timeout /t 10 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo   Project started! Browser opening...
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:5173
echo ==========================================
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
