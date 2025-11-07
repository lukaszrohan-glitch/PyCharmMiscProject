# Rozwiązywanie Problemów z Dockerem 🐳

## Szybkie Rozwiązania

### Problem: Kontenery nie startują

```bash
# 1. Sprawdź status
docker compose ps

# 2. Zobacz logi
docker compose logs

# 3. Zrestartuj wszystko
docker compose restart

# 4. Jeśli nadal nie działa, przebuduj
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Częste Problemy

### 🔴 Frontend pokazuje pustą/białą stronę

**Objawy:**
- Strona ładuje się ale jest pusta
- Widzisz tylko tytuł w zakładce

**Rozwiązanie:**
```bash
# Sprawdź logi frontendu
docker compose logs frontend

# Jeśli widzisz błędy parsowania:
docker compose build --no-cache frontend
docker compose up -d frontend

# Sprawdź czy działa
curl http://localhost:5173
```

**Przyczyny:**
- Błędy w kodzie JavaScript
- Problemy z Vite bundlerem
- Brakujące node_modules

---

### 🔴 Backend nie odpowiada / 500 błędy

**Rozwiązanie:**
```bash
# Sprawdź logi backendu
docker compose logs backend

# Sprawdź połączenie z bazą danych
docker compose exec backend python -c "from db import get_db_conn; print(get_db_conn())"

# Zrestartuj backend
docker compose restart backend

# Jeśli nie pomaga:
docker compose down
docker compose up -d
```

**Przyczyny:**
- Baza danych nie gotowa
- Błędy w kodzie Python
- Brakujące zmienne środowiskowe

---

### 🔴 Baza danych nie startuje

**Objawy:**
```
ERROR: for db  Container is unhealthy
```

**Rozwiązanie:**
```bash
# Sprawdź logi PostgreSQL
docker compose logs db

# Usuń stare dane i zacznij od nowa
docker compose down -v
docker compose up -d

# Zaczekaj 10 sekund na inicjalizację
timeout /t 10

# Sprawdź status
docker compose ps
```

**Uwaga:** `-v` usuwa wszystkie dane! Użyj ostrożnie w produkcji.

---

### 🔴 Port już używany

**Objawy:**
```
Error: bind: address already in use
Port 5173 is already allocated
```

**Rozwiązanie 1 - Znajdź i zabij proces:**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <numer_PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

**Rozwiązanie 2 - Zmień port:**
Edytuj `docker-compose.yml`:
```yaml
frontend:
  ports:
    - '3000:5173'  # Użyj portu 3000 zamiast 5173
```

---

### 🔴 "Cannot connect to Docker daemon"

**Objawy:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Rozwiązanie:**
```bash
# Windows: Uruchom Docker Desktop
# Sprawdź w zasobniku systemowym czy Docker działa

# Linux: Uruchom daemon
sudo systemctl start docker

# Sprawdź status
docker version
```

---

### 🔴 Wolumeny nie montują się (zmiany nie widoczne)

**Objawy:**
- Zmiany w kodzie nie są widoczne w kontenerze
- Stare pliki nadal są używane

**Rozwiązanie:**
```bash
# Zrestartuj z odświeżeniem wolumenów
docker compose down
docker compose up -d

# Dla Windows: Sprawdź Settings -> Resources -> File Sharing
# Upewnij się że dysk C:\ jest udostępniony
```

---

### 🔴 "No space left on device"

**Rozwiązanie:**
```bash
# Usuń nieużywane obrazy
docker image prune -a

# Usuń nieużywane kontenery
docker container prune

# Usuń nieużywane wolumeny
docker volume prune

# Kompleksowe czyszczenie (OSTROŻNIE!)
docker system prune -a --volumes
```

---

### 🔴 Build trwa wiecznie / zawiesza się

**Rozwiązanie:**
```bash
# Przerwij (Ctrl+C)

# Sprawdź czy nie jest problem z siecią
docker compose build --no-cache --progress=plain

