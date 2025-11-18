# Synterra - Repository Overview

**Manufacturing Management System for Small and Medium-Sized Enterprises**

A comprehensive SPA application for managing manufacturing operations, including order management, inventory tracking, timesheets, and financial reporting.

---

## Project Overview

Synterra is a full-stack manufacturing management system designed for SMBs. It provides real-time order tracking, inventory management, employee timesheets, and financial analytics.

- **Language**: Python (Backend), JavaScript/React (Frontend)
- **Status**: Production-ready
- **License**: Proprietary - Synterra
- **Support**: admin@arkuszowniasmb.pl

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Server**: Uvicorn 0.30.0
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens, API key management, bcrypt password hashing
- **Migrations**: Alembic 1.11.1
- **Additional**: Pydantic models, python-jose, passlib, python-dotenv

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Emotion (@emotion/react, @emotion/styled)
- **HTTP Client**: Axios 1.5.0
- **Routing**: React Router DOM 6.16.0
- **Date Handling**: date-fns 2.30.0
- **Utilities**: clsx (className utility)

### Infrastructure
- **Container**: Docker with docker-compose
- **Web Server**: Nginx (reverse proxy & static file serving)
- **Database**: PostgreSQL
- **Tunneling**: Cloudflare Tunnel support
- **Monitoring**: Prometheus (optional)

---

## Project Structure

```
C:\Users\lukas\PyCharmMiscProject/
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ApiKeyManager.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── UserGuide.jsx
│   │   │   └── ...
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer (api.js)
│   │   ├── styles/            # Global and theme CSS
│   │   ├── utils/             # Utility functions
│   │   ├── locales/           # i18n translations (Polish)
│   │   ├── App.jsx            # Root component
│   │   └── main.jsx           # React entry point
│   ├── dist/                  # Built production files
│   ├── public/                # Static assets
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend (Python modules in root)
│   ├── main.py               # FastAPI application entry point
│   ├── db.py                 # Database connection & queries (12.42 KB)
│   ├── schemas.py            # Pydantic models for request/response validation
│   ├── queries.py            # SQL queries and constants
│   ├── auth.py               # API key & authentication logic
│   ├── user_mgmt.py          # User management, JWT auth
│   ├── logging_utils.py      # Logging utilities
│   └── requirements.txt      # Python dependencies
│
├── alembic/                  # Database migrations
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── scripts/                  # Helper scripts
│   ├── init.sql             # Database initialization
│   ├── start-local.cmd      # Local startup
│   ├── create_admin.py
│   ├── seed_or_update_admin.py
│   ├── run_migrations.ps1
│   ├── test_auth_flow.py
│   └── ... (30+ utility scripts)
│
├── tests/                   # Test suite
│   ├── conftest.py         # pytest configuration
│   ├── test_auth.py
│   ├── test_admin_api_keys.py
│   ├── test_schemas.py
│   └── e2e/                # End-to-end tests
│
├── monitoring/             # Prometheus monitoring config
│   └── prometheus.yml
│
├── docs/                   # Documentation
│   └── LOGIN_AND_USERS.md
│
├── logs/                   # Application logs (nginx, cloudflared)
│
├── ssl/                    # SSL certificates (if applicable)
│
├── cloudflared/            # Cloudflare tunnel binaries
│
├── powerquery/             # Power Query scripts for data export
│
├── docker-compose.yml      # Docker orchestration
├── nginx.conf             # Nginx configuration
├── Dockerfile             # Backend container definition
├── .env                   # Environment variables (not in git)
├── .dockerignore
├── .gitignore
├── alembic.ini           # Alembic migration config
├── pytest.ini            # pytest configuration
├── qodana.yaml           # Code analysis config
└── README.md             # Main documentation

```

---

## Backend API Endpoints

### Health & Status
- `GET /healthz` - Health check endpoint
- `GET /api/healthz` - API health check (compatibility route)

