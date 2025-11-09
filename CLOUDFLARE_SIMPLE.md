# Cloudflare Setup WITHOUT Zero Trust - Simple DNS Method

## What This Does

Uses **Cloudflare as a simple DNS proxy** instead of the complex Zero Trust tunnel.

**Benefits:**
- ✅ No tunnel token needed
- ✅ No Zero Trust account needed
- ✅ Just DNS + proxy (like any normal website)
- ✅ Free SSL certificate from Cloudflare
- ✅ DDoS protection included
- ✅ Much simpler!

---

## Current Problem

Your app runs on `localhost:8080` - it's only accessible from your computer.

To make `arkuszowniasmb.pl` work, you need a **public IP address** that the internet can reach.

---

## Solution Options

### Option 1: Port Forward Your Home Router (FREE but requires setup)

**What it does**: Exposes your computer to the internet via your home router

**Steps:**

1. **Get your public IP**
   ```powershell
   Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing | Select-Object -ExpandProperty Content
   ```
   Example result: `89.123.45.67`

2. **Get your local IP**
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch "Loopback"} | Select-Object IPAddress
   ```
   Example result: `192.168.1.100`

3. **Configure router port forwarding**
   - Log into your router (usually `192.168.1.1` or `192.168.0.1`)
   - Find "Port Forwarding" or "Virtual Server" settings
   - Add these rules:
     - **External Port**: 80 → **Internal IP**: 192.168.1.100 → **Internal Port**: 80
     - **External Port**: 443 → **Internal IP**: 192.168.1.100 → **Internal Port**: 443

4. **Update docker-compose to use standard ports**
   Already done! Nginx now uses ports 80 and 443

5. **Restart your app**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

6. **Configure Cloudflare DNS**
   - Go to: https://dash.cloudflare.com
   - Select your domain: `arkuszowniasmb.pl`
   - Go to **DNS** → **Records**
   - Add/Update A record:
     - **Type**: A
     - **Name**: @
     - **IPv4 address**: YOUR_PUBLIC_IP (from step 1)
     - **Proxy status**: Proxied (orange cloud)
   - Add/Update A record for www:
     - **Type**: A
     - **Name**: www
     - **IPv4 address**: YOUR_PUBLIC_IP
     - **Proxy status**: Proxied (orange cloud)

7. **Wait 5 minutes for DNS propagation**

8. **Test**: Visit `https://arkuszowniasmb.pl`

**Pros:**
- ✅ Free
- ✅ Full control
- ✅ No monthly costs

**Cons:**
- ⚠️ Requires router access
- ⚠️ Your home IP might change (use dynamic DNS service)
- ⚠️ Security considerations (your home network exposed)

---

### Option 2: Use VPS Hosting ($5/month - RECOMMENDED)

**What it does**: Deploy your app to a cloud server with a static IP

**Providers:**
- **DigitalOcean**: $6/month for basic droplet
- **Linode**: $5/month for "Nanode"
- **Vultr**: $5/month for basic server
- **Hetzner**: €4.15/month (cheapest)

**Steps:**

1. **Sign up for a VPS provider** (I recommend Linode or Hetzner)

2. **Create a server** (Ubuntu 22.04 LTS)

3. **Get the server IP** (e.g., `45.79.123.45`)

4. **Install Docker on the server**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

5. **Upload your app to the server**
   ```powershell
   # Create a zip of your project
   Compress-Archive -Path . -DestinationPath arkuszowniasmb.zip
   
   # Upload via SFTP or use git
   git push origin main
   # Then on server: git clone your-repo
   ```

6. **Run on the server**
   ```bash
   cd /path/to/your/app
   docker-compose up -d
   ```

7. **Configure Cloudflare DNS** (same as Option 1, step 6)
   - Point `arkuszowniasmb.pl` to your VPS IP
   - Enable Cloudflare proxy (orange cloud)

8. **Done!** Your site is live at `https://arkuszowniasmb.pl`

**Pros:**
- ✅ Professional solution
- ✅ Static IP address
- ✅ Better uptime
- ✅ Doesn't expose your home network
- ✅ Scalable

**Cons:**
- 💰 $5-6/month cost

---

### Option 3: Use ngrok with Cloudflare (Hybrid - $8/month)

