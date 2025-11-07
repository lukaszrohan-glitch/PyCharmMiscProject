# Network Access Guide 🌐

## ✅ Configuration Complete!

Your SMB Tool is now configured to work from **anywhere** - localhost, local network, or external networks!

---

## 🔗 Access URLs

### Local Access (on this machine):
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Local Network Access (from other devices on your network):
- **Frontend**: http://192.168.10.147:5173
- **Backend API**: http://192.168.10.147:8000
- **API Docs**: http://192.168.10.147:8000/docs

### Docker Internal Network:
- **Frontend**: http://172.18.0.4:5173
- **Backend**: http://172.18.0.2:8000

---

## 🚀 How It Works

The application now uses **dynamic API URL detection**:

1. When you access via `localhost:5173` → API calls go to `localhost:8000`
2. When you access via `192.168.10.147:5173` → API calls go to `192.168.10.147:8000`
3. When you access via any other IP/domain → API calls go to that same host on port 8000

**Key Changes Made:**
- ✅ Frontend dynamically detects the correct API URL based on `window.location`
- ✅ Backend CORS allows all origins (configurable via CORS_ORIGINS env var)
- ✅ No hardcoded `localhost` URLs anymore

---

## 🌍 Accessing from Outside Your Network

To access from the internet (outside your local network), you need to:

### Option 1: Port Forwarding (Router Configuration)
1. Log into your router's admin panel
2. Set up port forwarding:
   - **Port 5173** → Forward to `192.168.10.147:5173` (Frontend)
   - **Port 8000** → Forward to `192.168.10.147:8000` (Backend)
3. Find your public IP: https://whatismyipaddress.com
4. Access your app via: `http://YOUR_PUBLIC_IP:5173`

**Security Note**: This exposes your app to the internet. Consider:
- Setting strong API keys
- Using HTTPS (see Option 3)
- Restricting access by IP if possible

### Option 2: Ngrok (Quick & Easy)
1. Install ngrok: https://ngrok.com/download
2. Run these commands in separate terminals:
   ```bash
   ngrok http 5173  # For frontend
   ngrok http 8000  # For backend
   ```
3. Ngrok will give you public URLs like:
   - `https://abc123.ngrok.io` → Your frontend
   - `https://xyz789.ngrok.io` → Your backend
4. Update `.env` file:
   ```
   VITE_API_BASE=https://xyz789.ngrok.io/api
   ```
5. Restart frontend: `docker compose restart frontend`

### Option 3: Reverse Proxy with HTTPS (Production Setup)
Use Nginx or Caddy with Let's Encrypt SSL:
1. Get a domain name (e.g., from Namecheap, GoDaddy)
2. Point domain to your public IP
3. Set up Nginx reverse proxy with SSL
4. Configure firewall rules

---

## 🔧 Testing Network Access

### From Another Device on Your Network:
1. Make sure both devices are on the same WiFi/network
2. Open browser on other device
3. Go to: `http://192.168.10.147:5173`
4. The app should load and work perfectly!

### Troubleshooting:
If it doesn't work, check:
- ✅ Windows Firewall allows ports 5173 and 8000
- ✅ Docker containers are running: `docker compose ps`
- ✅ Your network allows device-to-device communication

---

## 🔥 Windows Firewall Configuration

If network access doesn't work, allow the ports:

```cmd
netsh advfirewall firewall add rule name="SMB Tool Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="SMB Tool Backend" dir=in action=allow protocol=TCP localport=8000
```

---

## 📱 Mobile Access

You can now access the app from your phone/tablet:
1. Connect phone to same WiFi network
2. Open browser on phone
3. Navigate to: `http://192.168.10.147:5173`
4. Add to home screen for quick access!

---

## ⚙️ Configuration Options

### Restricting CORS (for security):
Edit `.env` file:
```env
# Only allow specific origins
CORS_ORIGINS=http://192.168.10.147:5173,http://yourdomain.com
```

Then restart: `docker compose restart backend`

### Custom API Base URL:
If you need to override the auto-detection:
```env
VITE_API_BASE=http://your-custom-api-url.com/api
```

Then rebuild: `docker compose build frontend && docker compose up -d frontend`

---

## 🎯 Summary

**Before:**
- ❌ Only worked on `localhost`
- ❌ Network IP failed (blank page or API errors)
- ❌ Hardcoded URLs

**After:**
- ✅ Works on localhost: `http://localhost:5173`
- ✅ Works on network: `http://192.168.10.147:5173`
- ✅ Works on Docker IP: `http://172.18.0.4:5173`
- ✅ Can work externally with port forwarding/ngrok
- ✅ Dynamically adapts to any hostname/IP

---

## 🔐 Security Recommendations

For external access:
1. **Change default API keys** in `.env`:
   ```env
   API_KEYS=your-very-strong-random-key-here
   ADMIN_KEY=another-very-strong-admin-key
   ```

2. **Use HTTPS** (ngrok provides this automatically)

3. **Implement rate limiting** (add middleware in main.py)

4. **Monitor logs** for suspicious activity:
   ```bash
   docker compose logs -f backend | findstr "POST"
   ```

---

## ✅ Verification

Test all access methods:
- [ ] http://localhost:5173 - Works ✓
- [ ] http://192.168.10.147:5173 - Works ✓
- [ ] Check browser console for "API Base URL:" log
- [ ] Create an order to verify API communication
- [ ] Test from another device on network

**Status: Ready for Network & External Access!** 🎉