# Jeśli backend zawiesza się na pip install:
# Edytuj requirements.txt - usuń problematyczne pakiety
# Lub użyj --no-cache-dir:
RUN pip install --no-cache-dir -r requirements.txt
```

---

### 🔴 CORS błędy w przeglądarce

**Objawy:**
```
Access to fetch at 'http://localhost:8000/api/orders' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

**Rozwiązanie:**
```bash
# Sprawdź CORS_ORIGINS w .env
cat .env | findstr CORS

# Powinno być:
CORS_ORIGINS=

# Lub:
CORS_ORIGINS=http://localhost:5173,http://192.168.10.147:5173

# Zrestartuj backend
docker compose restart backend
```

---

### 🔴 Migracje bazy danych nie działają

**Rozwiązanie:**
```bash
# Uruchom migracje ręcznie
docker compose exec backend alembic upgrade head

# Sprawdź historię
docker compose exec backend alembic current

# Utwórz nową migrację
docker compose exec backend alembic revision --autogenerate -m "opis"

# Reset całkowity (OSTROŻNIE!)
docker compose down -v
docker compose up -d
```

---

### 🔴 Frontend nie może połączyć się z API

**Objawy:**
- Network errors w konsoli
- "Failed to fetch"
- Puste listy

**Rozwiązanie:**
```bash
# 1. Sprawdź czy backend działa
curl http://localhost:8000/healthz

# 2. Sprawdź czy frontend widzi poprawny API URL
# Otwórz http://localhost:5173
# Sprawdź konsolę przeglądarki (F12)
# Szukaj: "API Base URL: ..."

# 3. Jeśli URL jest zły:
# Ustaw VITE_API_BASE w .env
VITE_API_BASE=http://localhost:8000/api

# Przebuduj frontend
docker compose build frontend
docker compose up -d frontend
```

---

### 🔴 Testy nie działają

**Backend testy:**
```bash
# Wejdź do kontenera
docker compose exec backend bash

# Uruchom pytest
pytest

# Z detalami
pytest -v

# Określony test
pytest tests/test_auth.py
```

**Frontend E2E testy:**
```bash
# Z hosta (nie z Dockera)
cd frontend
npm install
npm test
```

---

### 🔴 Kontener natychmiast się wyłącza

**Rozwiązanie:**
```bash
# Zobacz co się stało
docker compose logs <nazwa-usługi>

# Sprawdź exitcode
docker compose ps

# Uruchom kontener interaktywnie
docker compose run --rm backend bash

# Następnie ręcznie uruchom komendę
python main.py
```

---

### 🔴 Zmiany w docker-compose.yml nie są stosowane

**Rozwiązanie:**
```bash
# Docker cache - użyj --force-recreate
docker compose up -d --force-recreate

# Lub:
docker compose down
docker compose up -d
```

---

### 🔴 Nie mogę połączyć się z aplikacją przez sieć

**Rozwiązanie:**
```bash
# 1. Sprawdź IP hosta
ipconfig  # Windows
ifconfig  # Linux/Mac

# 2. Sprawdź czy kontenery działają
docker compose ps

# 3. Dodaj reguły firewall (Windows)
netsh advfirewall firewall add rule name="SMB Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="SMB Backend" dir=in action=allow protocol=TCP localport=8000

# 4. Sprawdź CORS w .env
CORS_ORIGINS=

# 5. Zrestartuj
docker compose restart
```

---

### 🔴 Docker Desktop zużywa zbyt dużo RAM/CPU

**Rozwiązanie:**
```bash
# Windows: Docker Desktop Settings
# Resources -> Advanced
# Zmniejsz Memory i CPU

# Lub w docker-compose.yml dodaj limity:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

---

## 🛠️ Narzędzia Diagnostyczne

### Sprawdź wszystko na raz

```bash
# Status kontenerów
docker compose ps

# Użycie zasobów
docker stats

