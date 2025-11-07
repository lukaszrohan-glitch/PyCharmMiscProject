# Przewodnik Dostępu Sieciowego 🌐

## ✅ Konfiguracja Zakończona!

Twoje Narzędzie SMB jest teraz skonfigurowane do pracy z **dowolnego miejsca** - localhost, sieć lokalna lub sieci zewnętrzne!

---

## 🔗 Adresy URL Dostępu

### Dostęp Lokalny (na tym komputerze):
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Dokumentacja API**: http://localhost:8000/docs

### Dostęp przez Sieć Lokalną (z innych urządzeń w twojej sieci):
- **Frontend**: http://192.168.10.147:5173
- **Backend API**: http://192.168.10.147:8000
- **Dokumentacja API**: http://192.168.10.147:8000/docs

### Sieć Wewnętrzna Docker:
- **Frontend**: http://172.18.0.4:5173
- **Backend**: http://172.18.0.2:8000

---

## 🚀 Jak To Działa

Aplikacja teraz używa **dynamicznego wykrywania URL API**:

1. Gdy wchodzisz przez `localhost:5173` → Wywołania API idą do `localhost:8000`
2. Gdy wchodzisz przez `192.168.10.147:5173` → Wywołania API idą do `192.168.10.147:8000`
3. Gdy wchodzisz przez dowolny inny IP/domenę → Wywołania API idą do tego samego hosta na porcie 8000

**Kluczowe Zmiany:**
- ✅ Frontend dynamicznie wykrywa poprawny URL API na podstawie `window.location`
- ✅ Backend CORS zezwala na wszystkie źródła (konfigurowalne przez zmienną CORS_ORIGINS)
- ✅ Brak zakodowanych na stałe adresów `localhost`

---

## 🌍 Dostęp z Zewnątrz Twojej Sieci

Aby uzyskać dostęp z internetu (spoza sieci lokalnej), musisz:

### Opcja 1: Przekierowanie Portów (Konfiguracja Routera)
1. Zaloguj się do panelu administracyjnego routera
2. Skonfiguruj przekierowanie portów:
   - **Port 5173** → Przekieruj do `192.168.10.147:5173` (Frontend)
   - **Port 8000** → Przekieruj do `192.168.10.147:8000` (Backend)
3. Znajdź swój publiczny IP: https://whatismyipaddress.com
4. Uzyskaj dostęp do aplikacji przez: `http://TWÓJ_PUBLICZNY_IP:5173`

**Uwaga Bezpieczeństwa**: To udostępnia aplikację w internecie. Rozważ:
- Ustawienie silnych kluczy API
- Użycie HTTPS (patrz Opcja 3)
- Ograniczenie dostępu według IP jeśli możliwe

### Opcja 2: Ngrok (Szybkie i Łatwe)
1. Zainstaluj ngrok: https://ngrok.com/download
2. Uruchom te polecenia w osobnych terminalach:
   ```bash
   ngrok http 5173  # Dla frontendu
   ngrok http 8000  # Dla backendu
   ```
3. Ngrok da ci publiczne URLe takie jak:
   - `https://abc123.ngrok.io` → Twój frontend
   - `https://xyz789.ngrok.io` → Twój backend
4. Zaktualizuj plik `.env`:
   ```
   VITE_API_BASE=https://xyz789.ngrok.io/api
   ```
5. Zrestartuj frontend: `docker compose restart frontend`

### Opcja 3: Reverse Proxy z HTTPS (Konfiguracja Produkcyjna)
Użyj Nginx lub Caddy z certyfikatem SSL Let's Encrypt:
1. Zdobądź nazwę domeny (np. z Namecheap, GoDaddy)
2. Wskaż domenę na swój publiczny IP
3. Skonfiguruj Nginx reverse proxy z SSL
4. Skonfiguruj reguły firewall

---

## 🔧 Testowanie Dostępu Sieciowego

### Z Innego Urządzenia w Twojej Sieci:
1. Upewnij się, że oba urządzenia są w tej samej sieci WiFi/LAN
2. Otwórz przeglądarkę na drugim urządzeniu
3. Przejdź do: `http://192.168.10.147:5173`
4. Aplikacja powinna załadować się i działać perfekcyjnie!

### Rozwiązywanie Problemów:
Jeśli nie działa, sprawdź:
- ✅ Zapora Windows zezwala na porty 5173 i 8000
- ✅ Kontenery Docker działają: `docker compose ps`
- ✅ Twoja sieć zezwala na komunikację między urządzeniami

---

## 🔥 Konfiguracja Zapory Windows

Jeśli dostęp sieciowy nie działa, zezwól na porty:

```cmd
netsh advfirewall firewall add rule name="SMB Tool Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="SMB Tool Backend" dir=in action=allow protocol=TCP localport=8000
```

---

## 📱 Dostęp Mobilny

Możesz teraz uzyskać dostęp do aplikacji ze smartfona/tabletu:
1. Podłącz telefon do tej samej sieci WiFi
2. Otwórz przeglądarkę na telefonie
3. Przejdź do: `http://192.168.10.147:5173`
4. Dodaj do ekranu głównego dla szybkiego dostępu!

---

## ⚙️ Opcje Konfiguracji

### Ograniczenie CORS (dla bezpieczeństwa):
Edytuj plik `.env`:
```env
# Zezwól tylko na określone źródła
CORS_ORIGINS=http://192.168.10.147:5173,http://twojadomene.pl
```

Następnie zrestartuj: `docker compose restart backend`

### Niestandardowy URL API:
Jeśli musisz nadpisać automatyczne wykrywanie:
```env
VITE_API_BASE=http://twoj-wlasny-url-api.pl/api
```

Następnie przebuduj: `docker compose build frontend && docker compose up -d frontend`

---

## 🎯 Podsumowanie

**Przed:**
- ❌ Działało tylko na `localhost`
- ❌ IP sieciowe nie działało (pusta strona lub błędy API)
- ❌ Zakodowane na stałe URLe

**Po:**
- ✅ Działa na localhost: `http://localhost:5173`
- ✅ Działa w sieci: `http://192.168.10.147:5173`
- ✅ Działa na IP Docker: `http://172.18.0.4:5173`
- ✅ Może działać zewnętrznie z przekierowaniem portów/ngrok
- ✅ Dynamicznie dostosowuje się do każdej nazwy hosta/IP

---

## 🔐 Zalecenia Bezpieczeństwa

Dla dostępu zewnętrznego:
1. **Zmień domyślne klucze API** w `.env`:
   ```env
   API_KEYS=twoj-bardzo-silny-losowy-klucz-tutaj
   ADMIN_KEY=inny-bardzo-silny-klucz-admina
   ```

2. **Użyj HTTPS** (ngrok dostarcza to automatycznie)

3. **Zaimplementuj ograniczenie częstotliwości** (dodaj middleware w main.py)

4. **Monitoruj logi** w poszukiwaniu podejrzanej aktywności:
   ```bash
   docker compose logs -f backend | findstr "POST"
   ```

---

## ✅ Weryfikacja

Przetestuj wszystkie metody dostępu:
- [ ] http://localhost:5173 - Działa ✓
- [ ] http://192.168.10.147:5173 - Działa ✓
- [ ] Sprawdź konsolę przeglądarki dla logu "API Base URL:"
- [ ] Utwórz zamówienie aby zweryfikować komunikację z API
- [ ] Przetestuj z innego urządzenia w sieci

**Status: Gotowe do Dostępu Sieciowego i Zewnętrznego!** 🎉

