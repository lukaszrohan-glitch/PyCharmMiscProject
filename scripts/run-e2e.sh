#!/usr/bin/env bash
# Run E2E locally: bring up docker-compose, wait for backend, run Playwright tests, tear down
set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

echo "Starting docker-compose..."
docker-compose up -d --build

echo "Waiting for backend http://localhost:8000/healthz ..."
for i in {1..60}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/healthz || true)
  if [ "$status" = "200" ]; then
    echo "backend ready"
    break
  fi
  sleep 2
done

if [ "$status" != "200" ]; then
  echo "Backend did not become ready (status=$status)" >&2
  docker-compose logs web || true
  docker-compose down -v
  exit 1
fi

# Run Playwright tests
cd frontend
npm install
npx playwright install --with-deps
npx playwright test --config=../tests/e2e/playwright.config.js || E2E_STATUS=$?

# Tear down
cd "$ROOT_DIR"
docker-compose down -v

if [ -n "${E2E_STATUS-}" ]; then
  echo "E2E tests failed with status ${E2E_STATUS}" >&2
  exit ${E2E_STATUS}
fi

echo "E2E completed successfully"

