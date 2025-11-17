# 🚀 QUICK START: Update Nameservers in 5 Minutes

## WHERE IS YOUR DOMAIN REGISTERED?

Your domain `arkuszowniasmb.com` is registered somewhere. Find it here:

### Option 1: Check Your Email
Search your email for "arkuszowniasmb.com" - you should have a registration confirmation email.

### Option 2: Use WHOIS
Go to: **https://www.whois.com/whois/arkuszowniasmb.com**

Look for "Registrar:" - that's where you need to go.

---

## STEP-BY-STEP GUIDE

### 1️⃣ GO TO YOUR REGISTRAR'S WEBSITE

Common registrars:
- **OVH.pl** → https://www.ovh.pl/manager/
- **home.pl** → https://panel.home.pl/
- **GoDaddy** → https://dcc.godaddy.com/
- **Namecheap** → https://ap.www.namecheap.com/

### 2️⃣ LOG IN
Use your registrar account credentials.

### 3️⃣ FIND YOUR DOMAIN
Look for "Domains" or "Moje domeny" and click on `arkuszowniasmb.com`

### 4️⃣ TURN OFF DNSSEC (If Present)
- Look for "DNSSEC" settings
- If it's ON, turn it OFF
- Save

### 5️⃣ CHANGE NAMESERVERS

Look for one of these options:
- "Nameservers" / "Serwery nazw"
- "DNS Settings" / "Ustawienia DNS"
- "Zarządzaj DNS"

Then:

**A. Select "Custom Nameservers" / "Własne serwery nazw"**

**B. Delete existing nameservers**

**C. Add these TWO nameservers:**

```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

**D. SAVE CHANGES**

---

## 🎯 SPECIFIC INSTRUCTIONS FOR POPULAR POLISH REGISTRARS

### If Using OVH.pl:

1. Go to: https://www.ovh.pl/manager/
2. Click on your domain `arkuszowniasmb.com`
3. Go to "Serwery DNS" tab
4. Click "Zmień serwery DNS"
5. Select "Użyj innych serwerów DNS"
6. Enter:
   - Serwer DNS 1: `boyd.ns.cloudflare.com`
   - Serwer DNS 2: `reza.ns.cloudflare.com`
7. Click "Zatwierdź"

### If Using home.pl:

1. Go to: https://panel.home.pl/
2. Find "Domeny" → Click on `arkuszowniasmb.com`
3. Go to "Serwery DNS"
4. Select "Własne serwery nazw"
5. Enter:
   - NS1: `boyd.ns.cloudflare.com`
   - NS2: `reza.ns.cloudflare.com`
6. Save

### If Using GoDaddy:

1. Go to: https://dcc.godaddy.com/
2. Find your domain → Click "DNS"
3. Scroll to "Nameservers"
4. Click "Change"
5. Select "Enter my own nameservers (advanced)"
6. Enter:
   - Nameserver 1: `boyd.ns.cloudflare.com`
   - Nameserver 2: `reza.ns.cloudflare.com`
7. Save

---

## ⏰ WHAT HAPPENS NEXT?

After you save:

1. **Wait:** 15 minutes to 24 hours (usually 1-2 hours)
2. **Email:** You'll get confirmation at lukasz.rohan@gmail.com
3. **Live:** Your site will be at https://arkuszowniasmb.com

---

## 🆘 STILL STUCK?

### Can't Find Your Registrar?
Call or email the company that charged your credit card for the domain.

### Don't Have Login Credentials?
1. Use "Forgot Password" on registrar website
2. Check email for login details
3. Contact registrar support

### Need Someone to Do It?
You need to ask someone with access to your registrar account:
- The person who registered the domain
- Your company's IT administrator
- The registrar's support team (they can guide you)

---

## ✅ VERIFICATION

After changing nameservers, check if it worked:

```powershell
nslookup -type=NS arkuszowniasmb.com
```

You should see:
```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

---

## 🎉 DONE?

Once nameservers are updated:

1. ✅ You'll receive email confirmation
2. ✅ Run `start-arkuszownia.cmd`
3. ✅ Visit https://arkuszowniasmb.com
4. ✅ Your site is LIVE! 🚀

---

## 📋 QUICK CHECKLIST

```
[ ] Found my registrar
[ ] Logged in
[ ] Turned off DNSSEC (if present)
[ ] Changed nameservers to boyd.ns.cloudflare.com and reza.ns.cloudflare.com
[ ] Saved changes
[ ] Waiting for confirmation email
```

---

**NAMESERVERS TO COPY:**
```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

**This is the ONLY thing you need to do!**

Everything else is already configured and ready on Cloudflare's side. ✅

