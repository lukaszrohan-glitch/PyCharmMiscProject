#!/bin/bash
# Complete Docker and App Reset Script (Linux/Mac/WSL)
set -e

echo "========================================"
echo "SMB Tool - Complete Reset"
echo "========================================"
echo

echo "[1/6] Stopping all containers..."
docker compose down -v || echo "Warning: No containers to stop"

echo
echo "[2/6] Cleaning Docker system..."
docker system prune -f

echo
echo "[3/6] Removing old images..."
docker rmi pycharmmiscproject-backend pycharmmiscproject-frontend 2>/dev/null || echo "Note: Some images may not exist"

echo
echo "[4/6] Rebuilding images (no cache)..."
docker compose build --no-cache

echo
echo "[5/6] Starting services..."
docker compose up -d

echo
echo "[6/6] Waiting for services to be ready..."
sleep 10

echo
echo "========================================"
echo "Reset Complete!"
echo "========================================"
echo
echo "Services should be available at:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo
echo "Checking service status..."
docker compose ps
echo
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"

