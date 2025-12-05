Developer quick start (Windows / PowerShell)

This repo contains a small FastAPI backend and a Vite React frontend. For quick local development we provide a sqlite fallback so you can run the backend without PostgreSQL.

1) Create & activate venv (PowerShell)

```powershell
py -3 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
```

If you prefer gotowe skrypty start/stop oraz instrukcje w języku polskim, zobacz `LOCAL_DEV.md`.

2) Install dev requirements (sqlite fallback)

```powershell
python -m pip install -r requirements-dev.txt
# If you want DB/Postgres support, instead run:
# python -m pip install -r requirements-postgres.txt
```

3) Run backend (Terminal A)

```powershell
# from project root
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

4) Run frontend (Terminal B)

```powershell
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

### PowerShell automation variant

Jeśli chcesz wystartować oba serwisy jednym poleceniem, użyj skryptu `start-local.ps1` (opis w `LOCAL_DEV.md`).

```powershell
# z katalogu projektu
./start-local.ps1         # uruchamia backend (uvicorn) + frontend preview na porcie 4174
# po pracy (opcjonalnie)
./stop-local.ps1          # zatrzymuje job backendu i proces preview
```

Skrypt automatycznie ładuje zmienne z `.env`, aktywuje `.venv` i otwiera przeglądarkę z podglądem.

Sharing / production options

A) Docker Compose (recommended for self-hosting)

1. Build and start the production stack on a server with Docker and a public IP:

```bash
# on the server
git clone <repo> && cd repo
docker-compose -f docker-compose.prod.yml up --build -d
```

2. The frontend will be served on port 80 (http://<server-ip>/), the backend on port 8000.

B) Publish images to GitHub Container Registry and deploy from there

1. The CI workflow (on push to main) builds and publishes two images to GHCR when `GITHUB_TOKEN` is available.
2. On your server you can pull the images:

```bash
docker pull ghcr.io/<owner>/<repo>/smbtool-backend:<sha>
docker pull ghcr.io/<owner>/<repo>/smbtool-frontend:<sha>
# run containers (example)
docker run -d -p 8000:8000 ghcr.io/<owner>/<repo>/smbtool-backend:<sha>
docker run -d -p 80:80 ghcr.io/<owner>/<repo>/smbtool-frontend:<sha>
```

C) Temporary share for demos (ngrok)

1. Start production stack locally:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

2. Run ngrok to create a public tunnel to port 80:

```bash
ngrok http 80
```

3. Share the generated ngrok URL.

GHCR (GitHub Container Registry) — pull & deploy

If you used CI to publish images to GHCR, you can pull the published images and run them on any server.

1) Login to GHCR (run on server)

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

2) Pull the latest images and run stack (example)

```bash
docker pull ghcr.io/<owner>/<repo>/smbtool-backend:latest
docker pull ghcr.io/<owner>/<repo>/smbtool-frontend:latest
# run db + backend + frontend (example manual start)
docker run -d --name smb_db -e POSTGRES_DB=smbtool -e POSTGRES_USER=smb_user -e POSTGRES_PASSWORD=smb_password -v smb_db_data:/var/lib/postgresql/data postgres:13
docker run -d --name smb_backend -e DATABASE_URL=postgres://smb_user:smb_password@$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' smb_db):5432/smbtool -p 8000:8000 ghcr.io/<owner>/<repo>/smbtool-backend:latest
docker run -d --name smb_frontend -p 80:80 ghcr.io/<owner>/<repo>/smbtool-frontend:latest
```

Or use the provided `docker-compose.ghcr.yml` to run the GHCR images (edit owner/repo placeholders):

```bash
docker-compose -f docker-compose.ghcr.yml up -d
```

Temporary sharing (ngrok)

If you need to quickly share the frontend publicly for a demo:

```bash
docker-compose -f docker-compose.prod.yml up -d
ngrok http 80
# copy the generated ngrok URL and share
```
