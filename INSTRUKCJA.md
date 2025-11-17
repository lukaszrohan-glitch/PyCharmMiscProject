# Guide: Setting up arkuszowniasmb.pl

## 1. Wymagania (Prerequisites)
- Docker + docker-compose zainstalowane i uruchomione
- cloudflared.exe w katalogu projektu
- Plik poświadczeń tunelu w %USERPROFILE%\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json

## 2. Uruchomienie (Quick Start)
1. Sprawdź konfigurację:
   ```
   test-setup.cmd
   ```
   Powinno pokazać "All components ready".

2. Uruchom tunel:
   ```
   run-tunnel.cmd
   ```
   Pozostaw okno otwarte.

3. Strona będzie dostępna pod:
   - https://arkuszowniasmb.pl
   - https://www.arkuszowniasmb.pl

## 3. Rozwiązywanie problemów (Troubleshooting)

### Jeśli strona nie działa:
1. Sprawdź czy kontenery działają:
   ```
   docker-compose ps
   ```
   Wszystkie powinny mieć status "Up".

2. Sprawdź lokalny nginx:
   ```
   curl http://localhost/healthz
   ```
   Powinno zwrócić `{"ok":true}`.

3. Sprawdź czy tunel działa:
   ```
   tasklist | findstr cloudflared
   ```
   Powinien być widoczny proces.

### Restart całości:
```bat
docker-compose down
docker-compose up -d
run-tunnel.cmd
```

## 4. Pliki konfiguracyjne (Config Files)

### cloudflared-config.yml
```yaml
tunnel: 9320212e-f379-4261-8777-f9623823beee
credentials-file: C:\Users\lukas\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json
url: http://localhost:80
ingress:
  - hostname: arkuszowniasmb.pl
    service: http://localhost:80
  - hostname: www.arkuszowniasmb.pl
    service: http://localhost:80
  - service: http_status:404
```

## 5. Porty (Ports)
- 80: nginx (frontend + backend proxy)
- 8000: backend API
- 5173: frontend dev server
- 5432: PostgreSQL

## 6. Logi (Logs)
- Docker: `docker-compose logs -f`
- Tunel: Output w oknie run-tunnel.cmd

## 7. Bezpieczeństwo (Security)
- Wszystkie połączenia przez HTTPS (Cloudflare)
- Backend za nginx reverse proxy
- Credentials tunelu w %USERPROFILE%\.cloudflared
