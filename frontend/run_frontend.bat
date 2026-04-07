@echo off
setlocal

cd /d "%~dp0"

call npm.cmd run dev
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] Frontend exited with code %EXIT_CODE%.
    pause
)

endlocal & exit /b %EXIT_CODE%
