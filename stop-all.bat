@echo off
SETLOCAL EnableDelayedExpansion
title BodhGanga Academy - Stop All Services

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
echo %RED%%BOLD%   ____  _                _     _                                     %RESET%
echo %RED%%BOLD%  / ___|| |_ ___  _ __   / \   | | |                                  %RESET%
echo %RED%%BOLD%  \___ \| __/ _ \| '_ \ / _ \  | | |                                  %RESET%
echo %RED%%BOLD%   ___) | || (_) | |_) / ___ \ |_|_|                                  %RESET%
echo %RED%%BOLD%  |____/ \__\___/| .__/_/   \_\(_|_)                                  %RESET%
echo %RED%%BOLD%                 |_|                                                  %RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo %BOLD%            Graceful Teardown and Cleanup Service Suite%RESET%
echo %CYAN%%BOLD%======================================================================%RESET%
echo.

set "SCRIPT_DIR=%~dp0"

:: 1. Stop Dev Backend (9090)
echo %CYAN%Scanning for active local Dev Backend (Port 9090)...%RESET%
netstat -ano | findstr :9090 >nul 2>&1
if %errorlevel% eq 0 (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING') do (
        echo %RED%  - Found backend process running on PID %%a. Terminating...%RESET%
        taskkill /f /pid %%a >nul 2>&1
    )
) else (
    echo %GREEN%  - No active backend detected on Port 9090.%RESET%
)
echo.

:: 2. Stop Dev Frontend (5173)
echo %CYAN%Scanning for active local Dev Frontend (Port 5173)...%RESET%
netstat -ano | findstr :5173 >nul 2>&1
if %errorlevel% eq 0 (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
        echo %RED%  - Found frontend process running on PID %%a. Terminating...%RESET%
        taskkill /f /pid %%a >nul 2>&1
    )
) else (
    echo %GREEN%  - No active frontend detected on Port 5173.%RESET%
)
echo.

:: 3. Stop Docker Containers (Production Stack)
where docker >nul 2>nul
if %errorlevel% eq 0 (
    docker info >nul 2>&1
    if %errorlevel% eq 0 (
        echo %CYAN%Docker is running. Checking for BodhGanga production containers...%RESET%
        docker ps | findstr /i "bodhganga" >nul 2>&1
        if !errorlevel! eq 0 (
            echo %YELLOW%  - Found active production containers. Tearing down docker stack...%RESET%
            pushd "%SCRIPT_DIR%"
            docker-compose down
            popd
            echo %GREEN%  - Production stack stopped successfully.%RESET%
        ) else (
            echo %GREEN%  - No active BodhGanga production containers found.%RESET%
        )
    )
)
echo.

:: 4. Stray Process Cleanup
echo %CYAN%Cleaning up any stray java, node, or tomcat processes...%RESET%
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im java.exe >nul 2>&1
echo %GREEN%  - Stray process sweep complete.%RESET%
echo.

:: 5. Clean Log Files
echo %CYAN%Purging development log caches...%RESET%
if exist "%SCRIPT_DIR%.dev-logs" (
    del /f /q "%SCRIPT_DIR%.dev-logs\*" >nul 2>&1
    echo %GREEN%  - Dev log directory cleared.%RESET%
)
echo.

echo %CYAN%======================================================================%RESET%
echo %GREEN%%BOLD%     🎉 SYSTEM CLEANUP COMPLETE! ALL SERVICES OFFICIALLY STOPPED.%RESET%
echo %CYAN%======================================================================%RESET%
echo.
pause
exit /b 0
