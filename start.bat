@echo off
TITLE SMART SWITCH CONVERT - System Launcher
COLOR 0B

echo ===============================================================================
echo     ____ __  __    _    ____ _____   ______        _____ _____ ____ _   _
echo    / ___^|  \/  ^|  / \  ^|  _ \_   _^| / ___\ \      / /_ _^|_   _/ ___^| ^| ^| ^|
echo    \___ \ ^|\/^| ^| / _ \ ^| ^|_) ^|^| ^|   \___ \\ \ /\ / / ^| ^|   ^| ^|^| ^|   ^| ^|_^| ^|
echo     ___) ^| ^|  ^| ^|/ ___ \^|  _ ^< ^| ^|    ___) |\ V  V /  ^| ^|   ^| ^|^| ^|___^|  _  ^|
echo    ^|____/^|_^|  ^|_/_/   \_\_^| \_\^|_^|   ^|____/  \_/\_/  ^|___^|  ^|_^| \____^|_^| ^|_^|
echo.
echo           UNIVERSAL SMART SWITCH & ENERGY MONITORING SYSTEM
echo ===============================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org (LTS recommended).
    pause
    exit /b 1
)

echo [1/4] Checking Node.js environment...
node -v
npm -v
echo.

:: Check backend dependencies
if not exist "backend\node_modules" (
    echo [2/4] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo [2/4] Backend dependencies already installed.
)

:: Check frontend dependencies
if not exist "frontend\node_modules" (
    echo [3/4] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo [3/4] Frontend dependencies already installed.
)

echo.
echo [4/4] Starting SMART SWITCH CONVERT services...
echo.

:: Launch backend in new window
start "Smart Switch Backend Proxy (:5000)" cmd /k "cd backend && npm start"

:: Wait 1.5 seconds for backend initialization
timeout /t 2 /nobreak >nul

:: Launch frontend dev server
echo Starting Frontend Web App on http://localhost:5173 ...
cd frontend
start http://localhost:5173
call npm run dev

pause
