# Network Setup Guide - Arkuszownia SMB

## ⚡ QUICK SETUP (Use This!)

We've created a helper script to make Cloudflare Tunnel setup super easy:

```powershell
.\setup-tunnel.ps1
```

This interactive script will:
- ✅ Check your current configuration
- ✅ Guide you through getting the tunnel token
- ✅ Save the token to your .env file
- ✅ Start/stop the tunnel
- ✅ Show logs and test connectivity

**Just run the script and follow the menu!**

---

## Current Status

✅ **Local Network**: WORKING  
- Application accessible at: http://localhost:8080
- All services running and healthy

⚠️ **Public Network (Cloudflare Tunnel)**: NOT CONFIGURED  
- Tunnel token is empty
- Service stopped to prevent error spam

---

## Network Architecture

### Option 1: Local Network Only (Current - Working ✅)

```
Your Browser
     ↓
http://localhost:8080
     ↓
┌─────────────────┐
│  Nginx (8080)   │
│  ├─ Frontend    │
│  └─ /api → API  │
└─────────────────┘
```

**Who can access**: Only you, on this computer  
**Security**: Maximum (not exposed to internet)  
**Setup**: Complete and working

---

### Option 2: Public Network with Cloudflare Tunnel

```
Anyone on Internet
     ↓
https://arkuszowniasmb.pl
     ↓
[Cloudflare Network]
     ↓
[Cloudflare Tunnel]
     ↓
http://localhost:8080
     ↓
┌─────────────────┐
│  Nginx (8080)   │
│  ├─ Frontend    │
│  └─ /api → API  │
└─────────────────┘
```

**Who can access**: Anyone with the domain name  
**Security**: Protected by Cloudflare + your API keys  
**Setup**: Requires configuration (see below)

---

## How to Enable Public Access (Cloudflare Tunnel)

### Prerequisites
- Domain name: `arkuszowniasmb.pl` (you have this ✅)
- Cloudflare account (free)
- Domain DNS pointed to Cloudflare

### Step 1: Create Cloudflare Tunnel

1. **Go to Cloudflare Dashboard**  
   Visit: https://one.dash.cloudflare.com/

2. **Navigate to Zero Trust**  
   - Click on your account
   - Select "Zero Trust" from the sidebar

3. **Create a Tunnel**  
   - Go to "Access" → "Tunnels"
   - Click "Create a tunnel"
   - Name it: `arkuszowniasmb` (or any name)
   - Click "Save tunnel"

4. **Get the Tunnel Token**  
   After creation, you'll see a token that looks like:
   ```
   eyJhIjoiNzk4M2E3ZjVkYzJjN2VjMTBiNWQ5ZjUwODRlMDNmY2UiLCJ0IjoiOTMyMDIxMmUtZjM3OS00MjYxLTg3NzctZjk2MjM4MjNiZWVlIiwicyI6IlpEWTVObVUwWVRVdFpURTBNaTAwTmpRd0xXRmhOV1F0WkRnNU1qQXlZVFF6TXpaaIn0=
   ```
   
   **Copy this entire token!**

5. **Configure Public Hostname**  
   In the tunnel settings:
   - Public hostname: `arkuszowniasmb.pl`
   - Service: `http://nginx:80`
   - Add another:
     - Public hostname: `www.arkuszowniasmb.pl`
     - Service: `http://nginx:80`

### Step 2: Add Token to Your Application

1. **Edit the .env file**  
   ```powershell
   notepad C:\Users\lukas\PyCharmMiscProject\.env
   ```

2. **Paste your token**  
   Replace this line:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=
   ```
   
   With:
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=your-actual-token-from-cloudflare
   ```

3. **Save and close**

### Step 3: Start Cloudflare Tunnel

```powershell
cd C:\Users\lukas\PyCharmMiscProject
docker-compose --profile production up -d
```

### Step 4: Verify It Works

```powershell
# Check tunnel status
docker-compose logs cloudflared --tail 20

# You should see:
# "Connection established" or "Registered tunnel connection"
```

Then open: https://arkuszowniasmb.pl

