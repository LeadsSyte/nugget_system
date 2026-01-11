@echo off
REM Helper script to run agent for specific client accounts

if "%1"=="" (
    echo Usage: run_for_client.bat [client_id]
    echo.
    echo Available clients:
    echo   8022306092  - Account 802-230-6092
    echo.
    echo Example: run_for_client.bat 8022306092
    exit /b 1
)

set CLIENT_ID=%1

if not exist ".env.client_%CLIENT_ID%" (
    echo Error: Config file not found: .env.client_%CLIENT_ID%
    echo.
    echo Available config files:
    dir /b .env.client_*
    exit /b 1
)

echo ========================================
echo Switching to client: %CLIENT_ID%
echo ========================================
echo.

REM Copy client-specific config to .env
copy /Y ".env.client_%CLIENT_ID%" .env >nul

echo ✓ Loaded config for client %CLIENT_ID%
echo.
echo Starting optimization agent...
echo.

REM Clear Python cache
del /S /Q __pycache__ >nul 2>&1
del /S /Q src\__pycache__ >nul 2>&1

REM Run the agent
python run_agent.py

echo.
echo ========================================
echo Agent completed for client: %CLIENT_ID%
echo ========================================
