@echo off
setlocal

cd /d "%~dp0"

set "BACKEND_PY=backend\.venv\Scripts\python.exe"

echo ==========================================
echo F1 Telemetry Dashboard Dependency Installer
echo ==========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not available in PATH.
    echo Install Python 3.11+ and run this script again.
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or not available in PATH.
    echo Install Node.js and run this script again.
    exit /b 1
)

if not exist "backend\requirements.txt" (
    echo [ERROR] backend\requirements.txt not found.
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] frontend\package.json not found.
    exit /b 1
)

echo [1/4] Creating backend virtual environment...
if not exist "backend\.venv" (
    python -m venv "backend\.venv"
    if errorlevel 1 (
        echo [ERROR] Failed to create backend virtual environment.
        exit /b 1
    )
) else (
    echo Backend virtual environment already exists. Reusing it.
)

echo.
echo [2/4] Upgrading pip in backend virtual environment...
call "%BACKEND_PY%" -m pip install --upgrade pip setuptools wheel
if errorlevel 1 (
    echo [ERROR] Failed to upgrade pip.
    exit /b 1
)

echo.
echo [3/4] Installing backend Python dependencies...
call "%BACKEND_PY%" -m pip install --upgrade -r "backend\requirements.txt"
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies.
    exit /b 1
)

echo Verifying backend Python dependencies...
call "%BACKEND_PY%" -c "import flask, flask_cors, fastf1, pandas, numpy, sklearn, joblib; print('Backend dependency check passed.')"
if errorlevel 1 (
    echo [ERROR] Backend dependency verification failed.
    exit /b 1
)

echo.
echo [4/4] Installing frontend Node dependencies...
pushd "frontend"
call npm install --include=dev
if errorlevel 1 (
    popd
    echo [ERROR] Failed to install frontend dependencies.
    exit /b 1
)

echo Verifying frontend dependencies...
call npm ls --depth=0 react react-dom vite @vitejs/plugin-react axios framer-motion lucide-react recharts tailwindcss >nul
if errorlevel 1 (
    popd
    echo [ERROR] Frontend dependency verification failed.
    exit /b 1
)
popd

echo.
echo ==========================================
echo All dependencies installed successfully.
echo ==========================================
echo.
echo To run the backend:
echo   cd backend
echo   .venv\Scripts\python.exe app.py
echo.
echo To run the frontend:
echo   cd frontend
echo   npm run dev
echo.

endlocal
