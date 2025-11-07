# Narzędzie SMB - Dokumentacja 📚

## 🎯 Przegląd

Kompleksowe narzędzie dla małych i średnich przedsiębiorstw (SMB) do zarządzania całym procesem biznesowym:
- 📝 Zamówienia i pozycje zamówień
- ⏱️ Rejestracja czasu pracy pracowników
- 📦 Zarządzanie magazynem
- 💰 Analiza finansowa
- 🔑 Zarządzanie kluczami API

---

## 🚀 Szybki Start

```bash
# Uruchom aplikację
docker compose up -d

# Otwórz w przeglądarce
http://localhost:5173
```

📖 **Szczegółowy przewodnik**: Zobacz `QUICKSTART_PL.md`

---

## 🏗️ Architektura

### Stack Technologiczny

**Backend:**
- Python 3.11
- FastAPI (REST API)
- PostgreSQL 15 (baza danych)
- Alembic (migracje)
- Pydantic (walidacja)
- psycopg2 (driver PostgreSQL)

**Frontend:**
- React 18
- Vite (build tool)
- Vanilla CSS
- Fetch API

**Infrastruktura:**
- Docker & Docker Compose
- Nginx (opcjonalnie dla produkcji)

### Struktura Projektu

```
PyCharmMiscProject/
├── main.py                 # Aplikacja FastAPI
├── auth.py                 # Logika uwierzytelniania
├── db.py                   # Połączenie z bazą danych
├── queries.py              # Zapytania SQL
├── schemas.py              # Modele Pydantic
├── docker-compose.yml      # Orkiestracja Docker
├── Dockerfile              # Obraz backendu
├── requirements.txt        # Zależności Python
├── .env                    # Zmienne środowiskowe
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx           # Punkt wejścia
│   │   ├── App.jsx            # Główny komponent
│   │   ├── AdminPage.jsx      # Panel admina
│   │   ├── i18n.jsx           # Internacjonalizacja (PL/EN)
│   │   ├── services/
│   │   │   └── api.js         # Klient API
│   │   └── components/
│   │       ├── Autocomplete.jsx
│   │       ├── Toast.jsx
│   │       └── StatusBadge.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── alembic/                # Migracje bazy danych
│   ├── versions/
│   └── env.py
│
├── scripts/                # Skrypty pomocnicze
│   ├── init.sql           # Inicjalizacja bazy danych
│   └── *.cmd              # Skrypty Windows
│
└── tests/                  # Testy
    ├── test_auth.py
    ├── test_admin_api_keys.py
    └── e2e/               # Testy end-to-end (Playwright)
```

---

## 🔌 API Endpoints

### Publiczne (Tylko Odczyt)

```http
GET  /api/orders              # Lista wszystkich zamówień
GET  /api/orders/{order_id}   # Szczegóły zamówienia
GET  /api/finance/{order_id}  # Dane finansowe zamówienia
GET  /api/products            # Lista produktów
GET  /api/customers           # Lista klientów
GET  /api/shortages           # Niedobory magazynowe
GET  /api/planned/{order_id}  # Planowane czasy
GET  /healthz                 # Sprawdzenie statusu
```

### Chronione (Wymagany Klucz API)

```http
POST /api/orders              # Utwórz zamówienie
POST /api/order-lines         # Dodaj pozycję zamówienia
POST /api/timesheets          # Rejestruj czas pracy
POST /api/inventory           # Transakcja magazynowa
```

**Nagłówki:**
```http
x-api-key: twoj-klucz-api
```

### Admin (Wymagany Klucz Admina)

```http
GET    /api/admin/keys        # Lista kluczy API
POST   /api/admin/keys        # Utwórz nowy klucz
DELETE /api/admin/keys/{id}   # Usuń klucz
POST   /api/admin/keys/{id}/rotate  # Rotuj klucz
```

**Nagłówki:**
```http
x-admin-key: twoj-klucz-admina
```

### Dokumentacja Interaktywna

Otwórz: http://localhost:8000/docs

