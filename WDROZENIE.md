# Wdrożenie Aplikacji ArkuszowniaSMB

## Wymagania Systemowe

1. Zainstaluj wymagane oprogramowanie:
   - Docker Desktop
   - Visual Studio Code (zalecane)
   - Python 3.11+
   - Node.js 18+

2. Utwórz konto w Cloudflare:
   - Zarejestruj domenę arkuszowniasmb.pl
   - Skonfiguruj tunnel dla dostępu zewnętrznego

## Uruchamianie Aplikacji

1. Pierwsze uruchomienie:
   ```
   start-app.cmd
   ```
   - Skrypt automatycznie skonfiguruje wszystkie komponenty
   - Poczekaj na inicjalizację (około 30 sekund)

2. Dostęp do aplikacji:
   - Lokalnie: http://localhost
   - Przez sieć: https://arkuszowniasmb.pl

3. Dane logowania administratora:
   - Email: ciopqj@gmail.com
   - Hasło: SMB#Admin2025!

## Komponenty Systemu

- Frontend (React + Vite)
- Backend (FastAPI)
- Baza danych (PostgreSQL)
- Serwer proxy (Nginx)
- Tunel (Cloudflare)

## Zarządzanie Aplikacją

1. Sprawdzanie stanu:
   ```
   check-health.cmd
   ```

2. Zatrzymywanie:
   ```
   stop-app.cmd
   ```

3. Logi:
   - Znajdują się w katalogu `logs`
   - Osobne pliki dla startu i zatrzymania
   - Format: `[akcja]_[data]_[czas].log`

## Rozwiązywanie Problemów

1. Problemy z kontenerami:
   - Sprawdź logi: `docker-compose logs`
   - Przebuduj: `docker-compose up -d --build`

2. Problemy z dostępem:
   - Sprawdź Cloudflare: Panel DNS
   - Zweryfikuj tunel: Status w panelu Cloudflare
   - Test lokalny: curl http://localhost/healthz

3. Problemy z bazą danych:
   - Sprawdź połączenie: `docker-compose exec db psql -U smb_user smbtool`
   - Zweryfikuj migracje

## Bezpieczeństwo

1. Dostęp:
   - Używaj HTTPS dla dostępu zewnętrznego
   - Klucze API rotowane co 90 dni
   - Hasła zmieniane co 180 dni

2. Kopie zapasowe:
   - Automatyczne: codziennie o 3:00
   - Ręczne: `backup-db.cmd`

3. Aktualizacje:
   - Sprawdzaj co tydzień
   - Instaluj łatki bezpieczeństwa

## Wsparcie

- Email: admin@arkuszowniasmb.pl
- Dokumentacja: https://arkuszowniasmb.pl/docs
- Zgłoszenia: https://github.com/arkuszowniasmb/issues
