@echo off
cd /d C:\Users\lukas\PycharmProjects\PyCharmMiscProject
echo === Git Status ===
git status
echo.
echo === Adding files ===
git add -A
echo.
echo === Committing ===
git commit -m "fix: prevent unwanted logout - smarter auth handling

- handleAuthFailure only dispatches event, doesn't auto-logout
- Skip auth failure handling for profile/auth endpoints
- AuthProvider listens for auth:expired and verifies before logout
- Debounce multiple auth:expired events
- Keep token on startup even if profile fetch fails"
echo.
echo === Pushing ===
git push origin main
echo.
echo === Done ===

