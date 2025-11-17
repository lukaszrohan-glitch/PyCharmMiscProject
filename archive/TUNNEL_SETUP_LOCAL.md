# Local Cloudflare Tunnel Setup (Windows)

## Overview

This guide sets up a Cloudflare Tunnel locally on your Windows machine to expose your local application publicly without requiring a remote server.

## Prerequisites

- Cloudflare account with tunnel creation permissions
- `cloudflared.exe` (included in project root)
- Docker application running locally
- Network access to internet

## Step 1: Create Tunnel in Cloudflare Dashboard

### Log in to Cloudflare

1. Go to https://one.dash.cloudflare.com/
2. Sign in with your Cloudflare account

### Create New Tunnel

1. Navigate to **Access** → **Tunnels**
2. Click **Create a tunnel**
3. Choose name: `arkuszownia-local` or similar
4. Click **Save tunnel**
5. **Copy your tunnel token** (looks like: `eyJ...`)

## Step 2: Configure Local Tunnel

### Using PowerShell Script

Run the automated setup:

```powershell
.\setup-cloudflared-local.ps1 -TunnelToken "your-tunnel-token-here"
```

### Manual Setup

1. Create configuration file `cloudflared-config-local.yml`:

```yaml
tunnel: arkuszownia-local
credentials-file: C:\Users\lukas\PyCharmMiscProject\.cloudflared\cert.json

ingress:
  - hostname: arkuszowniasmb.pl
    service: http://localhost:8088
  - hostname: www.arkuszowniasmb.pl
    service: http://localhost:8088
  - hostname: api.arkuszowniasmb.pl
    service: http://localhost:8088
  - hostname: arkuszowniasmb.pl:8088
    service: http://localhost:8088
  - hostname: localhost:8088
    service: http://localhost:8088
  - service: http_status:404
```

2. Install as Windows Service:

```powershell
# Run as Administrator
cloudflared.exe service install --token "your-token-here"
cloudflared.exe service start
```

## Step 3: Connect Tunnel Routes

### In Cloudflare Dashboard

1. Go back to **Access** → **Tunnels**
2. Select your tunnel
3. Go to **Public Hostnames** tab
4. Add routes for your domains:

| Subdomain | Domain | Type | URL |
|-----------|--------|------|-----|
| (none) | arkuszowniasmb.pl | HTTPS | localhost:8088 |
| www | arkuszowniasmb.pl | HTTPS | localhost:8088 |
| api | arkuszowniasmb.pl | HTTPS | localhost:8088 |

5. Click **Save** for each route

## Step 4: Update DNS

### Point domains to Cloudflare

1. Update DNS nameservers with your domain registrar to Cloudflare nameservers
2. Or create CNAME records:

```
arkuszowniasmb.pl CNAME arkuszownia-local.cfargotunnel.com
www.arkuszowniasmb.pl CNAME arkuszownia-local.cfargotunnel.com
api.arkuszowniasmb.pl CNAME arkuszownia-local.cfargotunnel.com
```

## Step 5: Verify Connection

### Check Tunnel Status

```powershell
# View tunnel service status
Get-Service cloudflared | Select-Object Status, StartType

# View tunnel logs
cloudflared.exe tunnel run --token "your-token-here"

# Test connectivity
Invoke-WebRequest -Uri "https://arkuszowniasmb.pl/api/healthz" -UseBasicParsing
```

### Test Public Access

1. Open https://arkuszowniasmb.pl in browser
2. Should show your local application
3. Test API: https://arkuszowniasmb.pl/api/products (with API key)

## Service Management

### Start Tunnel Service

```powershell
# Start service
Start-Service cloudflared

# Or via command line
cloudflared.exe service start
```

### Stop Tunnel Service

```powershell
# Stop service
Stop-Service cloudflared

# Or via command line
cloudflared.exe service stop
```

### View Logs

