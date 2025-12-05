@echo off
cd /d C:\Users\lukas\PycharmProjects\PyCharmMiscProject
echo === Git Status ===
git status
echo.
echo === Adding files ===
git add -A
echo.
echo === Committing ===
git commit -m "fix: analytics API error and dark mode visibility

- Fixed analytics summary endpoint to use _readonly_ok (allow JWT auth)
- Added analyticsSection grid layout for Production Health
- Comprehensive dark mode fixes for all components
- Added healthCard and recentActivitySection styles
- Fixed settings/profile card visibility in dark mode
- Added dark mode styles for forms, tables, modals, badges
- Improved text contrast and color composition throughout"
echo.
echo === Pushing ===
git push origin main
echo.
echo === Done ===

