@echo off
echo ================================================================================
echo   GOOGLE ADS AGENT DASHBOARD
echo ================================================================================
echo.
echo Installing required packages...
pip install -q -r requirements_dashboard.txt
echo.
echo Starting dashboard...
echo.
echo ================================================================================
echo.
echo   Open your browser to: http://localhost:5000
echo.
echo   Press Ctrl+C to stop the dashboard
echo.
echo ================================================================================
echo.
python dashboard.py
pause
