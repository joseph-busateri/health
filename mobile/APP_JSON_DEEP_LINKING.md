# Deep Linking Configuration for Oura OAuth

## Overview
This document provides the exact configuration needed in `app.json` to enable OAuth deep linking for the Oura Ring integration.

## Required Configuration

Add or update the following sections in your `app.json`:

```json
{
  "expo": {
    "name": "Health Performance Agent",
    "slug": "health-app",
    "version": "1.0.0",
    "scheme": "healthapp",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.healthapp",
      "associatedDomains": [
        "applinks:healthapp.com"
      ],
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "healthapp"
            ]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
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
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Key Configuration Points

### 1. App Scheme
```json
"scheme": "healthapp"
```
- This is the base URL scheme for your app
- Must match the scheme in OAuth redirect URI
- Example: `healthapp://oura-callback`

### 2. iOS Configuration
```json
"ios": {
  "bundleIdentifier": "com.yourcompany.healthapp",
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLSchemes": ["healthapp"]
      }
    ]
  }
}
```
- `bundleIdentifier`: Your unique iOS app identifier
- `CFBundleURLSchemes`: Registers the URL scheme with iOS

### 3. Android Configuration
```json
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
```
- `package`: Your unique Android app identifier
- `intentFilters`: Registers the deep link with Android
- `scheme` + `host`: Forms the complete URL (`healthapp://oura-callback`)

## Testing Deep Links

### Test on iOS Simulator
```bash
xcrun simctl openurl booted healthapp://oura-callback?code=test123&state=abc
```

### Test on Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "healthapp://oura-callback?code=test123&state=abc" com.yourcompany.healthapp
```

### Test with Expo
```bash
npx uri-scheme open healthapp://oura-callback --ios
npx uri-scheme open healthapp://oura-callback --android
```

## Verification Checklist

After updating `app.json`:

- [ ] Rebuild the app (deep linking requires native code changes)
- [ ] Test deep link opens the app
- [ ] Test OAuth callback is received
- [ ] Verify URL parameters are parsed correctly
- [ ] Test on both iOS and Android
- [ ] Test on physical devices (not just simulators)

## Common Issues

### Issue: Deep link doesn't open app
**Solution**: 
- Rebuild the app after changing `app.json`
- Verify scheme matches exactly (case-sensitive)
- Check that app is installed on device

### Issue: App opens but callback not handled
**Solution**:
- Verify `Linking.addEventListener` is set up in OuraConnectScreenV2
- Check that URL parsing logic is correct
- Ensure component is mounted when callback occurs

### Issue: Works on iOS but not Android
**Solution**:
- Verify `intentFilters` are correctly configured
- Check Android package name matches
- Ensure `autoVerify` is set to true

## Important Notes

1. **Rebuild Required**: Any changes to `app.json` require a full rebuild of the native app. Hot reload will not apply these changes.

2. **Scheme Uniqueness**: Choose a unique scheme to avoid conflicts with other apps. `healthapp` is just an example.

3. **Production vs Development**: You may want different schemes for development and production builds.

4. **Universal Links**: For production, consider using universal links (HTTPS URLs) instead of custom schemes for better security and user experience.

## Production Recommendations

For production deployment, consider:

1. **Use Universal Links (iOS) / App Links (Android)**:
   - More secure than custom URL schemes
   - Better user experience
   - Requires domain verification

2. **Example Universal Link Configuration**:
```json
"ios": {
  "associatedDomains": [
    "applinks:healthapp.com"
  ]
},
"android": {
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "healthapp.com",
          "pathPrefix": "/oura-callback"
        }
      ],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

3. **Update Oura OAuth Redirect URI**:
   - Change from `healthapp://oura-callback`
   - To `https://healthapp.com/oura-callback`
   - Requires web server to handle redirect and deep link to app

## Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [React Native Linking API](https://reactnative.dev/docs/linking)
