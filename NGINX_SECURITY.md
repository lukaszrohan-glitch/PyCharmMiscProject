# Nginx Security Headers Configuration

## Overview

The nginx configuration includes comprehensive security headers to protect against common web vulnerabilities. These headers are applied to all HTTP responses.

## Security Headers Explained

### 1. X-Frame-Options: DENY
**Purpose**: Prevent clickjacking attacks  
**How it works**: Prevents the page from being displayed in an iframe on other sites  
**Value**: `DENY` - Page cannot be framed by anyone  
**Alternatives**:
- `SAMEORIGIN` - Can be framed only on same origin
- `ALLOW-FROM https://example.com` - Allow specific origins

### 2. X-Content-Type-Options: nosniff
**Purpose**: Prevent MIME type sniffing  
**How it works**: Forces browser to respect declared content types  
**Prevents**: File upload attacks, reflected XSS via content type mismatch  
**Value**: `nosniff` - Always honor Content-Type header

### 3. X-XSS-Protection: 1; mode=block
**Purpose**: Enable browser XSS protection  
**How it works**: Instructs browser to stop page load if XSS is detected  
**Value**:
- `1` - Enable protection
- `mode=block` - Block entire page instead of sanitizing

### 4. X-Permitted-Cross-Domain-Policies: none
**Purpose**: Prevent cross-domain Flash policies  
**How it works**: Disallows Flash from accessing page resources  
**Use case**: Legacy browser compatibility, Flash security

### 5. Content-Security-Policy (CSP)
**Purpose**: Comprehensive defense against XSS, clickjacking, injection attacks  
**Current directives**:

```nginx
default-src 'self'              # Only allow resources from same origin by default
script-src 'self' 'unsafe-inline' 'unsafe-eval'   # Allow scripts
style-src 'self' 'unsafe-inline'                  # Allow styles
img-src 'self' data: https:     # Allow images from self, data URIs, and HTTPS
font-src 'self' data:           # Allow fonts from self and data URIs
connect-src 'self'              # Allow connections (fetch, WebSocket) to same origin
frame-ancestors 'none'          # Cannot be framed
form-action 'self'              # Forms can only submit to same origin
base-uri 'self'                 # Restrict base tag
```

**Security Notes**:
- `'unsafe-inline'` and `'unsafe-eval'` reduce security
- Consider removing them after testing with your app
- Use nonce-based CSP for better security: `script-src 'nonce-<random>'`

### 6. Strict-Transport-Security (HSTS)
**Purpose**: Force HTTPS connections  
**How it works**: Tells browser to always use HTTPS for this domain  
**Value**: `max-age=31536000; includeSubDomains; preload`

**Components**:
- `max-age=31536000` - Remember for 1 year (31536000 seconds)
- `includeSubDomains` - Apply to all subdomains
- `preload` - Include in HSTS preload list (optional)

**Important**: Only enable on HTTPS domains; removes HTTP access

### 7. Referrer-Policy: strict-origin-when-cross-origin
**Purpose**: Control how much referrer information is shared  
**How it works**: Limits data sent in Referer header  
**Value**: Send referrer only to same origin or for cross-origin HTTPS requests

**Other options**:
- `no-referrer` - Never send referrer
- `same-origin` - Only send for same-origin requests
- `origin` - Send only origin

### 8. Permissions-Policy
**Purpose**: Disable unnecessary browser features  
**How it works**: Prevents page from using sensitive APIs  
**Disabled features**:
- `accelerometer=()` - Motion sensors
- `camera=()` - Camera access
- `geolocation=()` - Location sharing
- `gyroscope=()` - Rotation sensors
- `magnetometer=()` - Magnetic field sensor
- `microphone=()` - Microphone access
- `payment=()` - Payment APIs
- `usb=()` - USB device access

**Note**: Enable only if your app needs them

## Testing Security Headers

### Using curl
```bash
curl -i https://arkuszowniasmb.pl | grep -i "x-frame\|x-content\|strict-transport\|content-security"
```

### Using online tools
- [SSL Labs Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

### Expected output
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
X-Permitted-Cross-Domain-Policies: none
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), ...
```

## Production Hardening

### Tighten CSP
Current policy allows `unsafe-inline` for development. For production:

```nginx
# Development (flexible)
Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."

# Production (strict)
Content-Security-Policy "default-src 'self'; script-src 'nonce-{random}'; script-src-attr 'nonce-{random}'; ..."
```

### Add additional headers
```nginx
# Remove server identification
server_tokens off;

# Disable browser cache for sensitive data
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0

# Enable browser caching for static assets
Cache-Control: public, max-age=31536000, immutable
```

### HTTPS enforcement
Ensure:
1. All endpoints use HTTPS
2. HSTS preload is registered
3. SSL/TLS 1.2+ only
4. Modern cipher suites

## Common Issues

### CSP blocks resources
**Symptom**: Browser console shows CSP violations  
**Solution**: Update CSP to allow resource origin or use nonce/hash

**Example error**:
```
Refused to load script from 'https://cdn.example.com' because it violates Content-Security-Policy
```

**Fix**:
```nginx
script-src 'self' https://cdn.example.com;
```

### Browser warns about mixed content
**Symptom**: Page loads over HTTPS but requests HTTP resources  
**Solution**: Ensure all resources use HTTPS or relative URLs

### HSTS issues (cannot access over HTTP)
**Symptom**: After enabling HSTS, HTTP requests fail permanently  
**Note**: This is expected behavior; always use HTTPS  
**Fix**: Add HTTPS certificate or disable HSTS temporarily

## Security Checklist

- [ ] All headers configured and tested
- [ ] CSP whitelist only trusted origins
- [ ] HTTPS enabled on all endpoints
- [ ] HSTS max-age at least 31536000 (1 year)
- [ ] X-Frame-Options set to DENY
- [ ] Server tokens hidden
- [ ] Security headers tested with online tools
- [ ] No deprecated headers (e.g., X-XSS-Protection)

## References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
