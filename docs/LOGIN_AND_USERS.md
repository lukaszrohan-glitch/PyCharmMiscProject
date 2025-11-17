
## 6) Typowe problemy
- **Brak logowania w UI** – aplikacja może pracować w trybie kluczy API; użyj nagłówka `X-API-Key`.
- **Zapomniałem hasła admina** – ustaw `ADMIN_EMAIL`/`ADMIN_PASSWORD` i uruchom `create_admin.py` jak w sekcji 1.
- **Błąd 502 na /api** – wykonaj `docker-compose exec nginx nginx -t` i sprawdź logi `/var/log/nginx/error.log`. W projekcie ustawiliśmy dynamiczne rozwiązywanie DNS dla `backend`.

---

## 7) Podsumowanie
- Admina tworzysz/aktualizujesz przez `create_admin.py` i zmienne środowiskowe.
- Użytkownika zwykłego dodasz przez SQL + hash hasła z backendu.
- Integracje korzystają z kluczy API (`X-API-Key`).

W razie potrzeby rozszerzenia dokumentu – dopisz zgłoszenie w repo.
# Arkuszownia SMB – Logowanie, konto administratora i tworzenie użytkowników

Ten plik opisuje w prostych krokach:
- jakie są dane logowania do konta administratora,
- jak utworzyć lub zresetować hasło admina,
- jak dodać nowego użytkownika (zwykłego lub admina),
- jak wygenerować i używać kluczy API,
- najczęstsze problemy i szybkie sprawdzenia.

> Wymagania: uruchomione kontenery przez `docker-compose` w katalogu projektu.

---

## 1) Konto administratora – szybki start

Domyślne wartości (jeśli nie zostały nadpisane zmiennymi środowiskowymi):
- Email admina: `admin@example.com`
- Hasło: `admin`

Produkcja/realne wdrożenie: od razu zmień te wartości.

### Utworzenie / aktualizacja hasła admina (1 polecenie)
Z poziomu katalogu projektu uruchom:

```powershell
# Windows PowerShell
# Podmień wartości na swoje (hasło minimum 12 znaków)
$env:ADMIN_EMAIL    = "admin@twojadomena.pl"
$env:ADMIN_PASSWORD = "SilneHaslo#2025!"
$env:ADMIN_COMPANY  = "SMB"           # opcjonalnie
$env:ADMIN_PLAN     = "enterprise"    # opcjonalnie

docker-compose exec backend python create_admin.py
```

Skrypt `create_admin.py`:
- jeśli użytkownik o podanym emailu istnieje – podmieni mu hasło,
- jeśli nie istnieje – utworzy konto admina (stały `user_id = 'admin'`).

> Uwaga: dane logowania nie są drukowane w logach – hasło pobierane jest z `ADMIN_PASSWORD`.

---

## 2) Logowanie w aplikacji (frontend)
- Otwórz aplikację w przeglądarce (np. `http://localhost:8080` lub publiczny adres przez Cloudflare).
- Jeśli aplikacja wymaga sesji użytkownika – zaloguj się kontem utworzonym powyżej.
- Jeżeli moduł nie wymusza logowania (tryb kluczy API) – do wywołań backendu dołączaj nagłówek `X-API-Key` (patrz sekcja 4).

---

## 3) Dodanie nowego użytkownika
Masz dwie proste ścieżki – CLI (SQL) lub skrypt do admina.

### 3A) Użytkownik zwykły (SQL + bezpieczne hasło)
1. Wygeneruj hash hasła w kontenerze backendu:
   ```powershell
   docker-compose exec backend python - <<'PY'
from passlib.hash import pbkdf2_sha256 as hasher
print(hasher.hash('Moje#Haslo12345'))
PY
   ```
   Skopiuj wynik – to będzie `password_hash`.
2. Wstaw użytkownika do bazy (psql w kontenerze DB):
   ```powershell
   docker-compose exec db psql -U smb_user -d smbtool -c "INSERT INTO users (user_id, email, company_id, password_hash, is_admin, subscription_plan) VALUES ('u001', 'user@firma.pl', 'SMB', '<TUTAJ_WKLEJ_HASH>', false, 'starter');"
   ```

### 3B) Dodatkowy administrator (wygodnie przez create_admin.py)
Użyj tego samego skryptu co dla admina – ustaw inny email/hasło:

```powershell
$env:ADMIN_EMAIL    = "drugi.admin@firma.pl"
$env:ADMIN_PASSWORD = "Inne#SilneHaslo!"
docker-compose exec backend python create_admin.py
```

> Skrypt zawsze ustawia `is_admin = true` dla zakładanego konta.

### Reset hasła dowolnego użytkownika
- Wygeneruj nowy hash (jak w pkt 3A) i wykonaj `UPDATE`:
  ```powershell
  docker-compose exec db psql -U smb_user -d smbtool -c "UPDATE users SET password_hash = '<NOWY_HASH>' WHERE email = 'user@firma.pl';"
  ```

---

## 4) Klucze API (integracje, automaty)
Backend obsługuje klucze API (patrz `auth.py`).

### Utworzenie nowego klucza (zwróci jedyny raz plaintext)
```powershell
# zwróci słownik m.in. z polem "api_key" – zapisz je bezpiecznie!
docker-compose exec backend python - <<'PY'
from auth import create_api_key
print(create_api_key(label='cli'))
PY
```

### Użycie klucza w zapytaniu HTTP
```bash
curl -H "X-API-Key: <TWOJ_KLUCZ>" http://localhost:8080/api/healthz
```

### Rotacja / unieważnienie
- Rotacja (dezaktywuje stary i tworzy nowy):
  ```powershell
  docker-compose exec backend python - <<'PY'
from auth import rotate_api_key
print(rotate_api_key(key_id=1, by='admin'))
PY
  ```
- Unieważnienie po `id`:
  ```powershell
  docker-compose exec backend python - <<'PY'
from auth import delete_api_key_by_id
print(delete_api_key_by_id(1))
PY
  ```

> Tabele: `api_keys`, `api_key_audit`. Hashe są PBKDF2-HMAC-SHA256.

---

## 5) Szybkie testy działania (lokalnie)
Możesz użyć gotowego skryptu:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ps_smoke.ps1
```
Sprawdza: DB, backend `/healthz`, nginx `/api/healthz`, assety frontu oraz logi tunelu Cloudflare.

---