Swagger UI z możliwością testowania wszystkich endpointów.

---

## 🗄️ Schemat Bazy Danych

### Tabela: `orders`
```sql
order_id      VARCHAR PRIMARY KEY
customer_id   VARCHAR
status        VARCHAR (New, Planned, InProd, Done, Invoiced)
due_date      DATE
```

### Tabela: `order_lines`
```sql
order_id      VARCHAR
line_no       INTEGER
product_id    VARCHAR
qty           DECIMAL(18,4)
unit_price    DECIMAL(18,4)
discount_pct  DECIMAL(6,4)
graphic_id    VARCHAR
PRIMARY KEY (order_id, line_no)
```

### Tabela: `timesheets`
```sql
id            SERIAL PRIMARY KEY
emp_id        VARCHAR
ts_date       DATE
order_id      VARCHAR
operation_no  INTEGER
hours         DECIMAL(10,2)
notes         TEXT
```

### Tabela: `inventory_txn`
```sql
txn_id        VARCHAR PRIMARY KEY
txn_date      DATE
product_id    VARCHAR
qty_change    DECIMAL(18,4)
reason        VARCHAR (PO, WO, Sale, Adjust)
lot           VARCHAR
location      VARCHAR
```

### Tabela: `api_keys`
```sql
id            SERIAL PRIMARY KEY
api_key       VARCHAR(64) UNIQUE
label         VARCHAR
active        BOOLEAN
created_at    TIMESTAMP
last_used     TIMESTAMP
```

### Tabela: `api_key_audit`
```sql
id            SERIAL PRIMARY KEY
api_key       VARCHAR
event         VARCHAR
ip_addr       VARCHAR
user_agent    VARCHAR
endpoint      VARCHAR
status_code   INTEGER
timestamp     TIMESTAMP
```

### Widoki Pomocnicze

**`v_finance`** - Kalkulacje finansowe na zamówienie:
- revenue (przychód)
- material_cost (koszty materiałów)
- labor_cost (koszty pracy)
- gross_margin (marża brutto)

**Przykładowe Dane:**
- 2 klientów (CUST-001, CUST-002)
- 3 produktów (PROD-001, PROD-002, PROD-003)
- 1 przykładowe zamówienie (ORD-SAMPLE-001)

---

## 🔐 Uwierzytelnianie i Autoryzacja

### Poziomy Dostępu

1. **Publiczne** - Bez uwierzytelniania (tylko odczyt)
2. **API Key** - Operacje zapisu (POST)
3. **Admin Key** - Zarządzanie kluczami API

### Przepływ Uwierzytelniania

```
1. Admin tworzy klucz API w panelu admina
2. Klucz jest generowany (SHA256) i pokazany raz
3. Użytkownik zapisuje klucz
4. Użytkownik wysyła klucz w nagłówku x-api-key
5. Backend sprawdza w tabeli api_keys
6. Każde użycie jest logowane w api_key_audit
```

### Bezpieczeństwo

- ✅ Klucze hashowane (SHA256)
- ✅ Audit log dla wszystkich operacji
- ✅ Możliwość rotacji kluczy (stary zostaje zdezaktywowany)
- ✅ Śledzenie last_used timestamp
- ✅ IP i User-Agent w logach
- ✅ CORS konfigurowalne
- ⚠️ HTTPS zalecane dla produkcji

---

## 🌍 Internacjonalizacja (i18n)

### Obsługiwane Języki

- 🇵🇱 **Polski** (domyślny)
- 🇬🇧 **English**

### Przełączanie Języka

W aplikacji kliknij flagi u góry po prawej stronie.

### Dodawanie Tłumaczeń

Edytuj `frontend/src/i18n.jsx`:

```javascript
const translations = {
  en: {
    app_title: 'SMB Tool',
    orders: 'Orders',
    // ... więcej
  },
  pl: {
    app_title: 'Narzędzie SMB',
    orders: 'Zamówienia',
    // ... więcej
  }
}
```

