# 🌐 Final Step: Update Nameservers for arkuszowniasmb.com

## ⚠️ Action Required

To complete your Cloudflare setup, you need to update the nameservers at your domain registrar.

---

## 📋 What You Need to Do

### Step 1: Find Your Domain Registrar

Your domain `arkuszowniasmb.com` is registered somewhere (e.g., GoDaddy, Namecheap, OVH, etc.)

**Find your registrar:** https://lookup.icann.org/en/lookup

---

### Step 2: Turn Off DNSSEC (Important!)

Before changing nameservers:

1. Log into your domain registrar account
2. Find DNS settings for `arkuszowniasmb.com`
3. **Turn OFF DNSSEC** if enabled
4. Save changes

**Why?** DNSSEC must be disabled before changing nameservers, or your site won't work. You can re-enable it later through Cloudflare.

---

### Step 3: Update Nameservers

Replace your current nameservers with these **Cloudflare nameservers:**

```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

#### Instructions by Registrar:

**GoDaddy:**
1. Go to Domain Settings → Nameservers
2. Click "Change"
3. Select "Custom"
4. Enter both Cloudflare nameservers
5. Save

**Namecheap:**
1. Go to Domain List → Manage
2. Click "Custom DNS"
3. Enter both Cloudflare nameservers
4. Save

**OVH:**
1. Go to DNS servers
2. Select "Use different DNS servers"
3. Enter both Cloudflare nameservers
4. Apply configuration

**Other Registrars:**
- Look for "DNS Settings" or "Nameservers"
- Change to "Custom nameservers"
- Enter the two Cloudflare nameservers
- Save changes

---

### Step 4: Wait for Propagation

**Timeline:** Up to 24 hours (usually 1-2 hours)

Cloudflare will email you at: **lukasz.rohan@gmail.com** when `arkuszowniasmb.com` is active.

---

## 🔍 How to Check Progress

### Option 1: Check DNS Propagation
Visit: https://dnschecker.org/

Enter: `arkuszowniasmb.com`

Look for: `boyd.ns.cloudflare.com` or `reza.ns.cloudflare.com` in NS records

### Option 2: Command Line
```powershell
nslookup -type=NS arkuszowniasmb.com
```

You should see:
```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

---

## ⏰ Current Status

### Cloudflare Side: ✅ Complete
- [x] Tunnel created
- [x] DNS records configured in Cloudflare
- [x] Domain added to Cloudflare

### Your Side: ⏳ Pending
- [ ] DNSSEC turned off
- [ ] Nameservers updated at registrar
- [ ] Changes saved
- [ ] Waiting for propagation

---

## 🎯 What Happens After?

Once nameservers are updated and propagated:

1. ✅ Cloudflare will send you confirmation email
2. ✅ Your site will be live at https://arkuszowniasmb.com
3. ✅ HTTPS will be enabled automatically
4. ✅ Cloudflare protection will be active

---

## 🚀 Meanwhile: Test Your Setup Locally

While waiting for DNS propagation, you can test everything:

### Run Your Site Locally
```powershell
# Start your application
start-arkuszownia.cmd
```

### Access Via Tunnel URL
Cloudflare provides a temporary URL. Check your terminal output when tunnel starts for:
```
https://your-tunnel-id.cfargotunnel.com
```

Or use: http://localhost (on your computer)

---

## 📊 Your Cloudflare Settings

**Account ID:** `1d3ab6d58f6470b0ba0c11d8be3bf4d4`  
**Zone ID:** `e7b8ab3e3eea7a7dc70f8ee8e51d6d84`

**Nameservers Assigned:**
- `boyd.ns.cloudflare.com`
- `reza.ns.cloudflare.com`

**Tunnel ID:** `3e14f36a-7e9c-4a54-92ea-a58f1e856df5`  
**Tunnel Name:** `arkuszowniasmb`

---

## ⚠️ Important Notes

### Don't Skip DNSSEC Step!
If you don't turn off DNSSEC first, your site won't work after changing nameservers.

### Keep Old Nameservers Handy
Write down your current nameservers before changing them, just in case you need to revert.

### Propagation Time Varies
- Fastest: 15-30 minutes
- Average: 2-4 hours
- Maximum: 24 hours

### You Can Start Your Tunnel Now
Even before DNS propagation, you can:
1. Run `start-arkuszownia.cmd`
2. Test the tunnel connection
3. Verify everything works locally

---

## 🔐 After Activation Checklist

Once Cloudflare confirms activation:

- [ ] Visit https://arkuszowniasmb.com (verify HTTPS works)
- [ ] Test www.arkuszowniasmb.com (should also work)
- [ ] Change admin API key
- [ ] Remove test API keys
- [ ] Create production API keys
- [ ] Test all app functionality
- [ ] Enable Cloudflare security features
- [ ] Set up page rules (optional)

---

## 📞 Need Help?

### Can't Find Your Registrar?
Use: https://lookup.icann.org/en/lookup

### Don't Have Registrar Access?
Contact the person who registered the domain or your IT administrator.

### Nameserver Changes Not Working?
1. Verify DNSSEC is off
2. Double-check nameserver spelling
3. Wait longer (can take 24h)
4. Contact your registrar support

### Cloudflare Questions?
Check: https://dash.cloudflare.com/login
Or: Cloudflare Support Portal

---

## 📝 Summary

**What You Need to Do RIGHT NOW:**

1. ✅ Log into your domain registrar
2. ✅ Turn off DNSSEC
3. ✅ Change nameservers to:
   - `boyd.ns.cloudflare.com`
   - `reza.ns.cloudflare.com`
4. ✅ Save changes
5. ⏳ Wait for email confirmation

**When Complete:**
- Your site will be live at https://arkuszowniasmb.com
- Cloudflare protection will be active
- HTTPS will work automatically

---

## ✅ Quick Checklist

```
[ ] Found my domain registrar
[ ] Logged into registrar account
[ ] Located DNS/Nameserver settings
[ ] Turned off DNSSEC
[ ] Copied Cloudflare nameservers
[ ] Pasted into registrar
[ ] Saved changes
[ ] Waiting for confirmation email
```

---

**Nameservers to Use:**
```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

**Copy these exactly - no typos!**

---

**Last Updated:** November 7, 2025  
**Status:** ⏳ Waiting for nameserver update at registrar  
**Next:** You'll receive email when active (up to 24 hours)