# Logi wszystkich usług
docker compose logs --tail=100

# Logi z timestampami
docker compose logs -f --timestamps

# Sieć
docker network ls
docker network inspect pycharmmiscproject_default

# Wolumeny
docker volume ls
docker volume inspect pycharmmiscproject_db_data
```

### Skrypt diagnostyczny

Użyj: `scripts\docker-diagnostic.cmd` (Windows)

Zbiera:
- Status kontenerów
- Logi (ostatnie 200 linii)
- Konfigurację sieci
- Wykorzystanie zasobów

---

## 🔄 Procedury Resetowania

### Soft Reset (zachowaj dane)
```bash
docker compose restart
```

### Medium Reset (przebuduj kontenery)
```bash
docker compose down
docker compose build
docker compose up -d
```

### Hard Reset (usuń wszystko oprócz wolumenów)
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Nuclear Reset (USUWA WSZYSTKIE DANE!)
```bash
docker compose down -v
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

⚠️ **Uwaga:** Nuclear reset usuwa bazę danych!

---

## 📊 Monitoring i Logi

### Ciągłe śledzenie logów

```bash
# Wszystkie usługi
docker compose logs -f

# Tylko frontend
docker compose logs -f frontend

# Tylko backend
docker compose logs -f backend

# Tylko baza danych
docker compose logs -f db

# Z timestampami
docker compose logs -f --timestamps

# Ostatnie 50 linii
docker compose logs --tail=50
```

### Export logów do pliku

```bash
# Windows
docker compose logs > app-logs.txt

# Lub użyj skryptu
scripts\collect-logs.ps1
```

### Wejdź do kontenera

```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh

# Baza danych
docker compose exec db psql -U smb_user -d smbtool
```

---

## 🚨 Emergency Procedures

### Aplikacja całkowicie nie działa

```bash
# 1. STOP
docker compose down

# 2. Sprawdź czy Docker działa
docker version

# 3. Usuń stare kontenery i obrazy
docker container prune -f
docker image rm pycharmmiscproject-frontend pycharmmiscproject-backend

# 4. Rebuild
docker compose build --no-cache

# 5. Start
docker compose up -d

# 6. Sprawdź logi
docker compose logs -f

# 7. Czekaj 15 sekund na inicjalizację bazy
timeout /t 15

# 8. Test
curl http://localhost:5173
curl http://localhost:8000/healthz
```

### Baza danych uszkodzona

```bash
# 1. Backup (jeśli możliwe)
docker compose exec db pg_dump -U smb_user smbtool > backup.sql

# 2. Usuń wolumen
docker compose down -v

# 3. Restart (świeża baza z init.sql)
docker compose up -d

# 4. Opcjonalnie: Przywróć backup
docker compose exec -T db psql -U smb_user smbtool < backup.sql
```

---

## 💡 Najlepsze Praktyki

### ✅ DO:
- Regularnie aktualizuj Docker Desktop
- Używaj `docker compose logs` do debugowania
- Czytaj komunikaty o błędach dokładnie
- Zachowuj backupy danych produkcyjnych
- Testuj zmiany lokalnie przed deploymentem

### ❌ NIE:
- Nie używaj `docker compose down -v` w produkcji
- Nie ignoruj healthchecków
- Nie uruchamiaj na produkcji bez HTTPS
- Nie trzymaj wrażliwych danych w obrazach
- Nie commituj pliku `.env` do gita

---

## 📞 Dalsze Wsparcie

Jeśli żaden z powyższych sposobów nie pomógł:

1. Zbierz logi: `scripts\collect-logs.ps1`
2. Sprawdź GitHub Issues
3. Utwórz nowy Issue z:
   - Opisem problemu
   - Logami
   - Krokami do reprodukcji
   - Wersją Docker i systemu operacyjnego

---

**Powodzenia z Dockerem! 🐳**

Pamiętaj: Większość problemów rozwiązuje się przez `docker compose down && docker compose up -d` 😉

