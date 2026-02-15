# VENUE Load Balancer Testing - Quick Start Script (PowerShell)
# This script sets up and runs load balancer tests on Windows

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "=========================================="
Write-Host "  VENUE Load Balancer Testing Setup"
Write-Host "=========================================="
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "Checking prerequisites..."
Write-Host ""

# Check Docker
if (Test-Command docker) {
    Write-Host "✓ Docker is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    Write-Host "  Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
}

# Check Docker Compose
if (Test-Command docker-compose) {
    Write-Host "✓ Docker Compose is installed" -ForegroundColor Green
} else {
    Write-Host "✗ Docker Compose is not installed" -ForegroundColor Red
    Write-Host "  Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
}

# Check k6
$k6Installed = Test-Command k6
if ($k6Installed) {
    Write-Host "✓ k6 is installed" -ForegroundColor Green
} else {
    Write-Host "⚠ k6 is not installed" -ForegroundColor Yellow
    Write-Host "  Install k6 to run tests: https://k6.io/docs/get-started/installation/"
    Write-Host "  Continuing with setup..."
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  Starting Load Balanced Environment"
Write-Host "=========================================="
Write-Host ""

Set-Location $RootDir

# Stop any existing containers
Write-Host "Stopping existing containers..."
docker-compose -f docker-compose.loadbalancer.yml down 2>$null

# Start load balanced environment
Write-Host "Starting load balancer and backend instances..."
docker-compose -f docker-compose.loadbalancer.yml up -d

Write-Host ""
Write-Host "Waiting for services to be healthy..."
Start-Sleep -Seconds 15

# Check service health
Write-Host ""
Write-Host "Checking service health..."

# Check load balancer
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Load balancer is healthy (http://localhost:8080)" -ForegroundColor Green
} catch {
    Write-Host "✗ Load balancer is not responding" -ForegroundColor Red
    Write-Host "  Check logs: docker-compose -f docker-compose.loadbalancer.yml logs load-balancer"
}

# Check backend instances
for ($i = 1; $i -le 3; $i++) {
    $container = "venue-backend-$i"
    $healthCheck = docker ps --filter "name=$container" --filter "health=healthy" --format "{{.Names}}"
    if ($healthCheck -eq $container) {
        Write-Host "✓ Backend instance $i is healthy" -ForegroundColor Green
    } else {
        Write-Host "⚠ Backend instance $i is not healthy yet" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  Running Load Balancer Tests"
Write-Host "=========================================="
Write-Host ""

if (-not $k6Installed) {
    Write-Host "k6 is not installed. Skipping tests." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run tests manually after installing k6:"
    Write-Host "  cd $ScriptDir"
    Write-Host "  npm run k6:lb-health       # Health check test"
    Write-Host "  npm run k6:lb-distribution # Distribution test"
    Write-Host "  npm run k6:lb-session      # Session test"
    Write-Host "  npm run k6:lb-stress       # Full stress test"
    exit 0
}

Set-Location $ScriptDir

# Menu for test selection
Write-Host "Select tests to run:"
Write-Host "  1) Health Check Test (2 minutes)"
Write-Host "  2) Distribution Test (10 minutes)"
Write-Host "  3) Session Persistence Test (8 minutes)"
Write-Host "  4) Failover Test (5 minutes) - Manual intervention required"
Write-Host "  5) Comprehensive Stress Test (17 minutes)"
Write-Host "  6) All Tests (25+ minutes)"
Write-Host "  7) Quick Test Suite (Health + Distribution)"
Write-Host "  q) Quit"
Write-Host ""

$choice = Read-Host "Enter your choice [1-7, q]"

switch ($choice) {
    "1" {
        Write-Host "Running Health Check Test..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
    }
    "2" {
        Write-Host "Running Distribution Test..."
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
    }
    "3" {
        Write-Host "Running Session Persistence Test..."
        npm run k6:lb-session -- --env BASE_URL=http://localhost:8080
    }
    "4" {
        Write-Host "Running Failover Test..."
        Write-Host ""
        Write-Host "MANUAL TESTING REQUIRED:" -ForegroundColor Yellow
        Write-Host "1. Test will start in 10 seconds"
        Write-Host "2. During execution, stop one backend instance:"
        Write-Host "   docker stop venue-backend-2"
        Write-Host "3. Wait 30 seconds, then restart it:"
        Write-Host "   docker start venue-backend-2"
        Write-Host "4. Observe the results"
        Write-Host ""
        Read-Host "Press Enter to continue..."
        npm run k6:lb-failover -- --env BASE_URL=http://localhost:8080
    }
    "5" {
        Write-Host "Running Comprehensive Stress Test..."
        npm run k6:lb-stress -- --env BASE_URL=http://localhost:8080
    }
    "6" {
        Write-Host "Running All Tests..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-session -- --env BASE_URL=http://localhost:8080
        Write-Host ""
        Write-Host "Skipping failover test (requires manual intervention)" -ForegroundColor Yellow
        Write-Host "Run separately with: npm run k6:lb-failover"
    }
    "7" {
        Write-Host "Running Quick Test Suite..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
    }
    {$_ -match "^[qQ]$"} {
        Write-Host "Exiting..."
        exit 0
    }
    default {
        Write-Host "Invalid choice"
        exit 1
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "  Test Results"
Write-Host "=========================================="
Write-Host ""
Write-Host "Test reports have been generated:"
Write-Host "  - HTML reports: *.html"
Write-Host "  - JSON summaries: *.json"
Write-Host ""
Write-Host "To view detailed logs:"
Write-Host "  docker-compose -f $RootDir\docker-compose.loadbalancer.yml logs"
Write-Host ""
Write-Host "To stop the environment:"
Write-Host "  docker-compose -f $RootDir\docker-compose.loadbalancer.yml down"
Write-Host ""

$stopEnv = Read-Host "Do you want to stop the load balancer environment now? (y/N)"

if ($stopEnv -match "^[Yy]$") {
    Set-Location $RootDir
    docker-compose -f docker-compose.loadbalancer.yml down
    Write-Host "Environment stopped successfully" -ForegroundColor Green
} else {
    Write-Host "Environment is still running at http://localhost:8080"
}
