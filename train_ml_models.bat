@echo off
setlocal

cd /d "%~dp0"

set "BACKEND_PY=backend\.venv\Scripts\python.exe"
set "TRAINER=backend\scripts\train_ml_models.py"

if not exist "%BACKEND_PY%" (
    echo [ERROR] Backend Python environment not found.
    echo Run install_dependencies.bat first.
    pause
    exit /b 1
)

if not exist "%TRAINER%" (
    echo [ERROR] ML trainer not found: %TRAINER%
    pause
    exit /b 1
)

if "%~1"=="" (
    call "%BACKEND_PY%" "%TRAINER%"
) else (
    call "%BACKEND_PY%" "%TRAINER%" %*
)

set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] ML training failed with code %EXIT_CODE%.
    pause
)

endlocal & exit /b %EXIT_CODE%
