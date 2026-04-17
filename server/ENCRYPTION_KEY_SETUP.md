# ENCRYPTION_KEY Setup Guide

## Overview
The Sleep Number, Oura Ring, and Apple Watch integrations use AES-256-CBC encryption to securely store OAuth tokens and credentials. A 32-character encryption key must be set in the production environment.

## Why This Is Required
- Tokens are stored encrypted in the database
- AES-256-CBC requires a 32-byte (256-bit) key
- Using the placeholder key in production is a security risk
- The application logs a warning when using the placeholder key

## Generating a Secure Encryption Key

### Option 1: Using Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Using Python
```python
import secrets
print(secrets.token_hex(32))
```

### Option 4: Using PowerShell
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Setting the Environment Variable

### Railway
1. Go to your Railway project
2. Navigate to the service (backend)
3. Go to Variables tab
4. Add new variable:
   - **Name**: `ENCRYPTION_KEY`
   - **Value**: [your 32-character hex key]
5. Redeploy the service

### Local Development
Add to your `.env` file:
```
ENCRYPTION_KEY=your-32-character-hex-key-here
```

## Verification

After setting the key, verify it's working:

1. Check server logs - the warning should disappear:
   ```
   WARNING: Using placeholder ENCRYPTION_KEY. Set ENCRYPTION_KEY environment variable for production security.
   ```

2. Test device connection:
   - Connect a Sleep Number account
   - Verify tokens are encrypted in the database
   - Check that sync works correctly

## Security Best Practices

1. **Never commit the key to version control**
   - Add `.env` to `.gitignore`
   - Never include keys in code

2. **Use different keys for different environments**
   - Development key
   - Staging key
   - Production key

3. **Rotate keys periodically**
   - Generate a new key
   - Re-encrypt all tokens with new key
   - Update environment variable

4. **Store securely**
   - Use Railway's encrypted variable storage
   - Limit access to the key
   - Document who has access

## Key Rotation Process

If you need to rotate the encryption key:

1. Generate a new key using one of the methods above
2. Create a migration script to:
   - Decrypt existing tokens with old key
   - Re-encrypt with new key
   - Update database records
3. Update the environment variable
4. Redeploy the service
5. Verify connections still work

## Troubleshooting

### Warning Still Appears
- Ensure the variable name is exactly `ENCRYPTION_KEY` (case-sensitive)
- Verify the variable is set in the correct environment
- Check that the service was redeployed after adding the variable

### Connection Fails After Key Change
- The old tokens are encrypted with the old key
- Users may need to reconnect their accounts
- Implement key rotation to avoid this (see above)

### Invalid Key Length
- The key must be exactly 32 characters (64 hex characters)
- AES-256 requires exactly 256 bits (32 bytes)

## Example Key Format
```
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

Note: This is an example. Generate your own random key.