```powershell
# View tunnel logs (while running)
cloudflared.exe tunnel run --token "your-token-here" -l debug

# View Windows Event Viewer logs
Get-EventLog -LogName Application -Source cloudflared -Newest 20
```

### Restart Tunnel

```powershell
Restart-Service cloudflared
```

## Troubleshooting

### Service won't start

**Error**: "Service 'cloudflared' failed to start"

**Solution**:
```powershell
# Run as Administrator and reinstall
cloudflared.exe service uninstall
cloudflared.exe service install --token "your-token-here"
cloudflared.exe service start
```

### Connection times out

**Error**: "Connection refused" or "Timeout"

**Solution**:
1. Verify Docker is running: `docker ps`
2. Check nginx is accessible: `curl http://localhost:8088`
3. Verify firewall isn't blocking port 8088

### Certificate errors

**Error**: "SSL_ERROR_BAD_CERT_DOMAIN"

**Solution**:
1. Verify DNS is properly configured
2. Wait 24-48 hours for DNS propagation
3. Check Cloudflare dashboard for CNAME records

### Tunnel shows disconnected

**Error**: "Tunnel is not currently connected"

**Solution**:
1. Check internet connection
2. Verify tunnel token is correct
3. Check firewall/antivirus blocking cloudflared
4. Restart service: `Restart-Service cloudflared`

## Performance Tuning

### Increase connection pool

```yaml
# In cloudflared-config-local.yml
tunnel: arkuszownia-local
protocol: quic  # or http2

# Connection tuning
max-updates-per-second: 50
grace-period: 15s
```

### Enable compression

```yaml
ingress:
  - hostname: arkuszowniasmb.pl
    service: http://localhost:8088
    originRequest:
      connectTimeout: 10s
      tlsTimeout: 10s
      tcpKeepAlive: 30s
      noHappyEyeballs: false
```

## Security Considerations

### Protect Tunnel Token

- **Never commit token to git**: It's in .env which is git-ignored ✓
- **Restrict access**: Use Cloudflare Access policies for additional security
- **Rotate regularly**: Recreate tunnel if compromised
- **Monitor usage**: Check Cloudflare Analytics dashboard regularly

### Configure Zero Trust

1. Go to **Access** → **Applications**
2. Create application for your domain
3. Set authentication policy:
   - Allow specific emails: admin@arkuszowniasmb.pl
   - Or require Cloudflare login
   - Or use SAML/OAuth

### Example Access Policy

```
Allow
  Email
  is
  admin@arkuszowniasmb.pl
```

## Monitoring

### View Tunnel Analytics

1. **Cloudflare Dashboard** → **Analytics** → **Tunnels**
2. Monitor:
   - Requests per minute
   - Bandwidth usage
   - Connection status
   - Error rates

### Set Up Alerts

1. In Cloudflare, go to **Notifications**
2. Create alert for:
   - Tunnel offline
   - High bandwidth usage
   - Many errors

## Advanced: Multiple Tunnels

Run multiple tunnels for different applications:

```powershell
# Create second tunnel
$token2 = "eyJ..." # Different token

# Run alongside existing
cloudflared.exe tunnel run --token $token2
```

## Comparison: Remote vs Local Tunnel

| Feature | Remote (home.pl) | Local (Windows) |
|---------|------------------|-----------------|
| Requires SSH | Yes | No |
| Setup complexity | High | Medium |
| Network overhead | Lower | Higher |
| Requires Windows service | No | Yes |
| Resilience | External server | Depends on local PC |
| Cost | Hosting cost | Free |
| Uptime dependency | Remote host | Local PC always on |

## Next Steps

1. **Test thoroughly**: Verify public access works
2. **Set up monitoring**: Monitor tunnel connectivity
3. **Configure backups**: Backup .env with tunnel token
4. **Document token**: Keep token in secure location
5. **Test failover**: Ensure service restarts on reboot

## References

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)
- [Windows Service Management](https://learn.microsoft.com/en-us/windows/win32/services/services)