Użycie w komponencie:
```javascript
import { useI18n } from './i18n.jsx'

function MyComponent() {
  const { t } = useI18n()
  return <h1>{t('app_title')}</h1>
}
```

---

## 🎨 Komponenty UI

### Autocomplete

Autouzupełnianie z filtrowaniem w czasie rzeczywistym.

```javascript
<Autocomplete
  items={customers}
  getLabel={c => `${c.customer_id} — ${c.name}`}
  inputValue={value}
  onInputChange={setValue}
  onSelect={c => setValue(c.customer_id)}
  placeholder="Klient"
/>
```

### Toast (Powiadomienia)

```javascript
import { useToast } from './components/Toast'

const toast = useToast()
toast.show('Zamówienie utworzone')
toast.show('Błąd!', 'error')
```

### StatusBadge

Wizualne odznaki statusu zamówień.

```javascript
<StatusBadge status="Planowane" />
```

Kolory:
- **Nowe** → Niebieski
- **Planowane** → Pomarańczowy
- **W produkcji** → Żółty
- **Gotowe** → Zielony
- **Zafakturowane** → Szary

---

## 🧪 Testowanie

### Testy Jednostkowe (pytest)

```bash
# Uruchom wszystkie testy
pytest

# Z pokryciem
pytest --cov

# Tylko testy uwierzytelniania
pytest tests/test_auth.py
```

### Testy E2E (Playwright)

```bash
cd frontend
npm test

# W trybie UI
npm run test:ui

# Określony test
npx playwright test admin.e2e.spec.js
```

**Pokrycie testami:**
- ✅ Uwierzytelnianie API key
- ✅ CRUD operacje admin
- ✅ Tworzenie zamówień (E2E)
- ✅ Dodawanie pozycji (E2E)
- ✅ Rejestracja czasu (E2E)
- ✅ Przełączanie języków (E2E)

---

## 🚀 Deployment

### Rozwój (Development)

```bash
docker compose up -d
```

### Produkcja

#### 1. Zmień Klucze

Edytuj `.env`:
```env
API_KEYS=super-tajny-klucz-produkcyjny-xyz123
ADMIN_KEY=super-tajny-admin-klucz-abc789
DATABASE_URL=postgresql://user:password@db-host:5432/dbname
CORS_ORIGINS=https://twojadomene.pl,https://www.twojadomene.pl
```

#### 2. Użyj Dockerfile Produkcyjnego

Zamiast `Dockerfile.dev` użyj `Dockerfile` (z buildem produkcyjnym):

```bash
docker compose -f docker-compose.prod.yml up -d
```

#### 3. Dodaj HTTPS (Certbot + Nginx)

```bash
# Zainstaluj Certbot
sudo apt-get install certbot python3-certbot-nginx

# Zdobądź certyfikat
sudo certbot --nginx -d twojadomene.pl
```

#### 4. Środowisko Chmurowe

**AWS ECS / Azure Container Instances / Google Cloud Run:**
- Zbuduj obrazy: `docker compose build`
- Push do rejestru: Docker Hub, ECR, ACR, GCR
- Deploy według dokumentacji platformy
- Skonfiguruj zmienne środowiskowe
- Ustaw load balancer z SSL

**DigitalOcean App Platform:**
- Połącz repozytorium GitHub
- Wybierz branch do deploymentu
- Ustaw zmienne środowiskowe
- Deploy automatyczny przy każdym push

---

## 🔧 Konfiguracja Zaawansowana

### Zmienne Środowiskowe

Plik `.env`:
```env
# Baza danych
DATABASE_URL=postgresql://user:pass@host:5432/db

# Uwierzytelnianie
API_KEYS=key1,key2,key3
ADMIN_KEY=admin-key

# CORS
CORS_ORIGINS=http://localhost:5173,https://twojadomene.pl

# Frontend
VITE_API_BASE=http://localhost:8000/api
VITE_DEFAULT_LANG=pl
```

### Skalowanie

**Horizontal Scaling (wiele instancji):**
```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
```

