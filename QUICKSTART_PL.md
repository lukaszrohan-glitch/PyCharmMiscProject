# Szybki Start 🚀

## Witaj w Narzędziu SMB!

Kompleksowe narzędzie dla małych i średnich przedsiębiorstw do zarządzania całym procesem od zamówienia, przez produkcję, do wystawienia faktury.

---

## ⚡ Najszybszy Start (Docker)

```bash
# 1. Uruchom wszystkie usługi
docker compose up -d

# 2. Poczekaj ~10 sekund na inicjalizację bazy danych

# 3. Otwórz w przeglądarce
http://localhost:5173
```

**Gotowe!** Aplikacja jest uruchomiona! 🎉

---

## 📋 Co Otrzymujesz

### Frontend (http://localhost:5173)
- 🇵🇱 Interfejs w języku polskim (możliwość przełączenia na angielski)
- 📝 Tworzenie i zarządzanie zamówieniami
- 📊 Pozycje zamówień z autouzupełnianiem
- ⏱️ Rejestracja czasu pracy pracowników
- 📦 Zarządzanie stanami magazynowymi
- 💰 Przegląd danych finansowych
- 🔑 Panel administracyjny dla zarządzania kluczami API

### Backend API (http://localhost:8000)
- 📚 Dokumentacja API: http://localhost:8000/docs
- 🔒 Uwierzytelnianie przez klucze API
- 🗄️ PostgreSQL baza danych
- ✅ Endpointy sprawności (healthcheck)

---

## 🎯 Podstawowe Użycie

### 1. Utwórz Klucz API (Pierwsze Uruchomienie)

1. Kliknij przycisk **"Panel admina"** u góry
2. Wprowadź klucz admina: `test-admin-key`
3. W polu "Etykieta nowego klucza" wpisz: `Mój Klucz`
4. Kliknij **"Utwórz"**
5. **SKOPIUJ** wyświetlony klucz (pokazany tylko raz!)
6. Wklej klucz w polu **"Klucz API (operacje zapisu)"** u góry strony

### 2. Utwórz Swoje Pierwsze Zamówienie

1. Wypełnij formularz **"Utwórz zamówienie"**:
   - ID zamówienia: `ZAM-001`
   - Klient: Zacznij pisać aby wyszukać (np. `CUST-001`)
2. Kliknij **"Utwórz zamówienie"**
3. Zamówienie pojawi się na liście!

### 3. Dodaj Pozycje Zamówienia

1. W sekcji **"Dodaj pozycję zamówienia"**:
   - Wybierz zamówienie z listy
   - Numer linii: `10`
   - Produkt: Zacznij pisać aby wyszukać (np. `PROD-001`)
   - Ilość: `5`
   - Cena jednostkowa: `100`
2. Kliknij **"Dodaj pozycję"**

### 4. Rejestruj Czas Pracy

1. W sekcji **"Rejestr czasu pracy"**:
   - ID pracownika: `EMP-001`
   - Wybierz zamówienie (opcjonalne)
   - Godziny: `8`
2. Kliknij **"Dodaj wpis czasu"**

### 5. Zarządzaj Magazynem

1. W sekcji **"Ruch magazynowy"**:
   - ID transakcji: `INV-001`
   - Produkt: Zacznij pisać aby wyszukać
   - Zmiana ilości: `100` (dodatnia) lub `-50` (ujemna)
   - Powód: Wybierz z listy (PO, WO, Sale, Adjust)
2. Kliknij **"Utwórz transakcję"**

---

## 🌐 Dostęp Sieciowy

### Dostęp Lokalny (Ten Komputer)
```
Frontend: http://localhost:5173
Backend:  http://localhost:8000
```

### Dostęp z Innych Urządzeń w Sieci
```
Frontend: http://192.168.10.147:5173
Backend:  http://192.168.10.147:8000
```

**Z telefonu/tabletu:**
1. Podłącz do tej samej sieci WiFi
2. Otwórz: `http://192.168.10.147:5173`
3. Gotowe!

📖 **Więcej informacji**: Zobacz `NETWORK_ACCESS_GUIDE_PL.md`

---

## 🛠️ Komendy Docker

```bash
# Uruchom wszystkie usługi
docker compose up -d

# Zatrzymaj wszystkie usługi
docker compose down

# Zobacz logi
docker compose logs -f

# Zobacz logi tylko frontendu
docker compose logs -f frontend

# Zrestartuj frontend po zmianach
docker compose restart frontend

# Przebuduj po zmianach w kodzie
docker compose build
docker compose up -d

# Sprawdź status kontenerów
docker compose ps

# Zatrzymaj i usuń wszystko (włącznie z danymi!)
docker compose down -v
```

