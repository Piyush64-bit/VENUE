#!/bin/bash

# VENUE Load Balancer Testing - Quick Start Script
# This script sets up and runs load balancer tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "  VENUE Load Balancer Testing Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Docker
if command_exists docker; then
    echo -e "${GREEN}✓${NC} Docker is installed"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    echo "  Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command_exists docker-compose; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    echo "  Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check k6
if command_exists k6; then
    echo -e "${GREEN}✓${NC} k6 is installed"
else
    echo -e "${YELLOW}⚠${NC} k6 is not installed"
    echo "  Install k6 to run tests: https://k6.io/docs/get-started/installation/"
    echo "  Continuing with setup..."
fi

echo ""
echo "=========================================="
echo "  Starting Load Balanced Environment"
echo "=========================================="
echo ""

cd "$ROOT_DIR"

# Stop any existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.loadbalancer.yml down 2>/dev/null || true

# Start load balanced environment
echo "Starting load balancer and backend instances..."
docker-compose -f docker-compose.loadbalancer.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 15

# Check service health
echo ""
echo "Checking service health..."

# Check load balancer
if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Load balancer is healthy (http://localhost:8080)"
else
    echo -e "${RED}✗${NC} Load balancer is not responding"
    echo "  Check logs: docker-compose -f docker-compose.loadbalancer.yml logs load-balancer"
fi

# Check backend instances
for i in 1 2 3; do
    CONTAINER="venue-backend-$i"
    if docker ps --filter "name=$CONTAINER" --filter "health=healthy" | grep -q "$CONTAINER"; then
        echo -e "${GREEN}✓${NC} Backend instance $i is healthy"
    else
        echo -e "${YELLOW}⚠${NC} Backend instance $i is not healthy yet"
    fi
done

echo ""
echo "=========================================="
echo "  Running Load Balancer Tests"
echo "=========================================="
echo ""

if ! command_exists k6; then
    echo -e "${YELLOW}k6 is not installed. Skipping tests.${NC}"
    echo ""
    echo "To run tests manually after installing k6:"
    echo "  cd $SCRIPT_DIR"
    echo "  npm run k6:lb-health       # Health check test"
    echo "  npm run k6:lb-distribution # Distribution test"
    echo "  npm run k6:lb-session      # Session test"
    echo "  npm run k6:lb-stress       # Full stress test"
    exit 0
fi

cd "$SCRIPT_DIR"

# Menu for test selection
echo "Select tests to run:"
echo "  1) Health Check Test (2 minutes)"
echo "  2) Distribution Test (10 minutes)"
echo "  3) Session Persistence Test (8 minutes)"
echo "  4) Failover Test (5 minutes) - Manual intervention required"
echo "  5) Comprehensive Stress Test (17 minutes)"
echo "  6) All Tests (25+ minutes)"
echo "  7) Quick Test Suite (Health + Distribution)"
echo "  q) Quit"
echo ""

read -p "Enter your choice [1-7, q]: " choice

case $choice in
    1)
        echo "Running Health Check Test..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
        ;;
    2)
        echo "Running Distribution Test..."
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
        ;;
    3)
        echo "Running Session Persistence Test..."
        npm run k6:lb-session -- --env BASE_URL=http://localhost:8080
        ;;
    4)
        echo "Running Failover Test..."
        echo ""
        echo -e "${YELLOW}MANUAL TESTING REQUIRED:${NC}"
        echo "1. Test will start in 10 seconds"
        echo "2. During execution, stop one backend instance:"
        echo "   docker stop venue-backend-2"
        echo "3. Wait 30 seconds, then restart it:"
        echo "   docker start venue-backend-2"
        echo "4. Observe the results"
        echo ""
        read -p "Press Enter to continue..."
        npm run k6:lb-failover -- --env BASE_URL=http://localhost:8080
        ;;
    5)
        echo "Running Comprehensive Stress Test..."
        npm run k6:lb-stress -- --env BASE_URL=http://localhost:8080
        ;;
    6)
        echo "Running All Tests..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-session -- --env BASE_URL=http://localhost:8080
        echo ""
        echo -e "${YELLOW}Skipping failover test (requires manual intervention)${NC}"
        echo "Run separately with: npm run k6:lb-failover"
        ;;
    7)
        echo "Running Quick Test Suite..."
        npm run k6:lb-health -- --env BASE_URL=http://localhost:8080
        npm run k6:lb-distribution -- --env BASE_URL=http://localhost:8080
        ;;
    q|Q)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  Test Results"
echo "=========================================="
echo ""
echo "Test reports have been generated:"
echo "  - HTML reports: *.html"
echo "  - JSON summaries: *.json"
echo ""
echo "To view detailed logs:"
echo "  docker-compose -f $ROOT_DIR/docker-compose.loadbalancer.yml logs"
echo ""
echo "To stop the environment:"
echo "  docker-compose -f $ROOT_DIR/docker-compose.loadbalancer.yml down"
echo ""

read -p "Do you want to stop the load balancer environment now? (y/N): " stop_env

if [[ "$stop_env" =~ ^[Yy]$ ]]; then
    cd "$ROOT_DIR"
    docker-compose -f docker-compose.loadbalancer.yml down
    echo -e "${GREEN}Environment stopped successfully${NC}"
else
    echo "Environment is still running at http://localhost:8080"
fi
