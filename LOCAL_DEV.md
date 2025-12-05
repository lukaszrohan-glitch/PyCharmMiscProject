# Lokalny development (Windows)

Ten skrót pozwala odpalić pełny stack (FastAPI + Vite preview) jednym poleceniem albo ręcznie, gdy potrzebujesz większej kontroli. Zakładamy, że pracujesz w PowerShellu i masz w repo utworzony virtualenv `.venv`.

## 1. Jednorazowa konfiguracja

```powershell
# zainstaluj zależności backendu (sqlite fallback)
python -m pip install -r requirements-dev.txt

# zainstaluj zależności frontendu
cd frontend
npm install
cd ..

# ustaw pliki środowiskowe
copy .env.example .env          # jeśli brak
copy frontend\.env.example frontend\.env
```

W pliku `.env` upewnij się, że masz ustawione minimalne wartości:

```
JWT_SECRET=<64-znakowy sekret>
ADMIN_EMAIL=admin@arkuszowniasmb.pl
ADMIN_PASSWORD=Admin123!@#Secure
CORS_ORIGINS=http://localhost:4174
```

W `frontend/.env` wpisz bazę API:

```
VITE_API_BASE=http://localhost:8000/api
```

## 2. Szybki start (automatyczny)

Użyj skryptu `start-local.ps1`, który uruchomi backend i frontend równolegle.

```powershell
# z katalogu projektu
.\start-local.ps1
```

Skrypt:
- aktywuje `.venv` (jeśli istnieje),
- odpala `uvicorn main:app --port 8000` w tle,
- uruchamia `npm run preview -- --host=localhost --port=4174`,
- otwiera przeglądarkę pod `http://localhost:4174`.

### Zatrzymanie
Naciśnij `Ctrl+C` w oknie frontendu. Backend uruchomiony w jobie tła możesz zatrzymać poleceniem:
```powershell
Stop-Job -Name synterra-backend
Remove-Job -Name synterra-backend
```

## 3. Ręczny start (pełna kontrola)

### Terminal A – backend FastAPI
```powershell
.\.venv\Scripts\Activate.ps1
$env:FORCE_SQLITE="1"      # opcjonalnie, gdy chcesz wymusić sqlite
uvicorn main:app --reload --port 8000
```

### Terminal B – frontend Vite preview
```powershell
cd frontend
npm run preview -- --host=localhost --port=4174
```

Odwiedź `http://localhost:4174` i zaloguj się danymi z `.env`.

## 4. Przydatne polecenia

| Cel | Polecenie |
| --- | --- |
| Test lint | `cd frontend; npm run lint` |
| Budowa prod | `cd frontend; npm run build` |
| Podgląd prod | `cd frontend; npm run preview -- --host=localhost --port=4174` |
| Health API | `Invoke-WebRequest http://localhost:8000/healthz -UseBasicParsing` |

## 5. Diagnostyka 404 przy logowaniu

Jeśli widzisz komunikat `API POST /api/auth/login failed (404)`, oznacza to, że frontend nie może połączyć się z backendem. Sprawdź:
1. Czy Uvicorn działa (`Get-NetTCPConnection -LocalPort 8000`).
2. Czy `frontend/.env` zawiera prawidłowe `VITE_API_BASE`.
3. Czy w przeglądarce używasz właściwego portu (domyślnie 4174).

Po naprawieniu odśwież aplikację i spróbuj ponownie się zalogować.

