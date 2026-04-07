@echo off
setlocal

cd /d "%~dp0"

call ".\.venv\Scripts\python.exe" app.py
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] Backend exited with code %EXIT_CODE%.
    pause
)

endlocal & exit /b %EXIT_CODE%
