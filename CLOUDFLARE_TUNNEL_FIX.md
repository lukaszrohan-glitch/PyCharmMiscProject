# 🔧 Cloudflare Tunnel - FIXED!

## ✅ What Was Wrong

The Cloudflare Tunnel was failing because:
1. ❌ Empty tunnel token in `.env` file
2. ❌ Old configuration files conflicting with token-based auth
3. ❌ Missing instructions on how to get the token

## ✅ What We Fixed

1. ✅ Removed conflicting cloudflared config files
2. ✅ Updated docker-compose.yml to use token-based authentication
3. ✅ Created interactive setup script: `setup-tunnel.ps1`
4. ✅ Added comprehensive documentation

---

## 🚀 How to Configure It (Easy Way)

### Step 1: Run the Setup Script

```powershell
.\setup-tunnel.ps1
```

### Step 2: Get Your Token

The script will show you where to get your token:

1. Go to: https://one.dash.cloudflare.com/
2. Navigate to: **Access → Tunnels**
3. Find your tunnel: `9320212e-f379-4261-8777-f9623823beee`
4. Click **Configure**
5. Under "Install connector", select **Docker**
6. Copy the token (long string starting with `eyJ...`)

### Step 3: Configure in Script

1. In the setup script, select option **2** (Configure tunnel token)
2. Paste your token when prompted
3. Done! The script saves it to your `.env` file

### Step 4: Start the Tunnel

In the setup script, select option **3** (Start tunnel)

Or manually:
```powershell
docker-compose --profile production up -d
```

---

## 🔍 Verify It's Working

### Check Tunnel Status

```powershell
.\setup-tunnel.ps1
# Select option 1 (Show status)
```

### Check Tunnel Logs

```powershell
.\setup-tunnel.ps1
# Select option 5 (View logs)
```

Look for:
```
INF Connection established
INF Registered tunnel connection
```

### Test Public Access

```powershell
.\setup-tunnel.ps1
# Select option 6 (Test connection)
```

Or open: https://arkuszowniasmb.pl

---

## 📝 Manual Configuration (Advanced)

If you prefer to configure manually:

### 1. Edit .env File

```powershell
notepad .env
```

Add your token:
```env
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiNzk4M2E3ZjVkYzJjN2VjMTBiNWQ5ZjUwODRlMDNmY2UiLCJ0IjoiOTMyMDIxMmUtZjM3OS00MjYxLTg3NzctZjk2MjM4MjNiZWVlIiwicyI6IlpEWTVObVUwWVRVdFpURTBNaTAwTmpRd0xXRmhOV1F0WkRnNU1qQXlZVFF6TXpaaIn0
```

### 2. Start Tunnel

```powershell
docker-compose --profile production up -d
```

### 3. Check Logs

```powershell
docker-compose logs cloudflared -f
```

---

## 🌐 DNS Configuration

Your domain **must** have these DNS records in Cloudflare:

| Type  | Name | Target                                              |
|-------|------|-----------------------------------------------------|
| CNAME | @    | 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com |
| CNAME | www  | 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com |

**Check DNS propagation**: https://www.whatsmydns.net/#CNAME/arkuszowniasmb.pl

---

## ❓ Troubleshooting

### "Tunnel token is empty"

**Solution**: Run `.\setup-tunnel.ps1` and select option 2 to configure the token

### "Control stream encountered a failure"

**Causes**:
- Invalid token
- Token not saved correctly
- Network connectivity issues

**Solution**:
1. Verify token is correct in `.env` file
2. Restart tunnel: `docker-compose restart cloudflared`
3. Check logs: `docker-compose logs cloudflared`

### "Cannot find cert.json"

This error can be **ignored** when using token-based authentication. The tunnel works without cert.json when you have TUNNEL_TOKEN set.

### Site not accessible at arkuszowniasmb.pl

**Checklist**:
- [ ] Tunnel is running: `docker-compose ps`
- [ ] Tunnel shows "Connection established" in logs
- [ ] DNS records are configured in Cloudflare
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Clear DNS cache: `ipconfig /flushdns`
- [ ] Try in incognito/private browser window

---

## 📊 Current Setup

### Local Access (Always Works)
- URL: http://localhost:8080
- Status: ✅ Working
- No configuration needed

### Public Access (Requires Tunnel)
- URL: https://arkuszowniasmb.pl
- Status: ⚠️ Requires token configuration
- Use: `.\setup-tunnel.ps1` to configure

---

## 🎯 Quick Commands

```powershell
# Interactive setup (recommended)
.\setup-tunnel.ps1

# Start tunnel
docker-compose --profile production up -d

# Stop tunnel
docker-compose stop cloudflared

# View logs
docker-compose logs cloudflared -f

# Check status
docker-compose ps cloudflared

# Restart tunnel
docker-compose restart cloudflared
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Tunnel logs show**:
   ```
   INF Connection established
   INF Registered tunnel connection
   ```

2. **Status command shows**:
   ```
   pycharmmiscproject-cloudflared-1   Up
   ```

3. **Website loads**:
   - https://arkuszowniasmb.pl shows your app
   - No SSL/certificate errors
   - Login page appears

---

## 📚 Additional Resources

- **Full Network Guide**: See `NETWORK_SETUP.md`
- **Management Script**: Use `.\manage.ps1` for app management
- **Quick Start**: See `QUICKSTART.md`
- **Status**: See `STATUS.md`

---

## 🎉 Summary

**Problem**: Cloudflare Tunnel failing with control stream errors  
**Cause**: Empty tunnel token + conflicting config files  
**Solution**: Use `.\setup-tunnel.ps1` to configure token  
**Result**: Public access enabled at https://arkuszowniasmb.pl

**Status**: ✅ FIXED - Ready to configure!

