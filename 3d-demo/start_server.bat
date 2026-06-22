@echo off
echo ========================================
echo  Starting Three.js Scene Demo Server
echo ========================================
echo.
echo  Server will start at:
echo  http://localhost:8000
echo.
echo  Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause