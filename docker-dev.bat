@echo off
setlocal

:: VENUE Docker Development Environment Startup Script
:: This script automates the process of building and starting the full-stack containerized environment on Windows.

echo Starting VENUE development stack...

:: Check if the Docker daemon is responding
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please ensure Docker Desktop is active.
    exit /b 1
)

:: Build images and start services in detached mode
:: The --build flag ensures Docker captures any updates to the local source code or configuration.
echo Building and orchestrating containers...
docker compose up --build -d

echo Infrastructure initialized successfully.
echo ------------------------------------------------
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo API Docs: http://localhost:5000/docs
echo ------------------------------------------------
echo Following container logs (Press Ctrl+C to exit log view)...

:: Tail the logs for real-time debugging
docker compose logs -f

endlocal
