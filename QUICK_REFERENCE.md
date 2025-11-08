# 🎯 Quick Reference Card - Public Sharing

## For You (Host)

### First Time Only:
```powershell
# 1. Download cloudflared from https://github.com/cloudflare/cloudflared/releases
# 2. Extract to project folder
# 3. Login to Cloudflare (creates free account)
cloudflared.exe tunnel login
# 4. Create tunnel
cloudflared.exe tunnel create my-app
# 5. Create cloudflared-config.yml (see docs)
```

### Every Time:
```powershell
# Double-click:
UDOSTEPNIJ.cmd          # Polish
SHARE-PUBLIC.cmd        # English

# Or manually:
docker-compose up -d
cloudflared.exe tunnel --config cloudflared-config.yml run my-app
```

### Share:
```
Send permanent link to users:
https://my-app.trycloudflare.com
(Link never changes!)
```

---

## For Users

### What They Do:
1. Click link
2. Choose: Skip API key OR Enter key
3. Use the app!

### What They DON'T Need:
❌ Installation
❌ Configuration  
❌ Technical knowledge
❌ Docker/Python
❌ Any setup
❌ Click welcome screens

---

## Key Files

| File | Purpose |
|------|---------|
| `UDOSTEPNIJ.cmd` | 🇵🇱 Auto-start script |
| `SHARE-PUBLIC.cmd` | 🇬🇧 Auto-start script |
| `UDOSTEPNIANIE_UZYTKOWNIKOM.md` | 🇵🇱 Simple guide (you) |
| `SHARE_WITH_USERS.md` | 🇬🇧 Simple guide (you) |
| `DOSTEP_ZEWNETRZNY.md` | 🇵🇱 Technical details |
| `PUBLIC_ACCESS.md` | 🇬🇧 Technical details |
| `PRZEWODNIK_UZYTKOWNIKA.md` | 🇵🇱 User guide |
| `USER_GUIDE.md` | 🇬🇧 User guide |

---

## Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| cloudflared not found | Put `cloudflared.exe` in project folder |
| Docker error | Start Docker Desktop |
| Link doesn't work | `docker-compose restart` |
| Blank page | `docker-compose logs frontend` |
| Cloudflare error 1033 | Restart tunnel |

---

## Commands

```powershell
# Start app
docker-compose up -d

# Stop app
docker-compose down

# Restart app
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Start Cloudflare Tunnel
cloudflared.exe tunnel --config cloudflared-config.yml run my-app
```

---

## Security

```bash
# Change admin key in .env:
ADMIN_API_KEY=your-strong-key-64-chars

# Remove test keys (in app Admin panel):
Delete test-key-12345
```

---

## Benefits (Cloudflare Tunnel)

- ✅ Permanent link (never changes)
- ✅ Free forever
- ✅ No time limits
- ✅ Fast (CDN)
- ✅ No welcome screens

---

## Upgrade Options

| Need | Solution |
|------|----------|
| Custom domain | Configure in Cloudflare (free) |
| More control | VPS hosting ($5-10/mo) |
| Production | VPS + own domain |

---

## Support

📖 Full docs: `PUBLIC_ACCESS_SUMMARY.md`
📧 Help: lukasz.rohan@gmail.com
🐛 Issues: GitHub

---

**Print this card or save it for quick reference! 📋**

