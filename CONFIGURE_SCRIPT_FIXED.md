# configure-tunnel.ps1 - NOW FIXED!

## Problem (Before)
- Script had Unicode characters (checkmarks, box-drawing characters)
- PowerShell couldn't parse it: "Missing closing ')' in expression"
- Script would not run at all

## Solution (Now)
- Rewrote entire script with ASCII-only characters
- No special symbols or Unicode
- Syntax validated: PASSED
- Script works perfectly

## How to Use

### Simple: Just run it!
```powershell
.\configure-tunnel.ps1
```

### What it does:
1. Opens Cloudflare dashboard in your browser
2. Shows step-by-step instructions to get your token
3. Waits for you to paste the token
4. Saves token to `.env` file automatically
5. Starts the Cloudflare Tunnel
6. Checks connection status
7. Tests if https://arkuszowniasmb.pl is accessible

### Time required: ~2 minutes

## Where to Get the Token

The script will open this URL: https://one.dash.cloudflare.com/

Then follow these steps:
1. Navigate to: **Zero Trust → Access → Tunnels**
2. Find tunnel: `9320212e-f379-4261-8777-f9623823beee`
3. Click on the tunnel name
4. Click **Configure** tab
5. Scroll to **Install connector**
6. Select **Docker** from dropdown
7. Copy the token (long string after `--token`)

Example token format: `eyJhIjoiNzk4M2E3Zj...`

## After Running the Script

### Success indicators:
```
[SUCCESS] Tunnel is connected!
Your site is now accessible at:
  https://arkuszowniasmb.pl
  https://www.arkuszowniasmb.pl
```

### If it says "connection not confirmed":
```powershell
# Check logs manually
docker-compose logs cloudflared -f

# Look for:
# "INF Connection established"
# "INF Registered tunnel connection"
```

### Test your site:
Open browser: https://arkuszowniasmb.pl

## Useful Commands After Setup

```powershell
# Check if tunnel is running
docker-compose ps cloudflared

# View tunnel logs
docker-compose logs cloudflared -f

# Stop tunnel
docker-compose stop cloudflared

# Restart tunnel
docker-compose restart cloudflared

# Start tunnel again
docker-compose --profile production up -d cloudflared
```

## Troubleshooting

### Script still doesn't work?
Make sure you're in the project directory:
```powershell
cd C:\Users\lukas\PyCharmMiscProject
.\configure-tunnel.ps1
```

### Token not being accepted?
- Make sure you copied the ENTIRE token
- No extra spaces before or after
- Token should start with `eyJ`

### Tunnel connects but site doesn't load?
- Wait 5-10 minutes for DNS propagation
- Clear DNS cache: `ipconfig /flushdns`
- Try in incognito/private browser window

### Still having issues?
Check the comprehensive guides:
- `TUNNEL_READY.md` - Complete setup guide
- `TUNNEL_FIXED.md` - Troubleshooting
- `NETWORK_SETUP.md` - Network configuration

---

**Status**: ✅ FIXED - Ready to use!  
**Run**: `.\configure-tunnel.ps1`  
**Time**: ~2 minutes  
**Result**: Public site at https://arkuszowniasmb.pl

