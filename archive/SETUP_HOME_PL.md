# Network Access Setup via home.pl

## Overview
This guide configures **arkuszowniasmb.pl** for external access through your home.pl domain using DNS and router port forwarding.

---

## STEP 1: Find Your Home IP Address

Your router's public IP is what external users will connect to.

### Option A: Check home.pl Panel
1. Log in to https://home.pl
2. Go to **Pulpit** (Dashboard) 
3. Look for "**Główny adres serwera**" (Server main address) - this is your IP
4. Your IP should match what you see at websites like https://whatismyipaddress.com

### Option B: Command Line
```powershell
powershell -Command "Invoke-WebRequest -Uri 'https://api.ipify.org?format=json' | Select-Object -ExpandProperty Content | ConvertFrom-Json"
```

**Write down your IP address: `_______________`**

---

## STEP 2: DNS Configuration in home.pl

1. Log in to https://home.pl → **Domeny** (Domains)
2. Select **arkuszowniasmb.pl**
3. Go to **Zaawansowane** (Advanced) → **Rekordy DNS**

### Create DNS Records:

| Type | Nazwa (Name) | Wartość (Value) |
|------|--------------|-----------------|
| A    | arkuszowniasmb.pl | YOUR_PUBLIC_IP |
| A    | www.arkuszowniasmb.pl | YOUR_PUBLIC_IP |

**Or use CNAME:**
- Create **www** CNAME pointing to **arkuszowniasmb.pl**

### Enable DDNS (if your IP is dynamic):
- In home.pl panel: **Narzędzia** → **DDNS**
- Enable DDNS for **arkuszowniasmb.pl**
- This auto-updates your DNS records if your IP changes

**Wait 15-30 minutes for DNS to propagate globally.**

---

## STEP 3: Router Port Forwarding

Access your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)

### Create Port Forward Rules:

| External Port | Internal IP | Internal Port | Protocol |
|---------------|------------|--------------|----------|
| 80 | 192.168.X.X | 8088 | TCP |
| 443 | 192.168.X.X | 8088 | TCP (optional, for HTTPS) |

**Note:** Replace `192.168.X.X` with your computer's local IP (the Docker host)

To find your local IP:
```powershell
ipconfig
```
Look for "IPv4 Address" in your network adapter (e.g., `192.168.1.50`)

---

## STEP 4: Verify DNS Resolution

```powershell
nslookup arkuszowniasmb.pl
nslookup www.arkuszowniasmb.pl
```

Both should return your **public IP address**.

---

## STEP 5: Restart Docker & Test

```powershell
cd C:\Users\lukas\PyCharmMiscProject

# Restart all services
docker-compose restart

# Wait 10 seconds for services to be ready
Start-Sleep -Seconds 10

# Test internal access first (should work immediately)
curl http://localhost:8088

# Test external access (after DNS propagates)
curl http://arkuszowniasmb.pl
```

---

## STEP 6: Access Your Application

### From Home Network:
- Frontend: `http://arkuszowniasmb.pl`
- API Docs: `http://arkuszowniasmb.pl/docs`
- Backend Direct: `http://localhost:8000` (internal only)

### From Internet (after DNS propagates):
- Frontend: `http://arkuszowniasmb.pl`
- API Docs: `http://arkuszowniasmb.pl/docs`

### Admin Login:
- **Email:** admin@arkuszowniasmb.pl
- **Password:** SMB#Admin2025!

---

## Optional: Add HTTPS (SSL Certificate)

For production security, enable HTTPS using Let's Encrypt:

```powershell
# Install certbot locally or use Docker
docker run -it --rm --name certbot \
  -v C:\Users\lukas\PyCharmMiscProject\ssl:/etc/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  -d arkuszowniasmb.pl \
  -d www.arkuszowniasmb.pl
```

Then update `nginx.conf` to use SSL certificates (requires nginx restart).

---

## Troubleshooting

### DNS not resolving?
```powershell
# Clear DNS cache
ipconfig /flushdns

# Test DNS again
nslookup arkuszowniasmb.pl
```

### Can't reach from internet?
1. Verify port forwarding in router is active
2. Check firewall allows ports 80/443 on your computer
3. Test with: `telnet arkuszowniasmb.pl 80`
4. Check Docker containers are running: `docker ps`

### API calls timing out?
- Check .env VITE_API_BASE is set to `http://arkuszowniasmb.pl`
- Verify nginx proxy settings in `nginx.conf`
- Check backend is healthy: `docker logs smb_backend`

### Still having issues?
```powershell
# View full logs
docker-compose logs -f

# Restart everything
docker-compose down
docker-compose up -d
```

---

## Configuration Summary

✅ **Updated Files:**
- ✅ `nginx.conf` - Now listening for arkuszowniasmb.pl
- ✅ `.env` - CORS and API base URL configured
- ✅ Docker containers - All running and healthy

✅ **Network Setup Required:**
- [ ] DNS records created in home.pl
- [ ] DDNS enabled in home.pl (if dynamic IP)
- [ ] Router port forwarding configured (80→8088)
- [ ] DNS propagated & verified
- [ ] External access tested

---

**Questions or issues?** Check the logs:
```powershell
docker-compose logs smb_nginx   # Nginx access logs
docker-compose logs smb_backend # API logs
docker-compose logs smb_db      # Database logs
```
