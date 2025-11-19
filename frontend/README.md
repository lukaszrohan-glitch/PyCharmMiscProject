SMB Tool — Frontend (React + Vite)

Quick start (requires Node.js >= 18 and npm/yarn)

1. Install dependencies

```bash
cd frontend
npm install
```

2. Run dev server

```bash
npm run dev
```

The app runs by default at http://localhost:5173 and expects the backend at http://localhost:8000 (see `.env`).

### UI overview

- Top header with left‑aligned animated logo, compact primary menu and a dedicated **Home** entry.
- Right side groups search, Help, language selector and user profile menu.
- Dark header/footer areas always use light text for contrast.
- Admin panel and User Guide share the same `.page` / `.card` shell as the main dashboard.

### CSV expectations

- Import widgets live only in the Admin area and require an authenticated admin user.
- Export buttons on Orders, Warehouse and Timesheets download CSV files populated with the same rows you see in the table.

In WebStorm: File -> New -> Project from Existing Sources -> select this folder. Or open the `frontend` folder as a project.

API base is configurable in `.env` (VITE_API_BASE).