### Public Data Endpoints (No Authentication Required)
- `GET /api/orders` - List all orders
- `GET /api/products` - List all products
- `GET /api/customers` - List all customers
- `GET /api/finance/{order_id}` - Get financial data for an order
- `GET /api/planned-time/{order_id}` - Get planned time data
- `GET /api/shortages` - List material shortages

### Protected Endpoints (Require X-API-Key Header)
- `POST /api/orders` - Create a new order
- `POST /api/order-lines` - Add line items to order
- `POST /api/timesheets` - Log employee timesheet entry
- `POST /api/inventory` - Record inventory transaction

### Authentication Endpoints
- `POST /api/auth/login` - User login (email/password)
- `POST /api/auth/change-password` - Change user password
- `GET /api/user/profile` - Get current user profile (JWT required)

### Admin Endpoints (Require X-Admin-Key Header)
- `GET /api/admin/api-keys` - List API keys
- `POST /api/admin/api-keys` - Create new API key
- `DELETE /api/admin/api-keys/{key_id}` - Revoke API key
- `POST /api/admin/api-keys/{key_id}/rotate` - Rotate API key
- `GET /api/admin/api-key-audit` - View API key usage audit log
- `DELETE /api/admin/api-key-audit` - Purge audit logs older than N days
- `POST /api/admin/users` - Create new user (admin)
- `GET /api/admin/users` - List all users
- `POST /api/admin/subscription-plans` - Create subscription plan
- `GET /api/admin/subscription-plans` - List subscription plans

---

## Backend Key Modules

### main.py (395 lines)
Central FastAPI application with all route handlers, CORS configuration, and request/response processing.

**Key Features**:
- API key validation (both env-based and DB-backed)
- Admin key authentication
- Request validation with Pydantic schemas
- Global error handling
- CORS middleware
- API key usage audit logging
- User profile & password management

### db.py (12.42 KB)
Database connection management and query execution layer.

**Key Functions**:
- `get_db()` - Database connection generator
- `fetch_all(query, params)` - Execute SELECT, return all rows
- `fetch_one(query, params)` - Execute SELECT, return single row
- `execute(query, params, returning=False)` - Execute INSERT/UPDATE/DELETE
- PostgreSQL and SQLite compatibility layer

### auth.py
API key and authentication management.

**Key Functions**:
- `ensure_table()` - Create api_keys table if needed
- `create_api_key(label)` - Generate new API key with audit
- `get_api_key(key)` - Look up API key details
- `list_api_keys()` - Get all keys
- `delete_api_key_by_id(key_id)` - Revoke a key
- `rotate_api_key(key_id)` - Generate new key, revoke old
- `log_api_key_event()` - Audit trail
- `mark_last_used()` - Track key usage

### user_mgmt.py (8.14 KB)
User account and subscription management with JWT authentication.

**Key Functions**:
- `ensure_user_tables()` - Initialize user tables
- `login_user(email, password)` - Authenticate & return JWT token
- `create_user(email, company_id, is_admin, subscription_plan, password)` - Register new user
- `list_users()` - Get all users (admin)
- `change_password(user_id, old_pwd, new_pwd)` - Update password
- `get_current_user(token)` - JWT validation & extraction
- `require_admin()` - Admin authorization check
- `create_plan()` - Add subscription tier
- `list_plans()` - Get subscription plans

### schemas.py (3.68 KB)
Pydantic models for data validation.

**Key Models**:
- `Order` - Order details with ID, customer, status, due date
- `Finance` - Financial metrics per order
- `OrderCreate`, `OrderLineCreate` - Request models
- `TimesheetCreate`, `InventoryCreate` - Transaction models
- `UserLogin`, `PasswordChange` - Auth models
- `UserCreateAdmin`, `SubscriptionPlanCreate` - Admin models

### queries.py (2.52 KB)
Pre-defined SQL queries as constants.

