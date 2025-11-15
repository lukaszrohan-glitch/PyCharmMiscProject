# Cloudflare Tunnel Troubleshooting - Error 1033/530

## Current Status

✅ **Tunnel Running**: cloudflared process is active (PID: 17060)  
✅ **Local Backend**: http://localhost:80 responds with 200 OK  
✅ **Docker Containers**: All healthy and running  
❌ **External Access**: https://arkuszowniasmb.pl returns Error 530

---

## Error 1033 / 530 Explanation

**Error 1033**: Argo Tunnel error - tunnel can't reach origin  
**Error 530**: Origin is unreachable

This typically means:
1. The tunnel is running but can't connect to the local service
2. DNS records are not correctly pointing to the tunnel
3. Tunnel configuration doesn't match Cloudflare dashboard settings

---

## Current Configuration

### Tunnel Details:
```yaml
Tunnel ID: 9320212e-f379-4261-8777-f9623823beee
Domain: arkuszowniasmb.pl
Origin: http://127.0.0.1:80
Status: Running
```

### Services Status:
- ✅ Nginx (Port 80): Running
- ✅ Backend (Port 8000): Healthy
- ✅ Frontend (Port 5173): Running
- ✅ Database: Healthy
- ✅ Cloudflared: Active

---

## Quick Fixes to Try

### 1. Verify DNS Configuration in Cloudflare Dashboard

**Go to Cloudflare Dashboard:**
1. Login to https://dash.cloudflare.com
2. Select domain: **arkuszowniasmb.pl**
3. Go to **DNS** tab
4. Check these records exist:

**Required DNS Records:**
```
Type: CNAME
Name: arkuszowniasmb.pl (or @)
Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com
Proxy: ON (orange cloud)

Type: CNAME
Name: www
Target: 9320212e-f379-4261-8777-f9623823beee.cfargotunnel.com
Proxy: ON (orange cloud)
```

**If these don't exist or are wrong, update them!**

### 2. Verify Tunnel Configuration in Cloudflare

**In Cloudflare Dashboard:**
1. Go to **Zero Trust** > **Networks** > **Tunnels**
2. Find tunnel: `9320212e-f379-4261-8777-f9623823beee`
3. Click **Configure**
4. Check **Public Hostname** settings:

**Should have:**
```
Hostname: arkuszowniasmb.pl
Service: http://127.0.0.1:80

Hostname: www.arkuszowniasmb.pl
Service: http://127.0.0.1:80
```

### 3. Test Local Origin Directly

```powershell
# From your PC, test if nginx responds
Invoke-WebRequest -Uri http://127.0.0.1:80 -UseBasicParsing

# Should return: StatusCode 200
```

### 4. Restart Tunnel with Fresh Connection

```cmd
# Stop tunnel
taskkill /IM cloudflared.exe /F

# Wait 10 seconds

# Start tunnel
cd C:\Users\lukas\PyCharmMiscProject
.\manage-tunnel.cmd
# Choose option 1
```

### 5. Check Tunnel Logs

```cmd
# View recent logs
cd C:\Users\lukas\PyCharmMiscProject
.\manage-tunnel.cmd
# Choose option 4
```

Look for errors like:
- "failed to connect to origin"
- "connection refused"
- "timeout"

---

## Alternative: Use Cloudflare Tunnel via Dashboard

If local config isn't working, configure it entirely through Cloudflare Dashboard:

### Step 1: Delete Current Local Config
```powershell
cd C:\Users\lukas\PyCharmMiscProject
Stop-Process -Name cloudflared -Force
```

### Step 2: Configure in Cloudflare Dashboard
1. Go to **Zero Trust** > **Networks** > **Tunnels**
2. Select your tunnel
3. Click **Configure**
4. Under **Public Hostname**, click **Add a public hostname**
5. Set:
   - **Subdomain**: (leave empty or @ for root)
   - **Domain**: arkuszowniasmb.pl
   - **Service Type**: HTTP
   - **URL**: 127.0.0.1:80
