@echo off
echo ================================================================================
echo   GOOGLE ADS ACCOUNT IMPORTER
echo ================================================================================
echo.
echo This tool will fetch all accounts from your MCC and let you select which
echo ones to configure for the dashboard.
echo.
echo Press any key to continue...
pause >nul
echo.
python import_accounts.py
echo.
pause
