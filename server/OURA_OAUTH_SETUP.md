# Oura Ring OAuth Setup Guide

## Overview
The Oura Ring integration uses OAuth 2.0 for secure authentication. This guide covers the complete setup process for production deployment.

## Prerequisites
- Oura Ring Gen 3 (Horizon or Heritage)
- Oura account with active subscription
- Access to Oura Cloud Developer Portal
- Railway account (for backend deployment)
- Expo/React Native app with deep linking configured

---

## Step 1: Register OAuth Application with Oura

### 1.1 Access Developer Portal
1. Go to [Oura Cloud Developer Portal](https://cloud.ouraring.com/oauth/applications)
2. Sign in with your Oura account
3. Navigate to "OAuth Applications"

### 1.2 Create New Application
1. Click "Create New Application"
2. Fill in application details:
   - **Application Name**: Your app name (e.g., "Health Performance Agent")
   - **Description**: Brief description of your app
   - **Redirect URI**: `healthapp://oura-callback` (must match your app's deep link scheme)
   - **Scopes**: Select the following:
     - `daily` - Daily activity, sleep, and readiness data
     - `personal` - Personal information
     - `email` - Email address

3. Click "Create Application"

### 1.3 Save Credentials
After creation, you'll receive:
- **Client ID**: A unique identifier for your app (e.g., `ABCDEF123456`)
- **Client Secret**: A secret key for token exchange (keep this secure!)

**IMPORTANT**: Save these credentials immediately. The client secret is only shown once.

---

## Step 2: Configure Environment Variables

### 2.1 Railway Environment Variables
Set the following variables in your Railway project:

```
OURA_CLIENT_ID=your-client-id-from-oura
OURA_CLIENT_SECRET=your-client-secret-from-oura
ENCRYPTION_KEY=your-32-character-encryption-key
```

**To set in Railway:**
1. Go to your Railway project
2. Select the backend service
3. Navigate to "Variables" tab
4. Add each variable with its value
5. Redeploy the service

### 2.2 Mobile App Environment Variables
Add to your `.env` file (or Expo environment):

```
EXPO_PUBLIC_OURA_CLIENT_ID=your-client-id-from-oura
EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**Note**: Only the Client ID is needed in the mobile app. The Client Secret must remain server-side only.

---

## Step 3: Configure Deep Linking

### 3.1 Update app.json
Add the following to your `app.json`:

```json
{
  "expo": {
    "scheme": "healthapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.healthapp",
      "associatedDomains": ["applinks:healthapp.com"]
    },
    "android": {
      "package": "com.yourcompany.healthapp",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "healthapp",
              "host": "oura-callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 3.2 iOS Configuration (Additional)
For iOS, you may need to add to `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>healthapp</string>
    </array>
  </dict>
</array>
```

### 3.3 Android Configuration (Additional)
The `intentFilters` in `app.json` should be sufficient for Android.

---

## Step 4: OAuth Flow Explanation

### 4.1 Authorization Flow
1. **User clicks "Connect Oura Ring"**
   - App generates OAuth URL with client ID, redirect URI, and scopes
   - Opens URL in system browser

2. **User authorizes in browser**
   - Oura login page appears
   - User grants permissions
   - Oura redirects to `healthapp://oura-callback?code=AUTH_CODE&state=STATE`

3. **App receives callback**
   - Deep link handler catches the redirect
   - Extracts authorization code from URL

4. **App exchanges code for tokens**
   - Sends code to backend API: `POST /devices/oura/:userId/connect`
   - Backend exchanges code for access/refresh tokens with Oura
   - Backend encrypts tokens and stores in database
   - Backend triggers initial sync

5. **Connection complete**
   - App displays success message
   - Automatic daily sync enabled

### 4.2 Token Management
- **Access Token**: Valid for 24 hours, used for API calls
- **Refresh Token**: Valid for 30 days, used to get new access tokens
- **Token Storage**: Encrypted with AES-256 in backend database
- **Token Refresh**: Automatic when access token expires

---

## Step 5: Testing the Integration

### 5.1 Local Testing
1. Start backend server: `npm run dev`
2. Start mobile app: `expo start`
3. Navigate to Oura Connect screen
4. Click "Connect Oura Ring"
5. Authorize in browser
6. Verify redirect back to app
7. Check connection status updates

### 5.2 Production Testing
1. Deploy backend to Railway
2. Build and deploy mobile app
3. Test OAuth flow end-to-end
4. Verify data syncs to database
5. Check cron job runs at 6 AM UTC

### 5.3 Validation Checklist
- [ ] OAuth URL opens in browser
- [ ] Oura login page appears
- [ ] Authorization succeeds
- [ ] Redirect back to app works
- [ ] Connection status shows "Connected"
- [ ] Readiness data displays
- [ ] Sync stats display
- [ ] Manual sync works
- [ ] Automatic sync runs daily
- [ ] Disconnect works

---

## Step 6: Troubleshooting

### Issue: "Cannot open Oura authorization page"
**Cause**: Deep linking not configured or URL scheme mismatch
**Solution**: 
- Verify `scheme` in app.json matches redirect URI
- Rebuild app after changing app.json
- Test deep link with: `npx uri-scheme open healthapp://oura-callback --ios`

### Issue: "Authorization failed: redirect_uri_mismatch"
**Cause**: Redirect URI in code doesn't match Oura developer portal
**Solution**:
- Check redirect URI in Oura developer portal
- Ensure it exactly matches `REDIRECT_URI` in OuraConnectScreenV2.tsx
- Update Oura app settings if needed

### Issue: "Connection failed: invalid_client"
**Cause**: Client ID or Client Secret incorrect
**Solution**:
- Verify OURA_CLIENT_ID in Railway matches Oura portal
- Verify OURA_CLIENT_SECRET in Railway matches Oura portal
- Redeploy backend after updating variables

### Issue: "Token refresh failed"
**Cause**: Refresh token expired or invalid
**Solution**:
- User must reconnect their account
- Refresh tokens expire after 30 days of inactivity
- Ensure backend token refresh logic is working

### Issue: "No data syncing"
**Cause**: Cron job not running or sync failing
**Solution**:
- Check Railway logs for cron job execution
- Verify cron job initialized in index.ts
- Check sync history table for errors
- Manually trigger sync to test

---

## Step 7: Security Best Practices

### 7.1 Client Secret Protection
- ✅ **DO**: Store client secret in Railway environment variables only
- ✅ **DO**: Never commit client secret to version control
- ❌ **DON'T**: Include client secret in mobile app
- ❌ **DON'T**: Expose client secret in API responses

### 7.2 Token Security
- ✅ **DO**: Encrypt tokens with AES-256 before database storage
- ✅ **DO**: Use HTTPS for all API communication
- ✅ **DO**: Rotate encryption key periodically
- ❌ **DON'T**: Store tokens in mobile app local storage
- ❌ **DON'T**: Log tokens in console or logs

### 7.3 Deep Link Security
- ✅ **DO**: Validate state parameter in OAuth callback
- ✅ **DO**: Validate authorization code before exchange
- ✅ **DO**: Use HTTPS for redirect URI (if using universal links)
- ❌ **DON'T**: Trust deep link data without validation

---

## Step 8: Monitoring and Maintenance

### 8.1 Monitoring
Monitor the following metrics:
- OAuth connection success rate
- Token refresh success rate
- Sync success rate
- API response times
- Cron job execution

### 8.2 Alerts
Set up alerts for:
- 3+ consecutive sync failures
- Token refresh failures
- OAuth connection failures
- Cron job not running

### 8.3 Maintenance
Regular tasks:
- Review sync failure logs weekly
- Update OAuth scopes if Oura adds new data
- Rotate encryption key annually
- Update Oura API client if API changes

---

## API Endpoints Reference

### Backend Endpoints
- `POST /devices/oura/:userId/connect` - Exchange OAuth code for tokens
- `POST /devices/oura/:userId/disconnect` - Disconnect account
- `POST /devices/oura/:userId/sync` - Manual sync trigger
- `GET /devices/oura/:userId/sync/stats?days=30` - Sync statistics
- `GET /devices/oura/:userId/readiness/latest` - Latest readiness score
- `GET /devices/oura/:userId/sleep/trend?days=7` - Sleep trend data

### Oura API Endpoints (used by backend)
- `POST https://api.ouraring.com/oauth/token` - Token exchange/refresh
- `GET https://api.ouraring.com/v2/usercollection/personal_info` - Personal info
- `GET https://api.ouraring.com/v2/usercollection/daily_sleep` - Sleep data
- `GET https://api.ouraring.com/v2/usercollection/daily_readiness` - Readiness data
- `GET https://api.ouraring.com/v2/usercollection/daily_activity` - Activity data
- `GET https://api.ouraring.com/v2/usercollection/workout` - Workout data

---

## Resources

- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Expo Deep Linking Guide](https://docs.expo.dev/guides/linking/)
- [React Native Linking API](https://reactnative.dev/docs/linking)

---

## Support

For issues with:
- **Oura API**: Contact Oura support or check developer portal
- **OAuth flow**: Review this guide and Oura API docs
- **App integration**: Check mobile app logs and backend logs
- **Environment variables**: Verify Railway configuration
