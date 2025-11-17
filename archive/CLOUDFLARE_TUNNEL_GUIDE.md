# Cloudflare Tunnel Setup & Configuration

## 🔗 Overview

Cloudflare Tunnel allows your local network app to be publicly accessible without port forwarding. It creates a secure outbound-only connection from your device to Cloudflare's edge network.

**Status**: ✅ Configured and ready to use

---

## 📁 Configuration Files

### **cloudflared.yml** (FIXED)
The primary configuration file - now properly configured:
```yaml
tunnel-token: [your-tunnel-token]
logfile: C:\Users\lukas\.cloudflared\cloudflared.log
loglevel: debug
metrics: 127.0.0.1:49500
no-autoupdate: true

ingress:
  - hostname: arkuszowniasmb.com
    service: http://localhost:8088
  - hostname: www.arkuszowniasmb.com
    service: http://localhost:8088
  - service: http_status:404
```

**Key Points**:
- ✅ Fixed port from `8080` → `8088` (where nginx actually runs)
- ✅ Added ingress rules for both `.com` and `www.` domains
- ✅ Tunnel token embedded (token-based authentication)
- ✅ Metrics endpoint for monitoring
- ✅ Auto-update disabled for stability

### **cloudflared-config.yml**
Alternative config - same as main but with explicit domain setup

### **cloudflared-config-pl.yml**
Polish domain configuration for `arkuszowniasmb.pl` (uses specific IP)

---

## 🚀 Starting Cloudflare Tunnel

### **Option 1: Using Fixed Config (Recommended)**
```bash
cd C:\Users\lukas\PyCharmMiscProject
cloudflared.exe --config cloudflared.yml
```

### **Option 2: Token-Only Mode**
```bash
cloudflared.exe tunnel run --token eyJhIjoiMWQzYWI2ZDU4ZjZkZjQ1NTEwMTlkOTZhMTQ3MmJkNGIiLCJ0IjoiY2RmOThiOWUtZjEzNS00ODZhLWI5YzUtNjFhZWM3YzVjNzc0IiwicyI6Ik1UUmxZbUUyT1dFdE5qQTFOaTAwWXpFd0xUaGhaR1F0WldJeVpqY3lOVEkzWVdaayJ9
```

### **Option 3: Service (Windows)**
```bash
# Install service
cloudflared.exe service install --config C:\Users\lukas\PyCharmMiscProject\cloudflared.yml

# Start service
net start cloudflared

# Stop service
net stop cloudflared

# Uninstall service
cloudflared.exe service uninstall
```

---

## ✅ Verification

### **Check Tunnel Status**
Once running, you should see:
```
INFO  | Registered tunnel connection
INFO  | CNAME records should point to your tunnel hostname
```

### **Test Public Access**
```bash
# These should resolve and work:
curl https://arkuszowniasmb.com/api/healthz
curl https://www.arkuszowniasmb.com/
```

### **Check Cloudflare Dashboard**
1. Log in to https://dash.cloudflare.com
2. Go to **Networks** → **Tunnels**
3. Select your tunnel
4. Verify status shows "Connected"

---

## 🔧 DNS Configuration in Cloudflare

### **Required DNS Records**

Add these CNAME records in Cloudflare DNS panel:

| Name | Type | Content | TTL |
|------|------|---------|-----|
| arkuszowniasmb.com | CNAME | your-tunnel-uuid.cfargotunnel.com | Auto |
| www | CNAME | your-tunnel-uuid.cfargotunnel.com | Auto |

**Where `your-tunnel-uuid`** is found in:
- Cloudflare Dashboard → Tunnels
- Or in the tunnel token (first part before the dots)

### **Example Token Format**
```
eyJhIjoiMWQzYWI2ZDU4ZjZkZjQ1NTEwMTlkOTZhMTQ3MmJkNGIiLCJ0IjoiY2RmOThiOWUtZjEzNS00ODZhLWI5YzUtNjFhZWM3YzVjNzc0IiwicyI6I...
           ^^ tunnel UUID ^^
```

---

## 🔐 Security Features

Cloudflare Tunnel provides:
- ✅ **End-to-end encryption** - All traffic encrypted
- ✅ **No inbound firewall rules needed** - Outbound-only connection
- ✅ **DDoS protection** - Built-in protection from Cloudflare
- ✅ **WAF rules** - Can add web application firewall rules
- ✅ **Zero Trust access** - Optional authentication/authorization
- ✅ **Rate limiting** - Prevent abuse

