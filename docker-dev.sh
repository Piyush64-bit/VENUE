#!/bin/bash

# VENUE Docker Development Environment Startup Script
# This script automates the process of building and starting the full-stack containerized environment.

echo "Starting VENUE development stack..."

# Verify if Docker daemon is active and accessible
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please ensure Docker Desktop is active."
  exit 1
fi

# Build images and start services in detached mode
# Note: --build ensures that any local changes to Dockerfiles or context are captured.
echo "Building and orchestrating containers..."
docker compose up --build -d

echo "Infrastructure initialized successfully."
echo "------------------------------------------------"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "API Docs: http://localhost:5000/docs"
echo "------------------------------------------------"
echo "Following container logs (Press Ctrl+C to exit log view)..."

# Stream logs from all services to the console
docker compose logs -f
