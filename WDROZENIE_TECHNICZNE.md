# Przewodnik Wdrożenia ArkuszowniaSMB

## Wymagania Systemowe

### Wymagania Sprzętowe
- CPU: 2+ rdzenie
- RAM: minimum 4GB
- Dysk: 20GB wolnej przestrzeni
- Sieć: minimum 100Mbps

### Wymagania Programowe
1. System Operacyjny:
   - Windows 10/11
   - WSL2 włączony
   - Docker Desktop zainstalowany i uruchomiony

2. Narzędzia Programistyczne:
   - Python 3.11+
   - Node.js 18+
   - Visual Studio Code (zalecane)
   - Git

3. Wymagane Oprogramowanie:
   - Docker Desktop
   - Cloudflare CLI (cloudflared)

## Początkowa Konfiguracja

1. Klonowanie repozytorium:
   ```bash
   git clone https://github.com/yourusername/arkuszowniasmb.git
   cd arkuszowniasmb
   ```

2. Konfiguracja środowiska:
   ```bash
   copy .env.example .env
   # Edytuj .env zgodnie z konfiguracją
   ```

3. Konfiguracja Cloudflare:
   - Zarejestruj domenę arkuszowniasmb.pl
   - Skonfiguruj rekordy DNS
   - Skonfiguruj tunel
   - Zaktualizuj cloudflared-config.yml

## Struktura Aplikacji

```
/
├── frontend/          # Frontend w React
├── backend/          # Backend w FastAPI
├── nginx/            # Konfiguracja Nginx
├── scripts/          # Skrypty narzędziowe
└── docker/           # Konfiguracja Docker
```

## Konfiguracja Deweloperska

1. Instalacja zależności:
   ```bash
   # Backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   ```

2. Uruchomienie serwerów deweloperskich:
   ```bash
   # Terminal 1 - Backend
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Wdrożenie Produkcyjne

1. Budowanie kontenerów:
   ```bash
   docker-compose build
   ```

2. Uruchomienie usług:
   ```bash
   docker-compose up -d
   ```

3. Inicjalizacja bazy danych:
   ```bash
   docker-compose exec backend python init_db.py
   ```

4. Utworzenie użytkownika administratora:
   ```bash
   docker-compose exec backend python create_admin.py
   ```

## Skrypty Zarządzania

1. Uruchomienie aplikacji:
   ```bash
   start-app.cmd
   ```

2. Sprawdzenie stanu:
   ```bash
   check-health.cmd
   ```

3. Kopia zapasowa bazy:
   ```bash
   backup-db.cmd
   ```

4. Zatrzymanie aplikacji:
   ```bash
   stop-app.cmd
   ```

## Monitoring

1. Sprawdzanie zdrowia:
   - Frontend: http://localhost/healthz
   - Backend: http://localhost:8080/healthz

2. Logi:
   ```bash
   docker-compose logs -f
   ```

3. Baza danych:
   ```bash
   docker-compose exec db psql -U smb_user smbtool
   ```

## Kopie Zapasowe i Odzyskiwanie

1. Ręczna kopia:
   ```bash
   backup-db.cmd
   ```

2. Automatyczne kopie:
   - Codziennie o 3:00
   - Przechowywane w /backups
   - Zachowywane przez 30 dni

3. Odzyskiwanie:
   ```bash
   docker-compose exec -T db psql -U smb_user smbtool < backup.sql
   ```

## Bezpieczeństwo

1. Klucze API:
   - Rotacja co 90 dni
   - Generowane przez panel admina
   - Prowadzone logi audytowe

2. SSL/TLS:
   - Zarządzane przez Cloudflare
   - Automatyczne odnowienie
   - Zawsze używaj HTTPS

3. Hasła:
   - Minimum 8 znaków
   - Muszą zawierać cyfry i znaki specjalne
   - Zmieniane co 180 dni

## Rozwiązywanie Problemów

1. Problemy z kontenerami:
   ```bash
   docker-compose down
   docker-compose up -d --force-recreate
   ```

2. Problemy z bazą danych:
   ```bash
   docker-compose exec db psql -U postgres
   ```

3. Problemy z siecią:
   - Sprawdź status Cloudflare
   - Zweryfikuj rekordy DNS
   - Przetestuj łączność lokalną

## Wsparcie

W razie problemów:
1. Sprawdź logi
2. Przejrzyj dokumentację
3. Skontaktuj się ze wsparciem:
   - Email: admin@arkuszowniasmb.pl
   - Zgłoszenia GitHub
   - Awaryjnie: +XX XXX XXX XXX
