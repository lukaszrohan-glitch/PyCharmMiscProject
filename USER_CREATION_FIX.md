# User Creation Fix - November 28, 2025

## Problem
Users could not create new users from the Admin Panel. The error message was:
> "Failed to save entry: Invalid or missing API key"

## Root Cause
The frontend `adminCreateUser` and `adminListUsers` functions were using `postAdmin()` and `reqAdmin()` which added the `x-admin-key` header. However, for JWT-authenticated admins (users logged in via email/password), these functions should use JWT Bearer token authentication instead.

The backend endpoint `/api/admin/users` POST expects JWT authentication via the `require_admin` dependency, not admin key authentication.

## Solution
Modified `frontend/src/services/api.js` to intelligently choose the authentication method:

- **adminCreateUser**: Now checks if a JWT token exists via `getToken()`. If yes, uses `postAuth()` (JWT). If no, falls back to `postAdmin()` (admin key).
- **adminListUsers**: Now checks if a JWT token exists. If yes, uses `reqAuth()` (JWT). If no, falls back to `reqAdmin()` (admin key).
- **adminCreatePlan**: Same logic applied for consistency.
- **adminListPlans**: Same logic applied for consistency.

This allows:
1. JWT-authenticated admins (logged in users) to manage users using their session token
2. Admin key-authenticated users (using `x-admin-key` header) to continue working as before
3. Both authentication methods to work seamlessly without conflicts

## Files Changed
- `frontend/src/services/api.js` - Modified 4 functions to use conditional authentication

## Testing
After deploying to Railway:
1. Log in as an admin user
2. Navigate to Admin Panel (Panel Administratora)
3. Fill in the "Add User" form with:
   - Email: test@example.com
   - Password: Test1234!@#$
   - Admin checkbox: checked or unchecked as needed
4. Click "Create" (Utwórz)
5. User should be created successfully without errors

## Technical Details
The `request()` function in api.js automatically adds the JWT token from `getToken()` if available:
```javascript
const tok = getToken()
if (tok && !('Authorization' in headers)) headers['Authorization'] = `Bearer ${tok}`
```

Previously, `postAdmin()` would add `x-admin-key` but the endpoint didn't use it. Now `postAuth()` is used for JWT admins, which properly leverages the existing JWT authentication flow.

