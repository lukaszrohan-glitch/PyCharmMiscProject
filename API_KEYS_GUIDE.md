# API Keys Guide - Synterra

## 🔑 What are API Keys?

There are **two types** of authentication keys in your system:

### 1. **Regular API Keys** (User Level)
- Used to authenticate API requests (create orders, timesheets, inventory, etc.)
- Each key can be labeled (e.g., "Mobile App", "External Integration")
- Can be created, rotated, and deleted through the Admin Panel
- Stored in the database with audit trails

### 2. **Admin Key** (System Level)
- Set via environment variable: `ADMIN_KEY=test-admin-key`
- Used to access admin-only endpoints:
  - `/api/admin/api-keys` (list, create, delete)
  - `/api/admin/api-keys/{id}/rotate`
  - `/api/admin/api-key-audit` (view audit logs)
- More powerful than regular API keys
- Currently set to: `test-admin-key`

---

## 📋 How to Create API Keys (For Users)

### Method 1: Via Admin Panel UI (Easiest)

1. **Login** as admin: `ciopqj@gmail.com` / `769cf499`

2. **Open Admin Panel**:
   - Look for the button at the top: "Toggle Admin" (🔑 API Key Optional)
   - Click it to open the Admin Panel

3. **Enter Admin Key**:
   - You'll see an "Admin Key" input field
   - Enter: `test-admin-key`
   - Click "Set Admin Key"

4. **Create a New API Key**:
   - In the "Label" field, enter a name (e.g., "Production App")
   - Click "Create API Key"
   - **IMPORTANT**: Copy the generated key immediately!
   - The key is shown only once for security

5. **The API key is created!** You can now:
   - View all keys in the list
   - Delete keys
   - Rotate keys (generate a new one)

### Method 2: Via API Directly

```bash
# Create a new API key
curl -X POST http://localhost:8000/api/admin/api-keys \
  -H "x-admin-key: test-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "My Integration Key"}'

# Response:
# {
#   "id": 1,
#   "api_key": "sk_abc123...",  ← COPY THIS!
#   "label": "My Integration Key",
#   "created_at": "2025-11-08T10:30:00"
# }
```

---

## 🔐 How to Use API Keys

### In Your Application Code:

```javascript
// Set the API key (after getting it from admin panel)
const API_KEY = 'sk_abc123...'

// Use it in requests
fetch('http://localhost:8000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY  // ← Add this header
  },
  body: JSON.stringify({
    order_id: 'ORD-123',
    customer_id: 'CUST-001'
  })
})
```

### In cURL:

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "x-api-key: sk_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-123",
    "customer_id": "CUST-001",
    "status": "New"
  }'
```

---

## 🛠️ API Key Management

### List All Keys:
```bash
curl -H "x-admin-key: test-admin-key" \
  http://localhost:8000/api/admin/api-keys
```

### Delete a Key:
```bash
curl -X DELETE \
  -H "x-admin-key: test-admin-key" \
  http://localhost:8000/api/admin/api-keys/1
```

### Rotate a Key (Generate New One):
```bash
curl -X POST \
  -H "x-admin-key: test-admin-key" \
  http://localhost:8000/api/admin/api-keys/1/rotate
```

### View Audit Log:
```bash
curl -H "x-admin-key: test-admin-key" \
  http://localhost:8000/api/admin/api-key-audit
```

---

## 🔒 Security Best Practices

### For Production:

1. **Change the Admin Key**:
   ```bash
   # Edit .env file
   ADMIN_KEY=your-very-secure-random-key-here
   ```

2. **Generate Strong Keys**:
   ```bash
   # Use openssl to generate secure keys
   openssl rand -hex 32
   ```

3. **Rotate Keys Regularly**:
   - Use the rotate endpoint
   - Update applications with new keys
   - Delete old keys after migration

4. **Monitor Usage**:
   - Check audit logs regularly
   - Look for suspicious activity
   - Track which keys are used when

5. **Limit Key Scope** (future enhancement):
   - Consider adding permissions per key
   - Some keys only for read operations
   - Some keys only for specific resources

---

## 🎯 Current Configuration

Your system is currently in **"Zero-Setup Mode"**:

```dotenv
API_KEYS=                    # ← Empty = no keys required (demo mode)
ADMIN_KEY=test-admin-key     # ← Set for admin panel access
```

### What This Means:

- ✅ **API requests work without keys** (good for testing)
- ✅ **Admin panel requires the admin key** (secure)
- ⚠️ **For production**: Set `API_KEYS=sk_prod_key1,sk_prod_key2`

---

## 🚀 Quick Start Example

### Step 1: Create Your First API Key

```bash
# Via API
curl -X POST http://localhost:8000/api/admin/api-keys \
  -H "x-admin-key: test-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"label": "My First Key"}'

# Copy the returned api_key value!
```

### Step 2: Use It in Your App

```javascript
// In your frontend or integration
const response = await fetch('http://localhost:8000/api/orders', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_COPIED_KEY_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    order_id: 'ORD-001',
    customer_id: 'CUST-001',
    status: 'New'
  })
})
```

### Step 3: Verify It Works

```bash
# Check the audit log
curl -H "x-admin-key: test-admin-key" \
  http://localhost:8000/api/admin/api-key-audit

# You should see your key usage logged!
```

---

## 📊 What Gets Protected by API Keys?

### Write Operations (Require API Key):
- ✅ `POST /api/orders` - Create order
- ✅ `POST /api/order-lines` - Add order lines
- ✅ `POST /api/timesheets` - Log timesheet
- ✅ `POST /api/inventory` - Create inventory transaction

### Read Operations (Currently Open):
- 📖 `GET /api/orders` - List orders
- 📖 `GET /api/products` - List products
- 📖 `GET /api/customers` - List customers
- 📖 `GET /api/finance/{id}` - View finance data

### Admin Operations (Require Admin Key):
- 🔐 `POST /api/admin/api-keys` - Create API key
- 🔐 `DELETE /api/admin/api-keys/{id}` - Delete API key
- 🔐 `GET /api/admin/api-key-audit` - View audit logs

---

## 💡 Common Questions

**Q: I see "API_KEYS=" is empty. Do I need API keys?**
A: No! Empty means "demo mode" - anyone can make requests. For production, generate and set keys.

**Q: What's the difference between API_KEYS and ADMIN_KEY?**
A: 
- `API_KEYS` = User-level keys for normal operations (comma-separated list)
- `ADMIN_KEY` = System-level key for managing other keys (single key)

**Q: Can I have multiple API keys?**
A: Yes! Create as many as you need via the admin panel. Each can be labeled and tracked.

**Q: How do I revoke access?**
A: Delete the API key through the admin panel or API. The key stops working immediately.

**Q: Are API keys stored securely?**
A: Yes! They're hashed in the database (like passwords). Only shown once when created.

**Q: Can I see who's using which key?**
A: Yes! Check the audit log at `/api/admin/api-key-audit` to see all key usage.

---

## 🎓 Summary

1. **Admin Key** (`test-admin-key`) = Manages the system
2. **API Keys** (created via admin panel) = Used by applications
3. **Demo Mode** (API_KEYS empty) = No keys required (testing)
4. **Production Mode** (API_KEYS set) = Keys required for writes

**Next Steps**:
1. Login to the admin panel
2. Create your first API key
3. Test it with a POST request
4. Check the audit log to see it working!

---

**Need Help?** Open the Admin Panel and start experimenting! All actions are logged and can be undone.

