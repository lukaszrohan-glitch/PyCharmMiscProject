# SSH Connection Troubleshooting (home.pl)

## Current Issue

```
ssh: connect to host serwer2581752.home.pl port 22: Connection timed out
```

The home.pl server is not responding on SSH port 22.

## Diagnostic Steps

### Step 1: Verify Credentials

```powershell
# Format should be: username@domain.home.pl
$username = "serwer2581752"
$domain = "serwer2581752.home.pl"
Write-Host "Attempting SSH to: $username@$domain"
```

### Step 2: Test DNS Resolution

```powershell
# Check if domain resolves
nslookup serwer2581752.home.pl

# Expected output: Should show IP address
```

**Troubleshooting**:
- If DNS fails: Use home.pl control panel to verify domain status
- If DNS works but ping fails: Firewall may be blocking ICMP

### Step 3: Test Port Connectivity

```powershell
# Check if port 22 is open
Test-NetConnection -ComputerName serwer2581752.home.pl -Port 22

# Expected output: Should show "TcpTestSucceeded: True"
```

**Troubleshooting**:
- If connection fails: SSH service may be down or port is blocked
- If connection times out: Network/ISP may be blocking port 22

### Step 4: Check SSH Is Enabled

1. Log in to https://www.home.pl/
2. Navigate to **Konta** (Accounts)
3. Select your account
4. Go to **SSH/SFTP** section
5. Verify **SSH Access** is enabled
6. Note the port number (usually 22)

### Step 5: Verify SSH Service

```powershell
# Try SSH with verbose output
ssh -v serwer2581752@serwer2581752.home.pl "echo test" 2>&1 | Select-String -Pattern "auth|connect|timeout|error"

# Expected: Should show authentication prompts or key exchange
```

## Common Solutions

### 1. SSH Not Enabled

**Symptoms**:
- Port 22 refuses connection (connection refused)
- No response from remote server

**Solution**:
1. Go to home.pl control panel
2. Enable SSH/SFTP access
3. Wait 15-30 minutes for propagation
4. Try connecting again

### 2. ISP/Firewall Blocking Port 22

**Symptoms**:
- Connection times out (no response)
- Works from different network (office vs home)
- Other ports work but 22 doesn't

**Solution**:
- Use alternative SSH port if configured in home.pl
- Contact your ISP to unblock port 22
- Use VPN to bypass firewall
- Use SFTP instead: `sftp -P 22 username@domain.home.pl`

### 3. Wrong Username/Domain

**Symptoms**:
- Connection times out or refused

**Solution**:
```powershell
# Verify format
$username = "serwer2581752"  # Usually same as hosting folder
$domain = "serwer2581752.home.pl"

# Correct format
ssh "${username}@${domain}"
```

### 4. home.pl Server Down

**Symptoms**:
- Multiple timeout attempts
- Can't access website via HTTPS either

**Solution**:
1. Check home.pl status page
2. Try connecting to other services (HTTPS, FTP)
3. Contact home.pl support

### 5. Network Configuration

**Symptoms**:
- Can connect from one location but not another
- Intermittent connection drops

**Solution**:
```powershell
# Test from different network or VPN
# Increase SSH timeout
ssh -o ConnectTimeout=30 serwer2581752@serwer2581752.home.pl

# Use persistent connection
ssh -o ServerAliveInterval=60 serwer2581752@serwer2581752.home.pl
```

## Advanced Debugging

### Using Curl for HTTP Proxy (if SSH blocked)

```bash
# If port 22 is blocked but port 80/443 works
# Use SSH over HTTP proxy (requires server support)
curl -x http://serwer2581752.home.pl:8080 \
  -k "https://serwer2581752.home.pl/.well-known/ssh-proxy"
```

### SSH Key Authentication

If username/password fails:

```powershell
# Generate SSH key (if not existing)
ssh-keygen -t rsa -b 4096 -f $env:USERPROFILE\.ssh\id_rsa

# Add public key to home.pl
cat $env:USERPROFILE\.ssh\id_rsa.pub | ssh serwer2581752@serwer2581752.home.pl "cat >> ~/.ssh/authorized_keys"

# Connect with key
ssh -i $env:USERPROFILE\.ssh\id_rsa serwer2581752@serwer2581752.home.pl
```

### Check Network Trace

```powershell
# Capture network packets (requires admin)
netsh trace start capture=yes

# Try SSH connection
ssh serwer2581752@serwer2581752.home.pl

# Stop trace
netsh trace stop

# View logs in %TEMP%\
```

## Alternative: Use Local Tunnel Instead

If SSH issues persist, **local Cloudflare Tunnel is recommended**:

```powershell
# Use local tunnel (no SSH required)
.\setup-cloudflared-local.ps1 -TunnelToken "your-token"
```

Benefits:
- ✓ No SSH connection needed
- ✓ Runs on your Windows machine
- ✓ Automatic HTTPS from Cloudflare
- ✓ Better for dynamic IPs

See: `TUNNEL_SETUP_LOCAL.md`

## Home.pl Support

### Contact Information

- **Website**: https://www.home.pl/
- **Support**: https://pomoc.home.pl/
- **Live Chat**: Available in control panel
- **Phone**: +48 717-001-001

### Useful Documentation

- [home.pl SSH Setup](https://pomoc.home.pl/en/article/71-ssh-sftp-access)
- [home.pl Port Configuration](https://pomoc.home.pl/en/article/123-changing-port-for-ssh-sftp)

## Checklist

- [ ] Verified DNS resolution: `nslookup serwer2581752.home.pl`
- [ ] Tested port connectivity: `Test-NetConnection -Port 22`
- [ ] SSH enabled in home.pl control panel
- [ ] Correct username/domain format
- [ ] Tried from different network
- [ ] Contacted home.pl support if issue persists
- [ ] Decided to use local Cloudflare tunnel instead

## When to Abandon SSH Approach

Consider using local tunnel if:
- ✗ SSH is consistently timing out
- ✗ ISP blocks port 22
- ✗ home.pl doesn't support SSH
- ✗ Need more control over tunnel configuration
- ✗ Want better redundancy

**Recommendation**: Use local Cloudflare Tunnel for production deployments.
