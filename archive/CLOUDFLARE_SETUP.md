# 🚀 Cloudflare Tunnel Setup Guide

## Quick Setup (10 Minutes)

This guide will help you set up Cloudflare Tunnel to share your app with a **permanent link** that never changes.

---

## ✅ Prerequisites

- Windows 10/11
- Docker Desktop installed and running
- Application working locally (`http://localhost`)

---

## 📥 Step 1: Download Cloudflared (2 minutes)

1. Go to: https://github.com/cloudflare/cloudflared/releases
2. Find the latest release
3. Download: `cloudflared-windows-amd64.exe`
4. Move the file to your project folder: `C:\Users\lukas\PyCharmMiscProject\`
5. Rename it to: `cloudflared.exe`

**Verify installation:**
```powershell
cd C:\Users\lukas\PyCharmMiscProject
.\cloudflared.exe version
```

You should see version information.

---

## 🔐 Step 2: Login to Cloudflare (1 minute)

```powershell
.\cloudflared.exe tunnel login
```

**What happens:**
- Browser opens automatically
- If you don't have a Cloudflare account, create one (free)
- Authorize cloudflared to access your account
- A credentials file is saved to `C:\Users\lukas\.cloudflared\`

**Success message:**
```
You have successfully logged in.
```

---

## 🔨 Step 3: Create Tunnel (1 minute)

```powershell
.\cloudflared.exe tunnel create my-app
```

**What you'll see:**
```
Created tunnel my-app with id a1b2c3d4-e5f6-7890-1234-567890abcdef
```

**⚠️ IMPORTANT:** Copy and save the **Tunnel ID** (the long string after "with id").

---

## 📝 Step 4: Create Configuration File (3 minutes)

Create a new file named `cloudflared-config.yml` in your project folder with this content:

```yaml
tunnel: a1b2c3d4-e5f6-7890-1234-567890abcdef
credentials-file: C:\Users\lukas\.cloudflared\a1b2c3d4-e5f6-7890-1234-567890abcdef.json

ingress:
  - service: http://localhost:80
```

**Replace:**
- `a1b2c3d4-e5f6-7890-1234-567890abcdef` with YOUR actual Tunnel ID (both places)
- Make sure the username in the path matches yours (currently `lukas`)

**File location:** `C:\Users\lukas\PyCharmMiscProject\cloudflared-config.yml`

---

## 🧪 Step 5: Test the Tunnel (2 minutes)

**Start your application:**
```powershell
docker-compose up -d
```

**Start the tunnel:**
```powershell
.\cloudflared.exe tunnel --config cloudflared-config.yml run my-app
```

**What you'll see:**
```
INF Connection established
INF Your Quick Tunnel is available at:
https://my-app-abc123.trycloudflare.com
```

**🎉 Success!** Copy that link and try opening it in your browser.

---

## 🎯 Step 6: Use the Scripts (Optional)

For easier daily use, the project includes automated scripts:

**Windows:**
- Double-click `UDOSTEPNIJ.cmd` (Polish)
- Double-click `SHARE-PUBLIC.cmd` (English)

These scripts will:
1. Start Docker
2. Start Cloudflare Tunnel
3. Show you the permanent link

---

## 🔄 Daily Usage

### Every time you want to share:

1. **Start app + tunnel:**
   ```powershell
   # Option A: Use script (easiest)
   .\UDOSTEPNIJ.cmd
   
   # Option B: Manual
   docker-compose up -d
   .\cloudflared.exe tunnel --config cloudflared-config.yml run my-app
   ```

2. **Copy the link** shown in terminal

3. **Send to users** via email/SMS/chat

4. **Keep terminal open** while users are working

5. **Stop when done:** Press `Ctrl+C` in terminal

---

## 💡 Your Permanent Link

Your link will look like:
```
https://my-app-abc123.trycloudflare.com
```

**Benefits:**
- ✅ Same link every time
- ✅ Free forever
- ✅ Fast (Cloudflare CDN)
- ✅ Secure (HTTPS)
- ✅ No time limits
- ✅ No banners or welcome screens

---

## 🎨 Custom Domain (Optional)

Want to use your own domain like `app.yourdomain.com`?

1. **Add domain to Cloudflare** (free)
2. **Create DNS record:**
   ```powershell
   .\cloudflared.exe tunnel route dns my-app app.yourdomain.com
   ```
3. **Update config file:**
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: C:\Users\lukas\.cloudflared\YOUR_TUNNEL_ID.json
   
   ingress:
     - hostname: app.yourdomain.com
       service: http://localhost:80
     - service: http_status:404
   ```

---

## 🆘 Troubleshooting

### "tunnel not found"
**Solution:** Make sure you created the tunnel with the exact name:
```powershell
.\cloudflared.exe tunnel list
```

### "connection refused"
**Solution:** Make sure your app is running:
```powershell
docker-compose ps
```

### "invalid tunnel configuration"
**Solution:** Check your YAML syntax. Make sure:
- Indentation uses spaces (not tabs)
- Tunnel ID matches exactly
- File is saved as `cloudflared-config.yml`

### Tunnel connects but page won't load
**Solution:** Check if port 80 is correct:
```powershell
docker-compose ps
# Check which port your app uses
```

---

## 📊 Commands Reference

```powershell
# Login
.\cloudflared.exe tunnel login

# Create tunnel
.\cloudflared.exe tunnel create my-app

# List tunnels
.\cloudflared.exe tunnel list

# Run tunnel
.\cloudflared.exe tunnel --config cloudflared-config.yml run my-app

# Delete tunnel (if needed)
.\cloudflared.exe tunnel delete my-app

# Get tunnel info
.\cloudflared.exe tunnel info my-app
```

---

## 🔒 Security Best Practices

Before sharing publicly:

1. **Change admin API key** in `.env`
2. **Remove test API keys** from database
3. **Create user-specific API keys** in Admin panel
4. **Monitor logs:** `docker-compose logs -f`

---

## 📞 Need Help?

- **Full documentation:** `DOSTEP_ZEWNETRZNY.md` or `PUBLIC_ACCESS.md`
- **Quick reference:** `QUICK_REFERENCE.md`
- **Visual guide:** `VISUAL_GUIDE.md`
- **Cloudflare docs:** https://developers.cloudflare.com/cloudflare-one/

---

## ✅ You're Done!

You now have a permanent, shareable link to your application!

**Next steps:**
1. Test the link in a private browser window
2. Share with a colleague to verify
3. Enjoy hassle-free sharing! 🎉

---

**Last Updated:** November 7, 2025

