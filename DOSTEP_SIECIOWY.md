# Instrukcja konfiguracji dostępu sieciowego

## 1. Konfiguracja Cloudflare

1. Zaloguj się do panelu Cloudflare
2. Dodaj domenę arkuszowniasmb.pl do Cloudflare
3. Zaktualizuj serwery nazw u rejestratora domeny zgodnie z instrukcjami Cloudflare
4. Poczekaj na propagację zmian DNS (może zająć do 24 godzin)

## 2. Konfiguracja tunelu Cloudflare

1. Uruchom skrypt `setup-cloudflare.cmd`
2. Postępuj zgodnie z instrukcjami w przeglądarce aby zalogować się do Cloudflare
3. Poczekaj na utworzenie tunelu i rekordów DNS
4. Sprawdź w panelu Cloudflare czy rekordy DNS zostały poprawnie utworzone

## 3. Konfiguracja aplikacji

1. Skopiuj plik `.env.example` do `.env`
2. Uzupełnij zmienne środowiskowe:
   - `CLOUDFLARE_TUNNEL_TOKEN` - token z panelu Cloudflare
   - `TUNNEL_ID` - ID tunelu (automatycznie dodane przez skrypt setup)
   - Pozostałe zmienne zgodnie z potrzebami

3. Uruchom aplikację:
```bash
docker-compose down -v
docker-compose up -d --build
```

## 4. Weryfikacja

1. Sprawdź czy aplikacja jest dostępna lokalnie:
   - http://localhost:8088

2. Sprawdź czy aplikacja jest dostępna przez internet:
   - https://arkuszowniasmb.pl

3. Sprawdź logi:
```bash
docker-compose logs -f
```

## 5. Rozwiązywanie problemów

1. Problem z dostępem do aplikacji:
   - Sprawdź status usług: `docker-compose ps`
   - Sprawdź logi: `docker-compose logs -f`
   - Sprawdź status tunelu: `cloudflared tunnel info arkuszowniasmb`

2. Problem z certyfikatem SSL:
   - Sprawdź status SSL w panelu Cloudflare
   - Upewnij się, że proxy Cloudflare jest włączony (pomarańczowa chmurka)

3. Problem z DNS:
   - Sprawdź propagację DNS: https://dnschecker.org
   - Sprawdź konfigurację DNS w panelu Cloudflare

## 6. Bezpieczeństwo

1. Upewnij się, że wszystkie wrażliwe dane są w pliku `.env`
2. Nie udostępniaj tokenów i kluczy API
3. Regularnie aktualizuj hasła i klucze dostępu
4. Monitoruj logi pod kątem podejrzanej aktywności

## 7. Aktualizacje

1. Aktualizacja aplikacji:
```bash
git pull
docker-compose down
docker-compose up -d --build
```

2. Aktualizacja cloudflared:
```bash
cloudflared update
```

## 8. Kontakt

W razie problemów:
- Email: wsparcie@arkuszowniasmb.pl
- Tel: +48 XXX XXX XXX