---

## 🔑 Konfiguracja API

### Zmiana Kluczy (Zalecane dla Produkcji)

Edytuj plik `.env`:
```env
API_KEYS=twoj-super-tajny-klucz-12345
ADMIN_KEY=twoj-super-tajny-klucz-admina-67890
```

Następnie zrestartuj:
```bash
docker compose restart backend
```

### Użyj Klucza w Aplikacji

1. Skopiuj swój klucz API
2. Wklej w pole u góry strony: **"Klucz API (operacje zapisu)"**
3. Kliknij **"Set API key"**
4. Teraz możesz tworzyć zamówienia, pozycje, itd.

---

## 📱 Przełączanie Języka

Kliknij flagi u góry po prawej:
- 🇵🇱 Polski (domyślny)
- 🇬🇧 English

Ustawienie jest zapisywane w localStorage przeglądarki.

---

## 🎨 Funkcje Interfejsu

### Autouzupełnianie
- Wpisz kilka liter w polach "Klient" lub "Produkt"
- Pojawi się lista dopasowań
- Kliknij lub użyj strzałek ↑↓ + Enter

### Statusy Zamówień
- 🟢 **Nowe** - Świeże zamówienie
- 🔵 **Planowane** - W harmonogramie
- 🟡 **W produkcji** - Aktywna produkcja
- 🟢 **Gotowe** - Zakończone
- ⚪ **Zafakturowane** - Zamknięte

### Panel Finansowy
- Kliknij zamówienie z listy
- Po prawej stronie zobaczysz:
  - Przychód (revenue)
  - Koszt materiałów (material_cost)
  - Koszt pracy (labor_cost)
  - Marża brutto (gross_margin)

---

## 🐛 Rozwiązywanie Problemów

### Pusta Strona / Biała Strona
```bash
# Sprawdź logi frontendu
docker compose logs frontend

# Jeśli widzisz błędy, przebuduj
docker compose build --no-cache frontend
docker compose up -d
```

### "API key missing" / 401 błąd
- Upewnij się, że ustawiłeś klucz API w polu u góry
- Sprawdź czy klucz jest poprawny w `.env`
- Zrestartuj backend: `docker compose restart backend`

### Baza danych nie startuje
```bash
# Sprawdź logi
docker compose logs db

# Usuń wolumeny i zacznij od nowa
docker compose down -v
docker compose up -d
```

### Port już używany (np. 5173 lub 8000)
```bash
# Znajdź proces używający portu (Windows)
netstat -ano | findstr :5173

# Zabij proces (zastąp PID)
taskkill /PID <numer_PID> /F

# Lub zmień port w docker-compose.yml
# frontend:
#   ports:
#     - '3000:5173'  # Użyj portu 3000 zamiast 5173
```

### Nie mogę się połączyć z sieci
```bash
# Sprawdź czy kontenery działają
docker compose ps

# Sprawdź zaporę Windows
netsh advfirewall firewall add rule name="SMB Tool Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="SMB Tool Backend" dir=in action=allow protocol=TCP localport=8000

# Sprawdź IP
ipconfig
```

---

## 📚 Więcej Dokumentacji

- **README.md** / **README_PL.md** - Pełna dokumentacja projektu
- **NETWORK_ACCESS_GUIDE_PL.md** - Dostęp sieciowy i zewnętrzny
- **DOCKER_TROUBLESHOOTING.md** - Problemy z Dockerem
- **API Docs** - http://localhost:8000/docs (interaktywna)

---

## 🎯 Następne Kroki

1. ✅ Uruchom aplikację: `docker compose up -d`
2. ✅ Utwórz klucz API w panelu admina
3. ✅ Dodaj swoje pierwsze zamówienie
4. ✅ Przetestuj na telefonie: `http://192.168.10.147:5173`
5. 📖 Przeczytaj pełną dokumentację dla zaawansowanych funkcji
6. 🔐 Zmień domyślne klucze w `.env` dla produkcji

---

## ❓ Potrzebujesz Pomocy?

- Sprawdź logi: `docker compose logs -f`
- Przeczytaj pliki dokumentacji w folderze projektu
- Sprawdź GitHub Issues: https://github.com/lukaszrohan-glitch/PyCharmMiscProject

---

**Status: Gotowe do Użycia!** 🚀

Ciesz się swoim nowym narzędziem do zarządzania produkcją! 🎉