6. Save

### Step 3: Run Tunnel
```cmd
cd C:\Users\lukas\PyCharmMiscProject
.\cloudflared.exe tunnel run 9320212e-f379-4261-8777-f9623823beee
```

---

## Common Issues & Solutions

### Issue 1: "Port 80 already in use"
**Solution**: Docker is already using port 80 (nginx). This is correct! The tunnel should connect to it.

### Issue 2: "Connection refused"
**Solution**: 
- Check Windows Firewall allows localhost connections
- Try using `localhost` instead of `127.0.0.1` in config (or vice versa)

### Issue 3: "SSL/TLS errors"
**Solution**: Already set `noTLSVerify: true` in config. This is correct for HTTP origins.

### Issue 4: "DNS not propagating"
**Solution**: 
- Clear Cloudflare cache
- Wait 5-10 minutes for propagation
- Try accessing www.arkuszowniasmb.pl instead

### Issue 5: "Multiple cloudflared processes"
**Solution**: Kill all and start fresh:
```cmd
taskkill /IM cloudflared.exe /F
timeout /t 5
.\manage-tunnel.cmd
```

---

## Test Checklist

Run these tests in order:

```powershell
# 1. Test local nginx
curl http://localhost:80
# Expected: HTML response

# 2. Test via 127.0.0.1
curl http://127.0.0.1:80
# Expected: HTML response

# 3. Check tunnel is running
Get-Process cloudflared
# Expected: Process found

# 4. Check DNS resolution
nslookup arkuszowniasmb.pl
# Expected: Should resolve to Cloudflare IPs (e.g., 104.x.x.x)

# 5. Test from external network (phone, different network)
# Open: https://arkuszowniasmb.pl
# Expected: Login page
```

---

## Manual Workaround: ngrok

If Cloudflare tunnel continues to have issues, you can temporarily use ngrok:

```powershell
# Install ngrok: https://ngrok.com/download

# Run ngrok
ngrok http 80

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Share that URL for testing
```

---

## Current Files

### manage-tunnel.cmd
Interactive script to manage the tunnel:
- Start tunnel
- Stop tunnel  
- Check status
- View logs

**Usage:**
```cmd
cd C:\Users\lukas\PyCharmMiscProject
.\manage-tunnel.cmd
```

### cloudflared-config-pl.yml
Tunnel configuration file (updated):
```yaml
tunnel: 9320212e-f379-4261-8777-f9623823beee
credentials-file: C:\Users\lukas\.cloudflared\9320212e-f379-4261-8777-f9623823beee.json
originRequest:
  noTLSVerify: true
  connectTimeout: 30s
  tcpKeepAlive: 30s

ingress:
  - hostname: arkuszowniasmb.pl
    service: http://127.0.0.1:80
  - hostname: www.arkuszowniasmb.pl
    service: http://127.0.0.1:80
  - service: http_status:404
```

---

## Next Steps

1. **Check Cloudflare Dashboard** - Verify DNS and tunnel config
2. **Restart Tunnel** - Use manage-tunnel.cmd
3. **Test from Phone** - Use mobile data (different network)
4. **Check Logs** - Look for specific errors
5. **Contact Cloudflare Support** - If issue persists

---

## Support Information

**Tunnel ID**: `9320212e-f379-4261-8777-f9623823beee`  
**Domain**: arkuszowniasmb.pl  
**Error**: 530 (Origin unreachable)  
**Local Origin**: Working (http://127.0.0.1:80 responds 200)  
**Tunnel Process**: Running  

**Most Likely Cause**: DNS records in Cloudflare dashboard not pointing to tunnel, OR tunnel hostname configuration doesn't match domain.

**Recommended Action**: Log into Cloudflare Dashboard and verify DNS + Tunnel configuration match exactly.

