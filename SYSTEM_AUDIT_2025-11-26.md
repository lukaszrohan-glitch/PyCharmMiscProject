# Synterra System Audit & Fix Plan
**Date:** November 26, 2025  
**Objective:** Eliminate recurring issues and establish production-grade standards

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **Frontend Build Process**
- ❌ `frontend/dist` ignored in git but Railway needs static assets
- ❌ No automated rebuild on deploy
- ❌ Vite dev dependencies causing production confusion
- ✅ **FIX:** Dockerfile must run `npm run build` and serve from dist

### 2. **Auto-Generated Order IDs**
- ❌ Frontend still allows manual order_id entry
- ❌ Backend `next_order_id()` exists but not enforced
- ✅ **FIX:** Make order_id optional in schema, auto-generate if missing

### 3. **Login Page Styling**
- ❌ Two-tone background (dark + light sections)
- ❌ Not matching rest of app theme
- ✅ **FIX:** Unified `--bg-light` background with proper contrast

### 4. **User Guide Link**
- ❌ Help button doesn't open guide overlay
- ❌ UserGuide component never displays
- ✅ **FIX:** Wire `setCurrentView('guide')` in Header

### 5. **CSV Export Empty Data**
- ❌ Orders/Inventory exports return empty rows
- ❌ DB fetch returns None instead of empty list
- ✅ **FIX:** Ensure `fetch_all` returns `[]` on empty, handle nulls

### 6. **Datetime Deprecation Warnings**
- ⚠️ `datetime.utcnow()` deprecated in Python 3.12+
- ✅ **FIX:** Replace with `datetime.now(timezone.utc)`

### 7. **ESLint/React Fast Refresh**
- ❌ Recurring warnings about context/hooks in component files
- ✅ **FIX:** Separate contexts, hooks, and components (DONE)

### 8. **Database Transaction Handling**
- ❌ SQLite "cannot commit - SQL in progress" errors in tests
- ✅ **FIX:** Proper connection context managers (DONE)

---

## 🟡 MISSING FEATURES (vs. Competitors)

### Must-Have Features
1. **Dashboard Analytics**
   - Real-time order counts by status
   - Revenue charts (daily/weekly/monthly)
   - Low inventory alerts
   - Employee productivity metrics

2. **Advanced Filters & Search**
   - Date range pickers
   - Multi-status filters
   - Customer/product search autocomplete
   - Saved filter presets

3. **Batch Operations**
   - Bulk status updates
   - Mass CSV import with validation
   - Batch delete with undo

4. **Notifications System**
   - Toast notifications for all actions
   - Email alerts (order due soon, low stock)
   - In-app notification center

5. **Audit Trail**
   - Who changed what when
   - Change history per order
   - Export audit logs

6. **Multi-Language Support**
   - Polish (default) ✅
   - English ✅
   - Need: German, Spanish for EU expansion

7. **Mobile Responsiveness**
   - Touch-friendly buttons
   - Collapsible sidebar
   - Swipe gestures

8. **Dark Mode**
   - User preference toggle
   - System preference detection
   - Proper contrast ratios

9. **Keyboard Shortcuts**
   - Global shortcuts (/ for search, ? for help) ✅
   - Ctrl+S to save forms
   - Escape to close modals ✅
   - Tab navigation

10. **Export/Import Formats**
    - CSV ✅
    - Excel (.xlsx)
    - PDF reports
    - JSON for API integration

---

## 🟢 IMPLEMENTATION PRIORITIES

### Phase 1: Fix Core Issues (TODAY)
- [ ] Dockerfile: proper frontend build
- [ ] Auto order IDs in backend
- [ ] Login page styling
- [ ] Help overlay wiring
- [ ] CSV export data fix
- [ ] Datetime deprecations

### Phase 2: Essential Features (WEEK 1)
- [ ] Dashboard with real charts
- [ ] Advanced filters on Orders/Inventory
- [ ] Batch CSV import with preview
- [ ] Toast notifications everywhere
- [ ] Mobile responsive layout

### Phase 3: Professional Polish (WEEK 2)
- [ ] Dark mode toggle
- [ ] Full keyboard shortcuts
- [ ] Excel export
- [ ] PDF reports
- [ ] Audit trail

### Phase 4: Scale & Optimize (WEEK 3)
- [ ] Performance profiling
- [ ] Database indexing
- [ ] CDN for static assets
- [ ] Monitoring & alerting
- [ ] Load testing

---

## 📋 ACTION ITEMS

### Backend
1. Replace all `datetime.utcnow()` with `datetime.now(timezone.utc)`
2. Make `order_id` optional in `OrderCreate`, call `next_order_id()` if None
3. Ensure `fetch_all` returns `[]` not `None`
4. Add CSV null-handling in all export endpoints
5. Add validation for duplicate order IDs with clear error messages

### Frontend
1. Remove manual order_id input field, show auto-generated as read-only
2. Unify Login.jsx background to single color
3. Wire Help button to `setCurrentView('guide')` properly
4. Add loading states to all forms
5. Add success/error toasts to all mutations
6. Implement proper error boundaries
7. Add skeleton loaders for data tables

### DevOps
1. Update Dockerfile to build frontend during image creation
2. Add health check for frontend static files
3. Set up Railway environment variables properly
4. Add staging environment
5. Configure automatic rollback on failure

---

## 🎯 QUALITY STANDARDS

### Code Quality
- ✅ ESLint passes with 0 warnings
- ✅ Pytest passes with 0 failures
- ✅ Type hints on all Python functions
- ✅ PropTypes or TypeScript for React
- ✅ No console.log in production
- ✅ Proper error handling everywhere

### UX Standards
- ✅ All interactive elements min 44×44px (WCAG)
- ✅ Color contrast ratio ≥4.5:1
- ✅ Keyboard navigation works
- ✅ Screen reader friendly
- ✅ Loading states < 200ms
- ✅ Smooth animations (prefer-reduced-motion)

### Performance
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ API response times < 500ms
- ✅ Database queries optimized
- ✅ Images optimized/lazy-loaded

---

## 🚀 DEPLOYMENT CHECKLIST

Before every push:
1. Run `npm run lint` (frontend)
2. Run `pytest -q` (backend)
3. Run `npm run build` (frontend)
4. Test localhost:8080 manually
5. Check Railway logs after deploy
6. Verify /healthz returns 200
7. Spot-check critical user flows

---

*Next: Execute Phase 1 fixes systematically*