**Key Queries**:
- `SQL_ORDERS` - Fetch all orders with related data
- `SQL_FINANCE_ONE` - Financial data for order
- `SQL_SHORTAGES` - Material shortage report
- `SQL_PLANNED_ONE` - Planned time data
- `SQL_INSERT_ORDER`, `SQL_INSERT_ORDER_LINE` - Order creation
- `SQL_INSERT_TIMESHEET`, `SQL_INSERT_INVENTORY` - Transaction logging
- `SQL_PRODUCTS`, `SQL_CUSTOMERS` - Master data

---

## Frontend Key Components

### App.jsx
Root component with routing configuration. Integrates all pages and auth flow.

### components/Login.jsx (3.43 KB)
User authentication form with email/password entry and JWT token handling.

### components/Dashboard.jsx (2.82 KB)
Main dashboard displaying overview of orders, inventory, and key metrics.

### components/Header.jsx (4.51 KB)
Navigation header with user menu, language switcher, theme toggle.

### components/ApiKeyManager.jsx (6.66 KB)
Admin panel for creating, rotating, and revoking API keys with audit history.

### components/Settings.jsx (5.65 KB)
User preferences, theme settings, and account management.

### components/UserGuide.jsx (14.79 KB)
Interactive help documentation and feature tutorials.

### components/FinancePanel.jsx (2.76 KB)
Financial reporting and analytics for orders.

### services/api.js (6.78 KB)
Axios-based HTTP client with:
- Base URL configuration
- JWT token injection in headers
- Error handling & response interceptors
- API key fallback support

### hooks/useTheme.js (1.23 KB)
Custom hook for managing light/dark theme state and persistence.

### i18n.js, locales/pl.js
Internationalization setup with Polish language support.

---

## Database Schema

The database includes these main entities:

### Core Tables
- **orders** - Order master records (order_id, customer_id, status, due_date, created_at)
- **order_lines** - Order line items (order_id, line_no, product_id, qty, unit_price, discount_pct)
- **products** - Product master data (product_id, name, category, unit_price)
- **customers** - Customer records (customer_id, name, contact_info)
- **inventory** - Inventory transactions (txn_id, txn_date, product_id, qty_change, reason, lot, location)
- **timesheets** - Employee time tracking (emp_id, ts_date, order_id, operation_no, hours, notes)

### User Management Tables
- **users** - User accounts (user_id, email, password_hash, company_id, is_admin, created_at)
- **subscription_plans** - Pricing tiers (plan_id, name, max_orders, max_users, features)

### Security & Audit Tables
- **api_keys** - API credentials (id, key_hash, label, created_at, last_used, is_active)
- **api_key_audit** - Usage tracking (id, api_key_id, event_type, event_time, client_info)

### Views
- **v_planned_time** - Aggregated timesheet data
- **v_shortages** - Current inventory shortages

---

## Running the Application

### Quick Start (Docker)

1. **Clone and navigate**:
   ```bash
   cd C:\Users\lukas\PyCharmMiscProject
   ```

2. **Build frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Access application**:
   - Frontend: http://localhost:8080
   - API: http://localhost:8080/api
   - Health: http://localhost:8080/api/healthz

### Default Credentials
- **API Key**: `dev-key-change-in-production`
- **Admin Key**: `admin-change-in-production`
- ⚠️ Change in production via `.env` file

### Local Development