**Database Connection Pool:**
```python
# Zwiększ max_connections w PostgreSQL
max_connections = 200
```

### Monitoring

**Healthcheck Endpoints:**
- Backend: `GET /healthz` → 200 OK
- Database: sprawdzane przez Docker healthcheck

**Logi:**
```bash
# Wszystkie usługi
docker compose logs -f

# Tylko błędy
docker compose logs -f | grep ERROR

# Export do pliku
docker compose logs > app.log
```

**Metryki (opcjonalnie):**
- Prometheus dla metryk
- Grafana dla dashboardów
- Jaeger dla tracingu

---

## 🐛 Znane Problemy i Rozwiązania

### Problem: Frontend pokazuje pustą stronę
**Rozwiązanie:**
```bash
docker compose logs frontend
# Jeśli widzisz błędy Vite, przebuduj:
docker compose build --no-cache frontend
docker compose up -d
```

### Problem: CORS błędy
**Rozwiązanie:**
Zaktualizuj `CORS_ORIGINS` w `.env` i zrestartuj backend:
```bash
docker compose restart backend
```

### Problem: "API key missing"
**Rozwiązanie:**
1. Sprawdź czy API_KEYS jest ustawiony w `.env`
2. Upewnij się że klucz jest wpisany w interfejsie
3. Sprawdź logi backendu: `docker compose logs backend`

### Problem: Baza danych nie startuje
**Rozwiązanie:**
```bash
# Usuń stare wolumeny
docker compose down -v
# Uruchom ponownie
docker compose up -d
```

### Problem: Port już zajęty
**Rozwiązanie:**
Zmień porty w `docker-compose.yml`:
```yaml
ports:
  - '3000:5173'  # Zamiast 5173:5173
```

---

## 📈 Roadmap

### ✅ Zrobione
- [x] Podstawowe CRUD dla zamówień
- [x] Pozycje zamówień
- [x] Rejestracja czasu pracy
- [x] Zarządzanie magazynem
- [x] Dane finansowe
- [x] Internacjonalizacja (PL/EN)
- [x] Panel admina dla kluczy API
- [x] Autouzupełnianie
- [x] Testy E2E
- [x] Dostęp sieciowy

### 🔄 W Toku
- [ ] Raporty PDF
- [ ] Export do Excel
- [ ] Dashboard z wykresami
- [ ] Powiadomienia email

### 🔮 Planowane
- [ ] Moduł CRM
- [ ] Integracja z systemami ERP
- [ ] Aplikacja mobilna
- [ ] Chatbot AI do wsparcia

---

## 🤝 Wkład (Contributing)

Chcesz pomóc? Świetnie!

1. Fork repozytorium
2. Utwórz branch: `git checkout -b feature/super-funkcja`
3. Commit zmian: `git commit -m 'Dodaj super funkcję'`
4. Push: `git push origin feature/super-funkcja`
5. Otwórz Pull Request

**Wytyczne:**
- Pisz testy dla nowych funkcji
- Dokumentuj API endpointy
- Używaj sensownych nazw commitów
- Aktualizuj README jeśli potrzeba

---

## 📄 Licencja

MIT License - możesz używać, modyfikować i dystrybuować swobodnie.

---

## 📞 Wsparcie

- 📧 Email: lukasz.rohan@gmail.com
- 🐛 Issues: https://github.com/lukaszrohan-glitch/PyCharmMiscProject/issues
- 📚 Dokumentacja: Zobacz pliki w katalogu projektu

---

## 🙏 Podziękowania

Zbudowane z:
- FastAPI (https://fastapi.tiangolo.com)
- React (https://react.dev)
- PostgreSQL (https://postgresql.org)
- Docker (https://docker.com)
- Vite (https://vitejs.dev)

---

**Wersja:** 1.0.0  
**Ostatnia aktualizacja:** 7 listopada 2025  
**Status:** Gotowe do Produkcji ✅

Dziękujemy za użycie Narzędzia SMB! 🎉

