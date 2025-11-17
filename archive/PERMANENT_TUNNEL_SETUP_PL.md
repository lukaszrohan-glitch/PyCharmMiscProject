# Stała konfiguracja tunelu Cloudflare dla arkuszowniasmb.pl

## Cel
Uzyskanie stabilnego publicznego dostępu do aplikacji (frontend + backend za nginx) z wykorzystaniem tunelu Cloudflare działającego jako usługa Windows.

## 1. Wymagania
- Zainstalowany `cloudflared.exe` w katalogu projektu.
- Poprawny plik `cloudflared-config.yml` (zaktualizowany w repo).
- Dostęp do panelu Cloudflare (domena: arkuszowniasmb.pl).
- Działający lokalnie stack Docker (port 80 = nginx, 8000 = backend, 5173 = frontend dev, nginx reverse proxy pokazuje stronę na 80).

## 2. Konfiguracja DNS w Cloudflare (KRYTYCZNE)
W panelu Cloudflare (DNS):
1. USUŃ istniejące rekordy typu A dla `arkuszowniasmb.pl` i `www` jeśli wskazują na adresy IP.
2. DODAJ dwa rekordy typu **CNAME**:
```
Name: @            Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com  Proxy: ON
Name: www          Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com  Proxy: ON
```
3. TTL: Auto.
4. Upewnij się, że ikonka chmurki jest POMARAŃCZOWA (proxy włączone).
5. Odczekaj 2–5 minut (propagacja). Możesz sprawdzić poleceniem:
```
nslookup arkuszowniasmb.pl
```
Jeśli nadal widzisz IP Cloudflare (172.x / 104.x) ale brak CNAME—rekord A nie został usunięty.

## 3. Plik konfiguracyjny tunelu
`cloudflared-config.yml`:
```
tunnel: 9320212e-f379-4261-8777-f9623823beee
credentials-file: C:\Users\lukas\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json
originRequest:
  noTLSVerify: true
  connectTimeout: 30s
  tcpKeepAlive: 30s

ingress:
  - hostname: arkuszowniasmb.pl
    service: http://127.0.0.1:80
  - hostname: www.arkuszowniasmb.pl
    service: http://127.0.0.1:80
  - service: http_status:404
```
**Uwaga**: Używamy `127.0.0.1`, nie `localhost` aby uniknąć problemów z IPv6.

## 4. Instalacja jako usługa Windows
Uruchom w PowerShell / CMD:
```
install-cloudflared-service.cmd
```
Skrypt:
- Usuwa starą usługę (jeśli była).
- Próbuje `cloudflared service install`, a jeśli się nie powiedzie — tworzy usługę ręcznie.
- Startuje usługę.

Sprawdzenie:
```
sc query cloudflared
```
Status powinien zawierać `STATE: RUNNING`.

## 5. Test funkcjonalny
1. Lokalnie: `Invoke-WebRequest http://127.0.0.1/healthz` powinno zwrócić `{"ok":true}`.
2. Z zewnętrznej sieci / telefonu (LTE): Wejdź na `https://arkuszowniasmb.pl`.
3. Jeśli widzisz błąd 1033 lub 530:
   - Sprawdź czy rekord A nie istnieje.
   - Sprawdź czy CNAME wskazuje na `*.cfargotunnel.com`.
   - Sprawdź czy usługa `cloudflared` działa.

## 6. Monitorowanie i logi
Aby podejrzeć logi usługi:
```
Get-EventLog -LogName Application -Newest 50 | findstr /I cloudflared
```
Lub uruchom ręcznie w trybie debug:
```
cloudflared.exe tunnel --config cloudflared-config.yml run --loglevel debug
```

## 7. Typowe problemy
| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| 530 Origin unreachable | Rekord A zamiast CNAME lub brak tunelu | Usuń A, dodaj CNAME, uruchom usługę |
| 1033 Argo Tunnel error | Tunel nie zestawiony / złe creds | Sprawdź `credentials-file` i ID tunelu |
| Brak publicznego dostępu | DNS nie propagowany | Odczekaj do 10 min, użyj `nslookup` |
| Tunel zatrzymuje się | Usługa nie zainstalowana / crash | Reinstaluj przez skrypt, sprawdź antywirus |

## 8. Wycofanie / Reinstalacja
Aby zatrzymać i usunąć:
```
sc stop cloudflared
sc delete cloudflared
```
Potem ponownie:
```
install-cloudflared-service.cmd
```

## 9. Dodatkowe zabezpieczenia (opcjonalnie)
- W Cloudflare Zero Trust -> Access można dodać politykę dostępu (Google / email).
- W nginx dodać nagłówki bezpieczeństwa.
- W backend włączyć stricte API keys (już zaimplementowane) i rotację.

## 10. Szybka checklista (skrót)
1. Usuń rekordy A.
2. Dodaj dwa rekordy CNAME (@ i www) -> tunnel cfargotunnel.
3. Uruchom `install-cloudflared-service.cmd`.
4. Sprawdź `sc query cloudflared` (RUNNING).
5. Test `https://arkuszowniasmb.pl` z telefonu.
6. Jeśli błąd -> sprawdź DNS `nslookup` + usługę.

Gotowe — stały tunel zestawiony.

