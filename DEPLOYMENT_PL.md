# Przewodnik Wdrożenia

## Wymagania Wstępne

1. Zainstaluj wymagane oprogramowanie:
   - Docker Desktop
   - Git
   - Visual Studio Code (zalecane)
   - Python 3.11+
   - Node.js 18+

2. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/yourusername/arkuszowniasmb.git
   cd arkuszowniasmb
   ```

## Konfiguracja Środowiska Deweloperskiego

1. Zainstaluj zależności Python:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

2. Zainstaluj zależności frontendowe:
   ```bash
   cd frontend
   npm install
   ```

3. Skonfiguruj zmienne środowiskowe:
   - Skopiuj `.env.example` do `.env`
   - Zaktualizuj wartości według potrzeb

4. Uruchom serwery deweloperskie:
   ```bash
   # Terminal 1 - Backend
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Wdrożenie Produkcyjne

1. Zbuduj i uruchom kontenery:
   ```bash
   docker-compose up -d
   ```

2. Zainicjuj bazę danych:
   ```bash
   docker-compose exec backend python init_db.py
   ```

3. Utwórz użytkownika administratora:
   ```bash
   docker-compose exec backend python create_admin.py
   ```

4. Skonfiguruj Cloudflare:
   - Ustaw rekordy DNS
   - Skonfiguruj tunel
   - Uruchom tunel za pomocą `cloudflared.exe`

## Monitoring

1. Sprawdź logi:
   ```bash
   docker-compose logs -f
   ```

2. Monitoruj stan:
   ```bash
   ./check-health.cmd
   ```

3. Zobacz metryki:
   - http://localhost/metrics (format Prometheus)
   - Panel Grafana (jeśli skonfigurowany)

## Kopie Zapasowe

1. Backup bazy danych:
   ```bash
   docker-compose exec db pg_dump -U postgres smbdb > backup.sql
   ```

2. Przywracanie z kopii:
   ```bash
   docker-compose exec -T db psql -U postgres smbdb < backup.sql
   ```

## Bezpieczeństwo

1. Klucze API:
   - Rotacja co 90 dni
   - Zarządzanie przez panel admina

2. SSL/TLS:
   - Zarządzane przez Cloudflare
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

W przypadku problemów:
1. Sprawdź logi
2. Przejrzyj dokumentację
3. Skontaktuj się ze wsparciem:
   - Email: admin@arkuszowniasmb.pl
   - Zgłoszenia GitHub
   - Awaryjnie: +XX XXX XXX XXX