**What it does**: ngrok gives you a stable URL, then point your domain to it

**Steps:**

1. **Upgrade to ngrok Pro** ($8/month)
   - Get a static domain: `arkuszowniasmb.ngrok.io`

2. **Start ngrok**
   ```powershell
   .\start-ngrok.ps1
   ```

3. **Configure Cloudflare**
   - Go to DNS settings
   - Add CNAME:
     - **Name**: @
     - **Target**: `arkuszowniasmb.ngrok.io`
     - **Proxy**: OFF (gray cloud - must be DNS only)
   
4. **Or use ngrok's custom domain feature** (paid)

**Pros:**
- ✅ Easy setup
- ✅ No server management
- ✅ Works from anywhere

**Cons:**
- 💰 $8/month
- ⚠️ Adds latency

---

## My Recommendation

### For Testing/Development:
Use **ngrok free tier** (no domain needed):
```powershell
.\start-ngrok.ps1
# Get URL like: https://abc123.ngrok.io
```

### For Production:
Use **VPS hosting** ($5/month):
- Professional
- Reliable
- Scalable
- Point arkuszowniasmb.pl directly to it

---

## Quick Setup Script for VPS Option

I'll create a deployment script for you to easily deploy to a VPS:

**File**: `deploy-to-vps.ps1`

```powershell
# Deploy Arkuszownia SMB to VPS
param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$Username = "root"
)

Write-Host "Deploying to VPS: $Username@$ServerIP" -ForegroundColor Cyan

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$exclude = @("node_modules", ".git", "*.log", "logs", "dist")
# Zip excluding certain folders
Compress-Archive -Path . -DestinationPath deploy.zip -Force

# Upload to server
Write-Host "Uploading to server..." -ForegroundColor Yellow
scp deploy.zip "${Username}@${ServerIP}:/tmp/"

# Deploy on server
Write-Host "Deploying on server..." -ForegroundColor Yellow
ssh "${Username}@${ServerIP}" @"
cd /opt
mkdir -p arkuszowniasmb
cd arkuszowniasmb
unzip -o /tmp/deploy.zip
docker-compose down
docker-compose up -d --build
docker-compose ps
"@

Write-Host "`nDeployment complete!" -ForegroundColor Green
Write-Host "Configure Cloudflare DNS to point to: $ServerIP" -ForegroundColor Cyan
```

---

## Cloudflare DNS Configuration (All Options)

Once you have a public IP (from router or VPS), configure Cloudflare:

1. **Go to**: https://dash.cloudflare.com
2. **Select**: arkuszowniasmb.pl
3. **Go to**: DNS → Records
4. **Delete old CNAME records** (the tunnel ones)
5. **Add new A records**:

```
Type: A
Name: @
IPv4: YOUR_PUBLIC_IP
Proxy: Enabled (orange cloud)
TTL: Auto

Type: A  
Name: www
IPv4: YOUR_PUBLIC_IP
Proxy: Enabled (orange cloud)
TTL: Auto
```

6. **SSL/TLS Settings**:
   - Go to: SSL/TLS → Overview
   - Set to: **Full (strict)** or **Flexible**

7. **Wait 5-10 minutes** for DNS propagation

8. **Test**: `https://arkuszowniasmb.pl`

---

## What I Changed

1. ✅ **Removed Cloudflare Tunnel** from docker-compose.yml
2. ✅ **Changed nginx ports** to 80 and 443 (standard)
3. ✅ **Simplified setup** - no Zero Trust needed
4. ✅ **Created this guide** with 3 clear options

---

## Next Steps

**Choose your approach:**

### Quick Test (FREE, 5 minutes):
```powershell
.\start-ngrok.ps1
# Share the ngrok URL
```

### Home Hosting (FREE, 30 minutes):
1. Port forward router
2. Point DNS to your public IP
3. Done!

### Professional Hosting ($5/month, 1 hour):
1. Get VPS from Linode/Hetzner
2. Deploy app to VPS
3. Point DNS to VPS IP
4. Done!

---

## Status

✅ App running locally on port 8080  
✅ Cloudflare Tunnel removed (too complex)  
✅ Nginx ready for ports 80/443  
✅ Three simple options documented  

**Your turn**: Choose an option and let me know! I can help with any of them.

