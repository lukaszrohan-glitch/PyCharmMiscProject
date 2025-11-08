Arkuszownia SMB — local dev & quick start (PowerShell-friendly)

Prereqs:
- Docker & Docker Compose
- Node (for local frontend building) or use the included Docker build

PowerShell commands (run in project root):

# 1) Build backend image (installs python deps and psycopg2)
# Use separate commands in PowerShell; do not chain with &&
docker-compose build backend

# 2) Start full stack
docker-compose up -d

# 3) Tail logs (backend / nginx)
docker-compose logs -f backend nginx

# 4) Rebuild frontend (if you change UI) using Docker
cd frontend
# build will produce ./frontend/dist which nginx serves
docker build -t arkuszowniasmb-frontend:local .
# then restart nginx service in compose so it picks up ./frontend/dist
cd ..
# Use helper to restart nginx safely from PowerShell
.
# from project root run:
# powershell -File ./scripts/ps_docker_restart_nginx.ps1

# Quick checks
# From PowerShell (use separate commands - do not use shell operators like && or || inline):
# Example: run each command separately
docker-compose exec nginx sh -c "curl -sS -i -H 'Host: arkuszowniasmb.pl' http://127.0.0.1/api/healthz"

# If you prefer WSL/Git Bash for convenience (recommended):
# bash -lc "bash ./scripts/check_endpoints.sh"

PowerShell helper scripts (recommended)
- `scripts/ps_commit.ps1` - stage files and commit using PowerShell (avoid chaining)
  Usage example:
  powershell -File ./scripts/ps_commit.ps1 -Files @("nginx.conf","README.md") -Message "nginx: changes"

- `scripts/ps_docker_restart_nginx.ps1` - restart nginx via docker-compose
  Usage:
  powershell -File ./scripts/ps_docker_restart_nginx.ps1

Notes:
- The nginx in compose is configured to serve files from `./frontend/dist`.
- For production, build the frontend (`npm ci && npm run build`) and make sure `dist` is present before starting the stack.