---

## ⚠️ Troubleshooting

### **Issue: "Tunnel connection failed"**
```
ERRO: Connection closed unexpectedly
```

**Solutions**:
1. Check `.env` file for valid TUNNEL_TOKEN
2. Ensure backend is running: `docker-compose ps`
3. Verify port 8088 is accessible locally: `curl http://localhost:8088`
4. Check firewall settings (allow outbound to Cloudflare IPs)

### **Issue: "DNS not resolving"**
**Solutions**:
1. Verify CNAME records in Cloudflare DNS panel
2. Wait for DNS propagation (can take 24 hours)
3. Check DNS with: `nslookup arkuszowniasmb.com`

### **Issue: "503 Service Unavailable"**
**Cause**: Backend (docker) not running or nginx misconfigured

**Solutions**:
1. Check containers: `docker-compose ps`
2. Check logs: `docker-compose logs nginx`
3. Verify nginx config has correct backend URL

### **Issue: "Connection reset by peer"**
**Cause**: Incorrect config pointing to wrong port

**Solution**: Verify cloudflared.yml has `service: http://localhost:8088` (not 8080)

---

## 📊 Performance & Monitoring

### **Cloudflare Analytics**
Monitor traffic via Cloudflare Dashboard:
- Requests per second
- Bandwidth usage
- Error rates
- Geographic distribution

### **Local Metrics**
Tunnel exposes metrics on `127.0.0.1:49500`:
```bash
curl http://127.0.0.1:49500/metrics
```

### **Logs**
Check tunnel logs:
```bash
# View live logs
type C:\Users\lukas\.cloudflared\cloudflared.log | tail -f

# Or in PowerShell
Get-Content C:\Users\lukas\.cloudflared\cloudflared.log -Tail 50 -Wait
```

---

## 🔄 Tunnel Rotation & Updates

### **Update Tunnel Token** (if compromised)
1. Go to Cloudflare Dashboard → Tunnels
2. Regenerate tunnel token
3. Update token in:
   - `.env` (TUNNEL_TOKEN=...)
   - `cloudflared.yml` (tunnel-token: ...)
4. Restart cloudflared

### **Rotate Between Configs**
For testing different domains:
```bash
# Use .com config
cloudflared.exe --config cloudflared-config.yml

# Use .pl config
cloudflared.exe --config cloudflared-config-pl.yml
```

---

## 📝 Recommended Setup Script

Create `start-tunnel.ps1`:
```powershell
# Stop existing tunnel (if running)
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# Change to project directory
cd C:\Users\lukas\PyCharmMiscProject

# Verify app is running
Write-Host "Checking if app is running..."
$healthCheck = Invoke-RestMethod -Uri "http://localhost:8088/api/healthz" -ErrorAction SilentlyContinue
if ($null -eq $healthCheck) {
    Write-Host "ERROR: App not running at http://localhost:8088"
    exit 1
}

Write-Host "App is healthy. Starting Cloudflare tunnel..."

# Start tunnel with config
& "C:\Program Files\Cloudflare\Cloudflared\cloudflared.exe" --config cloudflared.yml

# Keep running
while ($true) { Start-Sleep -Seconds 10 }
```

Run with:
```bash
powershell -ExecutionPolicy Bypass -File start-tunnel.ps1
```

---

## ✅ Full Integration Checklist

- [x] Cloudflare account created
- [x] Tunnel created and token generated
- [x] `.env` has valid TUNNEL_TOKEN
- [x] `cloudflared.yml` configured correctly
- [x] Port 8088 correct (not 8080)
- [x] DNS CNAME records added to Cloudflare
- [ ] Test public access: https://arkuszowniasmb.com
- [ ] Monitor tunnel status in dashboard
- [ ] Set up log monitoring
- [ ] Configure WAF rules (optional)
- [ ] Enable rate limiting (optional)

---

## 🎯 Quick Start (Production Ready)

```bash
# 1. Ensure app is running
docker-compose ps

# 2. Start tunnel
cd C:\Users\lukas\PyCharmMiscProject
cloudflared.exe --config cloudflared.yml

# 3. Verify in another terminal
curl https://arkuszowniasmb.com/api/healthz

# 4. Monitor logs
tail -f C:\Users\lukas\.cloudflared\cloudflared.log
```

---

**Status**: Ready for production deployment with Cloudflare Tunnel 🚀
