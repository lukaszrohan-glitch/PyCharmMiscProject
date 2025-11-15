#!/bin/bash
set -e

echo "================================"
echo "Deploying without Docker"
echo "================================"
echo ""

cd ~/arkuszownia

# Step 1: Check Python
echo "Step 1: Checking Python..."
python3 --version
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found"
    exit 1
fi
echo "[OK] Python available"
echo ""

# Step 2: Install dependencies
echo "Step 2: Installing Python dependencies..."
python3 -m pip install --user --upgrade pip
python3 -m pip install --user -r requirements.txt
echo "[OK] Dependencies installed"
echo ""

# Step 3: Check/setup database
echo "Step 3: Database setup..."
echo "Checking if PostgreSQL is available..."
if command -v psql &> /dev/null; then
    echo "[OK] PostgreSQL found"
    psql -U smb_user -d smbtool -c "SELECT version();" 2>/dev/null || echo "[WARN] Database might not exist yet"
else
    echo "[WARN] PostgreSQL client not found"
    echo "Is PostgreSQL running on this server?"
fi
echo ""

# Step 4: Run migrations
echo "Step 4: Running database migrations..."
python3 -m alembic upgrade head || echo "[WARN] Migrations may have failed - check database"
echo ""

# Step 5: Start backend
echo "Step 5: Starting backend API..."
echo "Backend will run on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""
python3 main.py
