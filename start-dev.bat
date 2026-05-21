@echo off
SETLOCAL EnableDelayedExpansion
title BodhGanga Academy - Dev Launcher

:: Enable ANSI colors if supported
reg query HKCU\Console /v VirtualTerminalLevel >nul 2>&1
if %errorlevel% neq 0 (
    reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
)

:: Standard ESC code for batch
for /F %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "CYAN=%ESC%[36m"
set "BOLD=%ESC%[1m"
set "RESET=%ESC%[0m"

cls
echo %CYAN%%BOLD%======================================================================%RESET%
echo %GREEN%%BOLD%   ____            _ _     ____                                       %RESET%
echo %GREEN%%BOLD%  |  _ \  ___   __| | |__ / ___| __ _ _ __   __ _  __ _                  %RESET%
echo %GREEN%%BOLD%  | |_) |/ _ \ / _` | '_ \ |  _ / _` | '_ \ / _` |/ _` |                 %RESET%
echo %GREEN%%BOLD%  |  _ <| (_) | (_| | | | | |_| | (_| | | | | (_| | (_| |                 %RESET%
echo %GREEN%%BOLD%  |_| \_\\___/ \__,_|_| |_|\____|\__,_|_| |_|\__, |\__,_|                 %RESET%
echo %GREEN%%BOLD%                                             |___/                      %RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo %BOLD%              Premium Full-Stack Dev Orchestrator Suite%RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo.

:: 1. Dependency Checks
echo %CYAN%[1/5] Checking System Dependencies...%RESET%

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Java is not installed or not in PATH. JDK 17+ is required.%RESET%
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr /r "version"') do set "JAVA_VER=%%i"
echo %GREEN%  - Java Detected: %RESET%%JAVA_VER%

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Node.js is not installed or not in PATH. Node 18+ is required.%RESET%
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set "NODE_VER=%%i"
echo %GREEN%  - Node.js Detected: %RESET%%NODE_VER%
echo.

:: 2. Port & Database Validations
echo %CYAN%[2/5] Performing Port and Database Diagnostics...%RESET%

:: Check MongoDB port 27017
netstat -ano | findstr :27017 >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARNING] MongoDB port 27017 was not detected!%RESET%
    echo %YELLOW%          Please ensure a local MongoDB server or Docker container is running.%RESET%
    echo %YELLOW%          (Ignore this if MongoDB is running dynamically or on a non-standard port).%RESET%
    echo.
) else (
    echo %GREEN%  - MongoDB detected running on port 27017.%RESET%
)

:: Check for port conflicts on 9090 (Backend)
netstat -ano | findstr :9090 >nul 2>&1
if %errorlevel% eq 0 (
    echo %YELLOW%[WARNING] Port 9090 (Backend) is already in use.%RESET%
    echo %YELLOW%          Attempting to release port 9090...%RESET%
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING') do (
        echo Killing process PID %%a on port 9090...
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Check for port conflicts on 5173 (Frontend)
netstat -ano | findstr :5173 >nul 2>&1
if %errorlevel% eq 0 (
    echo %YELLOW%[WARNING] Port 5173 (Frontend) is already in use.%RESET%
    echo %YELLOW%          Attempting to release port 5173...%RESET%
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
        echo Killing process PID %%a on port 5173...
        taskkill /f /pid %%a >nul 2>&1
    )
)
echo %GREEN%  - Network ports validated and ready.%RESET%
echo.

:: 3. Log Directory Setup
echo %CYAN%[3/5] Cleaning and Configuring Dev Environment...%RESET%
set "SCRIPT_DIR=%~dp0"
set "LOG_DIR=%SCRIPT_DIR%.dev-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
del /q "%LOG_DIR%\*" >nul 2>&1
echo %GREEN%  - Logs prepared at %LOG_DIR%\%RESET%
echo.

:: 4. Start Spring Boot Backend
echo %CYAN%[4/5] Booting Spring Boot Tomcat Backend (Port 9090)...%RESET%
echo %YELLOW%      Stdout/Stderr streaming to .dev-logs\backend.log%RESET%

pushd "%SCRIPT_DIR%backend"
start /B "BodhGanga-Backend" cmd /c "call mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev > "%LOG_DIR%\backend.log" 2>&1"
popd

:: Wait & Poll health API
echo %YELLOW%      Waiting for backend to compile and startup...%RESET%
set /a count=0
:POLL_BACKEND
set /a count+=1
:: Print a spinner
set /a spin=count %% 4
if !spin! eq 0 set "char=|"
if !spin! eq 1 set "char=/"
if !spin! eq 2 set "char=-"
if !spin! eq 3 set "char=\"
<nul set /p "=%YELLOW%!char! Polling backend health endpoint (Attempt !count!/30)...     %ESC%[G%RESET%"

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:9090/api/auth/health' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    if !count! geq 30 (
        echo.
        echo %RED%[ERROR] Backend failed to start within 60 seconds.%RESET%
        echo %RED%        Please review the log: %LOG_DIR%\backend.log%RESET%
        pause
        exit /b 1
    )
    timeout /t 2 >nul
    goto POLL_BACKEND
)
echo.
echo %GREEN%  - Spring Boot Tomcat is HEALTHY and listening on http://localhost:9090%RESET%
echo.

:: 5. Start React Vite Frontend
echo %CYAN%[5/5] Booting React Vite Frontend (Port 5173)...%RESET%
echo %YELLOW%      Stdout/Stderr streaming to .dev-logs\frontend.log%RESET%

pushd "%SCRIPT_DIR%frontend"
:: Ensure dependencies are present
if not exist "node_modules\" (
    echo %YELLOW%      [WARN] node_modules missing. Running npm install...%RESET%
    call npm install --no-audit --no-fund >nul 2>&1
)
start /B "BodhGanga-Frontend" cmd /c "npm run dev > "%LOG_DIR%\frontend.log" 2>&1"
popd

timeout /t 3 >nul
echo %GREEN%  - React Vite server successfully launched on http://localhost:5173%RESET%
echo.

:: Launch Web Browser
echo %GREEN%🚀 Launching default web browser to http://localhost:5173 ...%RESET%
start http://localhost:5173

echo %CYAN%======================================================================%RESET%
echo %GREEN%%BOLD%     🎉 SUCCESS! BODHGANGA DEV ENVIRONMENT IS ALIVE AND HEALTHY!%RESET%
echo %CYAN%======================================================================%RESET%
echo.
echo   - Backend Service: http://localhost:9090
echo   - Frontend Portal:  http://localhost:5173
echo   - Dev Logs Folder:  %LOG_DIR%\
echo.
echo %YELLOW%[PRESS ANY KEY AT ANY TIME TO SHUT DOWN ALL SERVICES GRACEFULLY]%RESET%
echo.

pause >nul

:: Graceful Shutdown Cleanup
echo.
echo %YELLOW%⚙ Gracefully stopping all BodhGanga background services...%RESET%

:: Terminate Port 9090
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING') do (
    echo %CYAN%  - Terminating Spring Boot process (PID %%a)...%RESET%
    taskkill /f /pid %%a >nul 2>&1
)

:: Terminate Port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo %CYAN%  - Terminating React Vite process (PID %%a)...%RESET%
    taskkill /f /pid %%a >nul 2>&1
)

:: Find and terminate stray node or java processes inside this project path if any
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im java.exe >nul 2>&1

echo %GREEN%✓ All background processes terminated successfully.%RESET%
echo %GREEN%✓ Log files saved in %LOG_DIR%\%RESET%
echo.
pause
exit /b 0