---

## DNS Configuration (Already Done?)

Your domain `arkuszowniasmb.pl` should have these DNS records in Cloudflare:

```
Type    Name    Content
────────────────────────────────────────────────────
CNAME   @       9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com
CNAME   www     9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com
```

**Check your DNS**: https://www.whatsmydns.net/#CNAME/arkuszowniasmb.pl

---

## Current Error Analysis

### The Error You're Seeing

```
ERR failed to serve tunnel connection 
error="control stream encountered a failure while serving"
```

**Root Cause**: The tunnel is trying to authenticate with Cloudflare but fails because:
1. ❌ No tunnel token in .env file
2. ❌ Looking for cert.json file that doesn't exist
3. ❌ Control stream can't establish without proper authentication

**Solution**: Add the tunnel token to .env (see Step 2 above)

---

## Troubleshooting

### Issue: "Tunnel token is empty"
**Solution**: Follow Step 1-2 above to get and add the token

### Issue: "Cannot find cert.json"
**Solution**: When using TUNNEL_TOKEN, you don't need cert.json. The error can be ignored if token is set.

### Issue: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution**: 
1. Check DNS records in Cloudflare
2. Wait 5-10 minutes for DNS propagation
3. Clear browser DNS cache: `ipconfig /flushdns`

### Issue: "Tunnel connects but site doesn't load"
**Solution**:
1. Check nginx is running: `docker-compose ps`
2. Check nginx logs: `docker-compose logs nginx`
3. Verify nginx can reach backend: `docker-compose exec nginx wget -O- http://backend:8000/healthz`

### Issue: "Connection established but 502 Bad Gateway"
**Solution**: Nginx can't reach backend
```powershell
docker-compose restart nginx
docker-compose restart backend
```

---

## Security Checklist (Before Going Public)

Before enabling public access, make sure to:

- [ ] Change API_KEYS in .env (currently: `dev-key-change-in-production`)
- [ ] Change ADMIN_KEY in .env (currently: `admin-change-in-production`)
- [ ] Enable Cloudflare WAF (Web Application Firewall)
- [ ] Set up rate limiting in Cloudflare
- [ ] Review CORS_ORIGINS in .env
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerts

---

## Quick Commands

```powershell
# Check if local app is working
.\manage.ps1 test

# Start cloudflare tunnel (after adding token)
docker-compose --profile production up -d

# Check tunnel logs
docker-compose logs cloudflared -f

# Stop tunnel
docker-compose stop cloudflared

# Restart everything
docker-compose restart

# Check what's running
docker-compose ps
```

---

## Recommended: Keep Local-Only for Now

**For development and testing**, I recommend keeping it local-only:

✅ **Advantages**:
- Maximum security
- No internet exposure
- Free (no bandwidth costs)
- Faster (no latency)
- No DNS/SSL configuration needed

❌ **Disadvantages**:
- Only accessible from your computer
- Can't share with team/clients remotely

**When to go public**:
- Ready for production
- Need to share with remote team
- Need to access from different locations
- Have proper security measures in place

---

## Testing Local Network

Your local network is working perfectly. Test it:

```powershell
# Full health check
.\manage.ps1 test

# Expected output:
# [1/3] Frontend... OK
# [2/3] API health... OK
# [3/3] API endpoint... OK
# All tests passed!

# Open in browser
start http://localhost:8080
```

---

## Summary

**Current Status**:
- ✅ Local network: WORKING
- ⚠️ Public network: NOT CONFIGURED (by design, needs token)

**To enable public access**:
1. Get Cloudflare Tunnel token
2. Add to .env file
3. Run: `docker-compose --profile production up -d`
4. Verify DNS is configured
5. Test: https://arkuszowniasmb.pl

**Recommended action**:
Keep using locally for now. Enable public access when you're ready for production and have:
- Changed security keys
- Set up backups
- Reviewed security settings
- Tested thoroughly locally

---

**Need help?** Check the other documentation files:
- `README.md` - Complete documentation
- `QUICKSTART.md` - Getting started guide
- `STATUS.md` - Current system status

