@echo off
setlocal

cd /d "%~dp0"

set "BACKEND_PY=backend\.venv\Scripts\python.exe"
set "GENERATOR=backend\scripts\generate_dataset.py"

if not exist "%BACKEND_PY%" (
    echo [ERROR] Backend Python environment not found.
    echo Run install_dependencies.bat first.
    pause
    exit /b 1
)

if not exist "%GENERATOR%" (
    echo [ERROR] Dataset generator not found: %GENERATOR%
    pause
    exit /b 1
)

if "%~1"=="" (
    echo No arguments provided.
    echo Generating default 2021-2024 all Race-session lap dataset...
    echo.
    call "%BACKEND_PY%" "%GENERATOR%" --years 2021 2022 2023 2024 --all-events --sessions Race --output "backend\data\fastf1_2021_2024_all_race_laps.csv"
) else (
    call "%BACKEND_PY%" "%GENERATOR%" %*
)

set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo [ERROR] Dataset generation failed with code %EXIT_CODE%.
    pause
)

endlocal & exit /b %EXIT_CODE%