1. **Backend setup**:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   
   $env:DATABASE_URL="postgresql://smb_user:smb_password@localhost:5432/smbtool"
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend development**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## Configuration

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://smb_user:smb_password@db:5432/smbtool
API_KEYS=your-secure-api-key-here
ADMIN_KEY=your-secure-admin-key-here
CORS_ORIGINS=http://localhost:8080,https://yourdomain.com
ALLOWED_HOSTS=localhost,yourdomain.com
CLOUDFLARE_TUNNEL_TOKEN=your-tunnel-token
```

### Docker Services
- **nginx** (port 8080) - Web server & reverse proxy
- **backend** (port 8000 internal) - FastAPI application
- **db** (port 5432 internal) - PostgreSQL database

---

## Testing

### Run Tests
```bash
pytest tests/
```

### Test Files
- `test_auth.py` - Authentication flow tests
- `test_admin_api_keys.py` - API key management tests
- `test_schemas.py` - Data validation tests
- `tests/e2e/` - End-to-end integration tests

### Run E2E Tests
- Windows: `scripts/run-e2e.ps1`
- Linux: `scripts/run-e2e.sh`

---

## Common Tasks

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f nginx
docker-compose logs -f db
```

### Database Backup
```bash
docker-compose exec db pg_dump -U smb_user smbtool > backup.sql
```

### Database Restore
```bash
Get-Content backup.sql | docker-compose exec -T db psql -U smb_user smbtool
```

### Clear Everything
```bash
docker-compose down -v
Remove-Item -Recurse -Force frontend\dist
cd frontend && npm install && npm run build && cd ..
docker-compose up -d --build
```

### Run Frontend Linting
```bash
cd frontend
npm run lint
```

---

## Deployment

### Production Checklist
- [ ] Change `API_KEYS` in `.env`
- [ ] Change `ADMIN_KEY` in `.env`
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Update `CORS_ORIGINS` with your domain
- [ ] Enable HTTPS (via reverse proxy)
- [ ] Configure database backups
- [ ] Set up log rotation
- [ ] Review nginx security headers
- [ ] Set up monitoring (Prometheus)

### Cloudflare Tunnel Setup
```bash
# Set tunnel token in .env
CLOUDFLARE_TUNNEL_TOKEN=your-actual-tunnel-token

# Start with production profile
docker-compose --profile production up -d
```

---

## Key Features

✅ **Order Management** - Create, track, and manage manufacturing orders  
✅ **Inventory Tracking** - Real-time inventory with transaction history  
✅ **Timesheet Logging** - Employee hour tracking per order/operation  
✅ **Financial Reporting** - Cost analysis and margin tracking  
✅ **API Key Management** - Secure API authentication with audit trail  
✅ **User Management** - Multi-user with role-based access control  
✅ **Subscription Plans** - Tiered pricing & feature management  
✅ **Multi-language** - Polish language support (i18n ready)  
✅ **Theme Support** - Light/dark theme toggle  
✅ **Cloudflare Tunnel** - Easy public access without port forwarding  

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `start-local.cmd` | Start all services locally |
| `run_migrations.ps1` | Run database migrations |
| `check-health.ps1` | Verify all services are healthy |
| `populate-db.ps1` | Insert test data |
| `create_admin.py` | Create admin user |
| `test_auth_flow.py` | Verify authentication |
| `run-e2e.ps1` | Run end-to-end tests |

---

## Troubleshooting

### Blank Frontend Page
- Rebuild: `cd frontend && npm run build && cd ..`
- Restart: `docker-compose restart nginx`

### API Not Responding
- Check logs: `docker-compose logs backend`
- Verify health: `Invoke-WebRequest http://localhost:8080/api/healthz`
- Restart: `docker-compose restart backend`

### Database Connection Issues
- Check status: `docker-compose logs db`
- Verify credentials in `.env`
- Restart: `docker-compose restart db`

### Port Already in Use
Edit `docker-compose.yml` to use different port (e.g., 8081:80)

---

## Additional Documentation

- `README.md` - User-focused documentation
- `README_PL.md` - Polish language readme
- `README_DEV.md` - Development setup guide
- `docs/LOGIN_AND_USERS.md` - Authentication details
- `API_KEYS_GUIDE.md` - API key management
- `GET_STARTED.md` - Quick start guide

---

## Support & Contact

**Email**: admin@arkuszowniasmb.pl  
**Project Location**: C:\Users\lukas\PyCharmMiscProject
