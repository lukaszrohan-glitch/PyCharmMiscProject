#!/bin/bash
set -e

SSH_HOST="serwer2581752@serwer2581752.home.pl"
SSH_PORT=22222
REMOTE_DIR="arkuszownia"

echo "================================"
echo "Deploying Application NOW"
echo "================================"
echo ""

echo "Step 1: Building frontend..."
cd frontend
npm run build
cd ..
echo "[OK] Frontend built"
echo ""

echo "Step 2: Creating deployment archive..."
zip -r deploy-app.zip \
  docker-compose.yml \
  Dockerfile \
  nginx.conf \
  .env \
  entrypoint.sh \
  alembic.ini \
  requirements.txt \
  main.py \
  auth.py \
  db.py \
  schemas.py \
  queries.py \
  user_mgmt.py \
  logging_utils.py \
  frontend/dist \
  alembic \
  scripts \
  > /dev/null 2>&1
echo "[OK] Archive created"
echo ""

echo "Step 3: Uploading to server (enter password when prompted)..."
scp -P $SSH_PORT deploy-app.zip "$SSH_HOST:~/$REMOTE_DIR/" || {
  echo "[ERROR] Upload failed"
  exit 1
}
echo "[OK] Upload complete"
echo ""

echo "Step 4: Starting application on remote server..."
ssh -p $SSH_PORT "$SSH_HOST" << 'REMOTE_COMMANDS'
set -e
cd ~/arkuszownia
unzip -o deploy-app.zip
mkdir -p logs/{nginx,cloudflared}
docker-compose down 2>/dev/null || true
docker-compose up -d
sleep 15
echo ""
echo "================================"
echo "Application Started!"
echo "================================"
docker-compose ps
REMOTE_COMMANDS

echo ""
echo "[OK] Deployment complete!"
echo ""
echo "Access your app:"
echo "  Backend: http://serwer2581752.home.pl:8000"
echo "  Frontend: http://serwer2581752.home.pl:8088"
echo ""
echo "To check logs:"
echo "  ssh -p 22222 serwer2581752@serwer2581752.home.pl"
echo "  cd ~/arkuszownia"
echo "  docker-compose logs -f"
echo ""

rm -f deploy-app.zip
