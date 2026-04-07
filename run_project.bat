@echo off
setlocal

cd /d "%~dp0"

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "BACKEND_PY=%BACKEND_DIR%\.venv\Scripts\python.exe"
set "BACKEND_READY_URL=http://localhost:5000/api/seasons"
set "FRONTEND_URL=http://localhost:5173"
set "INSTALLER=%ROOT_DIR%install_dependencies.bat"

echo ==========================================
echo F1 Telemetry Dashboard Launcher
echo ==========================================
echo.

if not exist "%BACKEND_PY%" (
    echo Backend environment is missing. Running installer first...
    echo.
    call "%INSTALLER%"
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo Frontend dependencies are missing. Running installer first...
    echo.
    call "%INSTALLER%"
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

if not exist "%BACKEND_PY%" (
    echo [ERROR] Backend virtual environment is still missing after installation.
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [ERROR] Frontend node_modules is still missing after installation.
    pause
    exit /b 1
)

echo Starting backend in a new window...
start "F1 Backend" /D "%BACKEND_DIR%" cmd /k run_backend.bat

echo.
echo Waiting for backend to become available at %BACKEND_READY_URL% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$url='%BACKEND_READY_URL%';" ^
  "$ready=$false;" ^
  "for ($i=0; $i -lt 90; $i++) {" ^
  "  try {" ^
  "    Invoke-WebRequest -Uri $url -UseBasicParsing | Out-Null;" ^
  "    $ready=$true;" ^
  "    break;" ^
  "  } catch {" ^
  "    Start-Sleep -Seconds 1;" ^
  "  }" ^
  "}" ^
  "if ($ready) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo.
    echo [WARNING] The backend did not respond in time.
    echo Starting the frontend anyway, but the selector may fall back to demo data until Flask is ready.
) else (
    echo Backend is ready.
)

echo Starting frontend in a new window...
start "F1 Frontend" /D "%FRONTEND_DIR%" cmd /k run_frontend.bat

echo.
echo Waiting for frontend to become available at %FRONTEND_URL% ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$url='%FRONTEND_URL%';" ^
  "$ready=$false;" ^
  "for ($i=0; $i -lt 90; $i++) {" ^
  "  try {" ^
  "    Invoke-WebRequest -Uri $url -UseBasicParsing | Out-Null;" ^
  "    $ready=$true;" ^
  "    break;" ^
  "  } catch {" ^
  "    Start-Sleep -Seconds 1;" ^
  "  }" ^
  "}" ^
  "if ($ready) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo.
    echo [WARNING] The frontend did not respond in time.
    echo You can still open %FRONTEND_URL% manually once the server finishes starting.
    pause
    exit /b 1
)

echo Opening project in your default browser...
start "" "%FRONTEND_URL%"

echo.
echo The app is running.
echo Backend window: Flask API on http://localhost:5000
echo Frontend window: Vite app on %FRONTEND_URL%
echo.
echo Closing this launcher window will not stop the app.
timeout /t 3 >nul

endlocal
