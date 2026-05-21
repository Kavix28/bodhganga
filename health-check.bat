@echo off
SETLOCAL EnableDelayedExpansion
title BodhGanga Academy - Health Check Utility

:: Enable ANSI colors
reg query HKCU\Console /v VirtualTerminalLevel >nul 2>&1
if %errorlevel% neq 0 (
    reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
)

for /F %%A in ('echo prompt $E ^| cmd') do set "ESC=%%A"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "CYAN=%ESC%[36m"
set "WHITE=%ESC%[37m"
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
echo %BOLD%             Full-Stack Diagnostics ^& Health Dashboard%RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo.

:: Init Status Vars
set "STATUS_MONGO=%RED%OFFLINE%RESET%"
set "STATUS_BACKEND=%RED%OFFLINE%RESET%"
set "STATUS_DEV_FRONT=%RED%OFFLINE%RESET%"
set "STATUS_PROD_FRONT=%RED%OFFLINE%RESET%"

set "PID_MONGO=N/A"
set "PID_BACKEND=N/A"
set "PID_DEV_FRONT=N/A"
set "PID_PROD_FRONT=N/A"

:: 1. Scan Ports
echo %CYAN%Scanning listener bindings on active ports...%RESET%

:: MongoDB Port 27017
netstat -ano | findstr :27017 | findstr LISTENING >tmp_net.txt 2>&1
if %errorlevel% eq 0 (
    set "STATUS_MONGO=%GREEN%ONLINE%RESET%"
    for /f "tokens=5" %%a in (tmp_net.txt) do set "PID_MONGO=%%a"
)

:: Backend Port 9090
netstat -ano | findstr :9090 | findstr LISTENING >tmp_net.txt 2>&1
if %errorlevel% eq 0 (
    set "STATUS_BACKEND=%GREEN%ONLINE%RESET%"
    for /f "tokens=5" %%a in (tmp_net.txt) do set "PID_BACKEND=%%a"
)

:: Dev Frontend Port 5173
netstat -ano | findstr :5173 | findstr LISTENING >tmp_net.txt 2>&1
if %errorlevel% eq 0 (
    set "STATUS_DEV_FRONT=%GREEN%ONLINE%RESET%"
    for /f "tokens=5" %%a in (tmp_net.txt) do set "PID_DEV_FRONT=%%a"
)

:: Prod Frontend Port 80
netstat -ano | findstr :80 | findstr LISTENING >tmp_net.txt 2>&1
if %errorlevel% eq 0 (
    set "STATUS_PROD_FRONT=%GREEN%ONLINE%RESET%"
    for /f "tokens=5" %%a in (tmp_net.txt) do set "PID_PROD_FRONT=%%a"
)

del tmp_net.txt >nul 2>&1

:: 2. REST API Diagnostic Polling
set "API_HEALTH=%RED%UNREACHABLE%RESET%"
set "API_MESSAGE=No API response received from Spring Boot."

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:9090/api/auth/health' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% eq 0 (
    set "API_HEALTH=%GREEN%HEALTHY (HTTP 200)%RESET%"
    for /f "delims=" %%x in ('powershell -Command "(Invoke-RestMethod -Uri 'http://localhost:9090/api/auth/health' -UseBasicParsing).status"') do set "API_MESSAGE=Spring Boot Health Status: %%x"
)

:: 3. Render Status Table
echo.
echo %BOLD%╔════════════════════════════════════════════════════════════════════╗%RESET%
echo %BOLD%║                     BODHGANGA SERVICE STATUS                       ║%RESET%
echo %BOLD%╠══════════════════════════════╦══════════════════╦══════════════════╣%RESET%
echo %BOLD%║ Service Name                 ║ Status           ║ Process PID      ║%RESET%
echo %BOLD%╠══════════════════════════════╬══════════════════╬══════════════════╣%RESET%
echo ║ MongoDB (Port 27017)         ║ !STATUS_MONGO!          ║ !PID_MONGO!              ║
echo ║ Spring Boot Backend (9090)   ║ !STATUS_BACKEND!          ║ !PID_BACKEND!              ║
echo ║ React Dev Frontend (5173)    ║ !STATUS_DEV_FRONT!          ║ !PID_DEV_FRONT!              ║
echo ║ Production Frontend (Port 80)║ !STATUS_PROD_FRONT!          ║ !PID_PROD_FRONT!              ║
echo %BOLD%╚══════════════════════════════╩══════════════════╩══════════════════╝%RESET%
echo.
echo %BOLD%API Diagnostic Health:%RESET% !API_HEALTH!
echo %CYAN%!API_MESSAGE!%RESET%
echo.

:: 4. Recommendations
echo %BOLD%Quick Diagnostics ^& Recommendations:%RESET%
if "!STATUS_MONGO!"=="%RED%OFFLINE%RESET%" (
    echo   %YELLOW%[!] MongoDB is offline. Launch local MongoDB or Docker container to enable auth ^& purchase flows.%RESET%
)
if "!STATUS_BACKEND!"=="%RED%OFFLINE%RESET%" (
    echo   %YELLOW%[!] Backend is offline. Run 'start-dev.bat' or 'start-prod.bat' to start the Spring Boot Tomcat.%RESET%
)
if "!STATUS_DEV_FRONT!"=="%RED%OFFLINE%RESET%" (
    if "!STATUS_PROD_FRONT!"=="%RED%OFFLINE%RESET%" (
        echo   %YELLOW%[!] Both Dev and Production frontends are offline. Run a launcher to start a server.%RESET%
    )
)
if "!STATUS_BACKEND!"=="%GREEN%ONLINE%RESET%" (
    if "!STATUS_MONGO!"=="%GREEN%ONLINE%RESET%" (
        echo   %GREEN%[✓] Core stack (Backend + Database) is fully synchronized and running perfectly.%RESET%
    )
)
echo.
echo %CYAN%======================================================================%RESET%
pause
exit /b 0
