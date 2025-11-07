# URGENT FIX - Blank White Page Issue

## Problem: Site shows blank white page at http://localhost:5173

### Root Cause:
**The dev server is NOT running.** You're seeing a blank page because there's no Vite server serving the React app.

---

## SOLUTION - Start the Frontend (3 Options)

### Option 1: PyCharm Terminal (EASIEST)

**IMPORTANT: npm command not working? Node.js is installed but not in PATH!**

1. Open PyCharm Terminal (bottom panel)
2. Run these commands ONE AT A TIME:

**PowerShell (if you see `PS` prompt):**
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
cd frontend
npm install
npm run dev
```

**CMD (if you see `>` prompt):**
```cmd
set PATH=C:\Program Files\nodejs;%PATH%
cd frontend
npm install
npm run dev
```

3. Wait for Vite to say "ready" with URL
4. Open http://localhost:5173 in browser
5. Hard refresh: **Ctrl+F5**

---

### Option 2: Windows CMD (If PyCharm fails)

1. Open Windows Command Prompt (cmd.exe)
2. Add Node.js to PATH (just for this session):
```cmd
set PATH=C:\Program Files\nodejs;%PATH%
```

3. Navigate to project:
```cmd
cd C:\Users\lukas\PyCharmMiscProject\frontend
```

4. Install dependencies (first time only):
```cmd
npm install
```

5. Start dev server:
```cmd
npm run dev
```

5. You should see output like:
```
VITE v5.4.10  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

6. Open http://localhost:5173 in browser
7. Hard refresh: **Ctrl+F5**

---

### Option 3: Check if Already Running

Maybe the server IS running but in a hidden window:

1. Press **Ctrl+Shift+Esc** (Task Manager)
2. Look for "node.exe" processes
3. If you see "node.exe" → the server might be running
4. Try opening http://localhost:5173 and press **Ctrl+F5**

---

## Verify It's Working

Once the server starts, you should see:

✅ Terminal shows: `VITE v5.4.10  ready in XXX ms`
✅ Terminal shows: `➜  Local:   http://localhost:5173/`
✅ Browser at http://localhost:5173 shows blue gradient header
✅ Polish text (or English if you switched)
✅ No "React is not defined" error

---

## Still Blank After Starting Server?

If you started the server BUT still see blank page:

### Check Browser Console:
1. Press **F12** (open Developer Tools)
2. Click "Console" tab
3. Look for red errors
4. **Tell me EXACTLY what the error says**

Common errors and fixes:
- "React is not defined" → Hard refresh (Ctrl+F5)
- "Failed to fetch" → Backend not running (see below)
- "Cannot GET /" → Wrong URL, use http://localhost:5173
- Nothing in console, just blank → Module cache issue, try Incognito

---

## Also Start Backend (Optional but recommended)

The frontend alone will show the UI, but API calls will fail without the backend.

**In a SECOND terminal:**

```cmd
cd C:\Users\lukas\PyCharmMiscProject
.venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Quick Checklist

- [ ] Navigated to `frontend` folder
- [ ] Ran `npm install` (first time)
- [ ] Ran `npm run dev`
- [ ] Saw "VITE ready" message
- [ ] Opened http://localhost:5173
- [ ] Hard refreshed (Ctrl+F5)
- [ ] Checked browser console for errors

---

## Why the Scripts Don't Work

The batch scripts (`scripts\start-local.cmd`, etc.) may fail if:
- Node.js not in PATH
- Python venv not activated
- Running from wrong directory
- Terminal window closes immediately

That's why **manual steps above are more reliable**.

---

## Screenshots to Help

When server is running, terminal looks like:
```
VITE v5.4.10  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Browser should show:
- Blue gradient header at top
- "Narzędzie SMB" title (Polish)
- Language switcher (🇵🇱/🇬🇧)
- White card panels
- Forms and buttons

---

## LAST RESORT - Full Reset

If nothing works:

```cmd
cd C:\Users\lukas\PyCharmMiscProject\frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

---

## Contact Info

If still blank after following ALL steps above:
1. Open browser Console (F12 → Console tab)
2. Copy the EXACT error message
3. Share it with me
4. Also share the terminal output from `npm run dev`

I'll diagnose from there!

