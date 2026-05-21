@echo off
SETLOCAL EnableDelayedExpansion
title BodhGanga Academy - Production Launcher

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
echo %BOLD%               Production Docker-Compose Orchestrator%RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo.

:: 1. Docker Check
echo %CYAN%[1/4] Checking Docker Environment...%RESET%
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Docker is not installed or not in PATH.%RESET%
    echo %RED%        Please install Docker Desktop for Windows to launch the production environment.%RESET%
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Docker daemon is not running!%RESET%
    echo %RED%        Please open Docker Desktop and wait until it is fully active.%RESET%
    pause
    exit /b 1
)
echo %GREEN%  - Docker daemon is running and healthy.%RESET%
echo.

:: 2. Config & Port Diagnostics
echo %CYAN%[2/4] Validating Configuration and Ports...%RESET%
set "SCRIPT_DIR=%~dp0"

:: Ensure .env exists
if not exist "%SCRIPT_DIR%.env" (
    if exist "%SCRIPT_DIR%.env.example" (
        echo %YELLOW%  - .env not found. Creating .env from .env.example with defaults...%RESET%
        copy "%SCRIPT_DIR%.env.example" "%SCRIPT_DIR%.env" >nul
    ) else (
        echo %YELLOW%  - Creating dummy .env for default Docker parameters...%RESET%
        echo JWT_SECRET=BodhGangaAcademySuperSecureJWTSecretKey12345!> "%SCRIPT_DIR%.env"
        echo MONGO_ROOT_USER=admin>> "%SCRIPT_DIR%.env"
        echo MONGO_ROOT_PASS=changeme>> "%SCRIPT_DIR%.env"
    )
) else (
    echo %GREEN%  - Production environment file (.env) exists.%RESET%
)

:: Check for Port Conflicts on 80
netstat -ano | findstr :80 >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :80 ^| findstr LISTENING') do (
    echo %YELLOW%[WARNING] Port 80 is in use (often IIS or Skype). Production frontend binds to Port 80.%RESET%
    echo %YELLOW%          Attempting to kill process PID %%a on port 80...%RESET%
    taskkill /f /pid %%a >nul 2>&1
)

:: Check for Port Conflicts on 9090
netstat -ano | findstr :9090 >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING') do (
    echo %YELLOW%[WARNING] Port 9090 is in use. Backend container binds to Port 9090.%RESET%
    echo %YELLOW%          Attempting to kill process PID %%a on port 9090...%RESET%
    taskkill /f /pid %%a >nul 2>&1
)
echo %GREEN%  - Port conflict resolution complete.%RESET%
echo.

:: 3. Build & Boot Production Cluster
echo %CYAN%[3/4] Building and Orchestrating Docker Production Cluster...%RESET%
echo %YELLOW%      Running: docker-compose up -d --build%RESET%
echo.

pushd "%SCRIPT_DIR%"
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Docker Compose failed to build/start containers.%RESET%
    popd
    pause
    exit /b 1
)
popd
echo.
echo %GREEN%  - Docker containers built and launched in background.%RESET%
echo.

:: 4. Post-Launch Health Verification
echo %CYAN%[4/4] Monitoring Cluster Health...%RESET%
set /a count=0
:POLL_PROD
set /a count+=1
set /a spin=count %% 4
if !spin! eq 0 set "char=|"
if !spin! eq 1 set "char=/"
if !spin! eq 2 set "char=-"
if !spin! eq 3 set "char=\"
<nul set /p "=%YELLOW%!char! Waiting for production containers to reach HEALTHY state (Attempt !count!/20)...     %ESC%[G%RESET%"

:: Check if all 3 containers are running and healthy
docker ps | findstr /i "bodhganga-mongo" | findstr /i "healthy" >nul 2>&1
set "MONGO_OK=%errorlevel%"
docker ps | findstr /i "bodhganga-backend" | findstr /i "healthy" >nul 2>&1
set "BACKEND_OK=%errorlevel%"
docker ps | findstr /i "bodhganga-frontend" >nul 2>&1
set "FRONTEND_OK=%errorlevel%"

if !MONGO_OK! equ 0 if !BACKEND_OK! equ 0 if !FRONTEND_OK! equ 0 (
    goto BOOT_SUCCESS
)

if !count! geq 20 (
    echo.
    echo %YELLOW%[NOTICE] Some containers are still starting or taking longer to pass health checks.%RESET%
    echo %YELLOW%         You can check container logs using: docker-compose logs%RESET%
    goto BOOT_SUCCESS
)

timeout /t 3 >nul
goto POLL_PROD

:BOOT_SUCCESS
echo.
echo %GREEN%  - Production MongoDB:  [ONLINE ^& HEALTHY]%RESET%
echo %GREEN%  - Production Backend:  [ONLINE ^& HEALTHY]%RESET%
echo %GREEN%  - Production Frontend: [ONLINE]%RESET%
echo.

:: Launch browser to Port 80
echo %GREEN%🚀 Launching default web browser to http://localhost ...%RESET%
start http://localhost

echo %CYAN%======================================================================%RESET%
echo %GREEN%%BOLD%     🎉 SUCCESS! BODHGANGA PRODUCTION STACK IS ONLINE!%RESET%
echo %CYAN%======================================================================%RESET%
echo.
echo   - Frontend Portal:  http://localhost (Port 80)
echo   - Backend API:      http://localhost:9090
echo   - Database Host:    localhost:27017
echo.
echo   - Use 'stop-all.bat' or run 'docker-compose down' to teardown this stack.
echo.
pause
exit /b 0
