# 🚀 How to Share Your App with Users (Simple Guide)

## For You (The Host)

### Step 1: One-Time Setup (10 minutes)

1. **Download Cloudflare Tunnel**
   - Go to: https://github.com/cloudflare/cloudflared/releases
   - Download `cloudflared-windows-amd64.exe`
   - Rename to `cloudflared.exe` and move to: `C:\Users\lukas\PyCharmMiscProject\`

2. **Create Free Cloudflare Account**
   - You'll do this in the next step when you login
   - No credit card required

3. **Login to Cloudflare**
   ```powershell
   cd C:\Users\lukas\PyCharmMiscProject
   .\cloudflared.exe tunnel login
   ```
   Browser will open - sign up or login to Cloudflare (free)

4. **Create Your Tunnel**
   ```powershell
   .\cloudflared.exe tunnel create my-app
   ```
   Save the **Tunnel ID** shown (long string)

5. **Create Config File**
   Create file `cloudflared-config.yml` in project folder:
   ```yaml
   tunnel: PASTE_YOUR_TUNNEL_ID_HERE
   credentials-file: C:\Users\lukas\.cloudflared\TUNNEL_ID.json
   
   ingress:
     - service: http://localhost:80
   ```

✅ **Done! You get a permanent link that never changes!**

---

### Step 2: Every Time You Want to Share

#### Option A: Double-Click Script (EASIEST)

1. Double-click `SHARE-PUBLIC.cmd` (English) or `UDOSTEPNIJ.cmd` (Polish)
2. Wait 30 seconds
3. Your permanent link is shown (e.g., `https://my-app.trycloudflare.com`)
4. Send it to your users!

#### Option B: Manual Commands

```powershell
# Start the app
docker-compose up -d

# Start Cloudflare Tunnel
cloudflared.exe tunnel --config cloudflared-config.yml run my-app

# Your permanent link is shown in the terminal
```

---

### Step 3: Send Link to Users

Send the link via:
- 📧 Email
- 💬 Slack/Teams/Chat
- 📱 SMS
- 📋 Copy-paste anywhere

**Example message:**
```
Hi! Here's the link to our management tool:
https://my-app.trycloudflare.com

Just click it and it will open in your browser.
No installation needed!

This link works permanently - bookmark it for easy access!
```

---

### Step 4: Keep It Running

- **Keep the terminal window open** while users are working
- When you're done, press `Ctrl+C` to stop
- **Next time you share, the link is THE SAME!** ✨

---

## For Your Users (What They Experience)

### Step 1: Click the Link
They receive a link like: `https://my-app.trycloudflare.com`

### Step 2: Use the App Immediately!
The app opens instantly! They can:
- Click **"Skip API key"** to browse read-only data
- Or enter an API key if you gave them one
- Work normally - create orders, log time, manage inventory

### That's It!
No downloads, no installations, no configuration, no welcome screens. Just works! ✨

---

## 📊 What Users Can Do

### Without API Key (Read-Only):
- ✅ View all orders
- ✅ View products and customers
- ✅ View financial data
- ✅ View inventory shortages
- ❌ Cannot create or modify anything

### With API Key (Full Access):
- ✅ Create new orders
- ✅ Add order lines
- ✅ Log work hours (timesheets)
- ✅ Record inventory transactions
- ✅ Everything!

---

## 🔑 How to Give Users API Keys

### Option 1: Use Built-in Key (Quick)

Your app comes with test keys already set up. You can share:
```
API Key: test-key-12345
```

⚠️ **Warning:** This is for testing only! Change it for production.

### Option 2: Create New Keys (Recommended)

1. Open the app yourself: `http://localhost:5173`
2. Click **"Admin"** tab
3. Enter admin key: `admin-master-key-12345`
4. Click **"Create New API Key"**
5. Give it a name (e.g., "John's Key")
6. Copy the key and send it to your user

---

## ⏰ How Long Does It Work?

### Cloudflare Tunnel (Free Forever):
- ✅ Works **as long as the tunnel is running**
- ✅ **Link NEVER changes** - permanent URL
- ✅ No time limits or session expiration
- ✅ Free forever

---

## 🆘 Common Issues & Solutions

### "Site can't be reached"
**You:** Make sure Docker is running and you ran `docker-compose up -d`
```powershell
docker-compose ps
# Should show containers running
```

### "cloudflared not found"
**You:** Make sure `cloudflared.exe` is in your project folder
```powershell
cd C:\Users\lukas\PyCharmMiscProject
dir cloudflared.exe
```

### Cloudflare shows error 1033
**You:** The tunnel isn't running or disconnected.
```powershell
# Restart the tunnel
cloudflared.exe tunnel --config cloudflared-config.yml run my-app
```

### User sees blank page
**Them:** Try refreshing the page (F5)
**You:** Check if containers are healthy:
```powershell
docker-compose logs frontend
docker-compose logs backend
```

### Users report slow loading
**Normal:** Tunnel adds minimal latency. Cloudflare CDN ensures good performance worldwide.

---

## 💡 Pro Tips

### Tip 1: Test the Link Yourself First
Before sending, open the link in a private/incognito browser window to verify it works.

### Tip 2: Bookmark the Link
Since the link never changes, save it for easy access. You can send the same link to everyone!

### Tip 3: Schedule Sharing Sessions
Tell users: "I'll have the app available from 9 AM to 5 PM today" so they know when to use it.

### Tip 4: Use Custom Domain (Optional)
If you have your own domain, you can configure Cloudflare to use it instead of the default `.trycloudflare.com` domain.

### Tip 2: Write Down the Link
Keep a note of which link you sent to whom, so you can troubleshoot if needed.

### Tip 3: Schedule Sharing Sessions
Tell users: "I'll have the app available from 9 AM to 5 PM today" so they know when to use it.

### Tip 4: Use Cloudflare for Daily Use
If you share daily with the same people, set up Cloudflare Tunnel once for a permanent link (see `DOSTEP_ZEWNETRZNY.md`).

---

## 📞 Questions?

**Full documentation:**
- English: `PUBLIC_ACCESS.md`
- Polish: `DOSTEP_ZEWNETRZNY.md`

**Need help?** Check the troubleshooting section in those guides!

---

**Happy sharing! 🎉**

*Last updated: November 7, 2025*

