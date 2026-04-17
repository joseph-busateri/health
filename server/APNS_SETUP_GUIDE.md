# Apple Push Notification Service (APNs) Setup Guide

## Overview
This guide covers the complete setup process for APNs integration with the Apple Watch health data sync system. APNs enables silent background notifications that trigger the iOS app to read HealthKit data and send it to the backend.

---

## Prerequisites
- Apple Developer Account (paid membership required)
- Access to Apple Developer Portal
- Xcode installed on macOS
- iOS app project configured
- Railway account for backend deployment

---

## Part 1: Apple Developer Portal Setup

### Step 1.1: Create APNs Authentication Key

1. **Navigate to Keys Section**
   - Go to [Apple Developer Portal](https://developer.apple.com/account)
   - Sign in with your Apple ID
   - Navigate to **Certificates, Identifiers & Profiles**
   - Select **Keys** from the left sidebar

2. **Create New Key**
   - Click the **+** button to create a new key
   - Enter a key name (e.g., "Health App APNs Key")
   - Check the box for **Apple Push Notifications service (APNs)**
   - Click **Continue**

3. **Download Key File**
   - Click **Register** to create the key
   - **IMPORTANT**: Download the `.p8` file immediately
   - The key file can only be downloaded once
   - Save it securely (e.g., `AuthKey_XXXXXXXXXX.p8`)

4. **Note Key Information**
   - **Key ID**: 10-character identifier (e.g., `AB12CD34EF`)
   - **Team ID**: Found in the top-right corner of the portal (e.g., `1234567890`)
   - Save both of these values

### Step 1.2: Register App ID with Push Notifications

1. **Navigate to Identifiers**
   - In Apple Developer Portal
   - Go to **Certificates, Identifiers & Profiles**
   - Select **Identifiers** from the left sidebar

2. **Create or Edit App ID**
   - If creating new: Click **+** button
   - If editing existing: Select your app ID
   - Enter Bundle ID (e.g., `com.yourcompany.healthapp`)

3. **Enable Push Notifications**
   - Scroll to **Capabilities** section
   - Check **Push Notifications**
   - Click **Save** or **Continue**

---

## Part 2: Xcode Project Configuration

### Step 2.1: Enable Push Notifications Capability

1. **Open Xcode Project**
   - Open your iOS app project in Xcode
   - Select the project in the navigator

2. **Add Push Notifications Capability**
   - Select your app target
   - Go to **Signing & Capabilities** tab
   - Click **+ Capability**
   - Add **Push Notifications**

3. **Add Background Modes**
   - Click **+ Capability** again
   - Add **Background Modes**
   - Check the following boxes:
     - ✅ **Background fetch**
     - ✅ **Remote notifications**

### Step 2.2: Configure Info.plist

Add the following to your `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

---

## Part 3: iOS App Implementation

### Step 3.1: Register for Push Notifications

Add to your `AppDelegate.swift` or main app file:

```swift
import UIKit
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Register for push notifications
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }
        
        return true
    }
    
    // Handle successful registration
    func application(_ application: UIApplication, 
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("Device Token: \(token)")
        
        // Send token to your backend
        sendDeviceTokenToBackend(token)
    }
    
    // Handle registration failure
    func application(_ application: UIApplication, 
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for remote notifications: \(error)")
    }
    
    // Handle silent notification
    func application(_ application: UIApplication,
                     didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        
        // Check if this is a HealthKit sync notification
        if let type = userInfo["type"] as? String, type == "healthkit_sync" {
            // Trigger HealthKit data read and upload
            performHealthKitSync { success in
                completionHandler(success ? .newData : .failed)
            }
        } else {
            completionHandler(.noData)
        }
    }
    
    private func sendDeviceTokenToBackend(_ token: String) {
        // Send to your backend API
        let url = URL(string: "https://your-api.com/users/device-token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["deviceToken": token, "platform": "ios"]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request).resume()
    }
    
    private func performHealthKitSync(completion: @escaping (Bool) -> Void) {
        // Your HealthKit sync logic here
        // Read from HealthKit and send to backend
        // Call completion(true) when done
    }
}
```

### Step 3.2: Handle Background Fetch

Implement background fetch in your app:

```swift
func application(_ application: UIApplication,
                 performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    // Perform HealthKit sync
    performHealthKitSync { success in
        completionHandler(success ? .newData : .failed)
    }
}
```

---

## Part 4: Backend Configuration

### Step 4.1: Prepare APNs Key for Railway

1. **Encode .p8 File to Base64**

   ```bash
   # On macOS/Linux
   base64 -i AuthKey_XXXXXXXXXX.p8 -o apns_key_base64.txt
   
   # On Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXXXXXX.p8")) | Out-File apns_key_base64.txt
   ```

2. **Copy Base64 Content**
   - Open `apns_key_base64.txt`
   - Copy the entire base64 string

### Step 4.2: Set Environment Variables in Railway

Set the following variables in your Railway project:

```
APNS_KEY=base64:<paste-base64-string-here>
APNS_KEY_ID=AB12CD34EF
APNS_TEAM_ID=1234567890
APNS_BUNDLE_ID=com.yourcompany.healthapp
NODE_ENV=production
```

**Important Notes:**
- Prefix the base64 string with `base64:` so the backend knows to decode it
- Alternatively, you can paste the raw .p8 file content (without base64 encoding)
- Ensure `NODE_ENV=production` for production APNs endpoint

### Step 4.3: Redeploy Backend

After setting environment variables:
1. Redeploy your Railway service
2. Check logs for APNs initialization
3. Verify no warnings about missing APNs credentials

---

## Part 5: Testing

### Step 5.1: Test Device Token Registration

1. **Run iOS App**
   - Build and run app on physical device (not simulator)
   - Grant notification permissions when prompted
   - Check Xcode console for device token

2. **Verify Backend Receives Token**
   - Check backend logs
   - Verify token is saved to database
   - Confirm `ios_push_enabled` is set to `true`

### Step 5.2: Test Silent Notification

1. **Trigger Manual Sync**
   - In the app, trigger a manual sync
   - This should send a test notification

2. **Check APNs Logs**
   - Check Railway logs for APNs notification sent
   - Look for success/failure messages
   - Verify notification was delivered

3. **Verify Background Sync**
   - Put app in background
   - Wait for notification delivery
   - Check if HealthKit data is synced
   - Verify data appears in backend

### Step 5.3: Test Cron Job

1. **Wait for Scheduled Sync**
   - Cron runs daily at 6 AM UTC
   - Or manually trigger via API

2. **Monitor Logs**
   - Check Railway logs at 6 AM UTC
   - Verify cron job executes
   - Check APNs notifications sent
   - Verify sync completion

---

## Part 6: Troubleshooting

### Issue: "APNs credentials not configured" Warning

**Cause**: Environment variables not set or incorrect

**Solution**:
1. Verify all three variables are set: `APNS_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`
2. Check for typos in variable names
3. Ensure base64 encoding is correct
4. Redeploy after setting variables

### Issue: "Failed to register for remote notifications"

**Cause**: Push Notifications capability not enabled or provisioning profile issue

**Solution**:
1. Enable Push Notifications in Xcode capabilities
2. Regenerate provisioning profile in Apple Developer Portal
3. Ensure app is running on physical device (not simulator)
4. Check that Bundle ID matches Apple Developer Portal

### Issue: "APNs notification failed: Unregistered"

**Cause**: Device token is invalid or expired

**Solution**:
1. Device token changes when app is reinstalled
2. User may have disabled notifications
3. Update device token in backend
4. Re-register for notifications in app

### Issue: "APNs notification failed: BadDeviceToken"

**Cause**: Using development token with production APNs or vice versa

**Solution**:
1. Ensure `NODE_ENV=production` in Railway for production
2. Use correct provisioning profile (development vs distribution)
3. Rebuild app with correct configuration

### Issue: Silent notification not triggering background sync

**Cause**: Background modes not configured or iOS restrictions

**Solution**:
1. Verify Background Modes capability is enabled
2. Check `content-available: 1` is set in notification
3. Ensure app has background refresh enabled in iOS Settings
4. Test on physical device (background fetch doesn't work reliably in simulator)

---

## Part 7: Production Checklist

Before going to production:

- [ ] APNs authentication key created and downloaded
- [ ] Key ID and Team ID noted
- [ ] Push Notifications capability enabled in Xcode
- [ ] Background Modes capability enabled in Xcode
- [ ] Device token registration implemented
- [ ] Silent notification handler implemented
- [ ] HealthKit sync on notification implemented
- [ ] APNs key encoded to base64
- [ ] All environment variables set in Railway
- [ ] Backend redeployed with APNs configuration
- [ ] Device token registration tested
- [ ] Silent notification delivery tested
- [ ] Background sync tested
- [ ] Cron job tested
- [ ] Error handling tested
- [ ] Production APNs endpoint verified

---

## Part 8: Security Best Practices

### Protect APNs Key

1. **Never commit to version control**
   - Add `.p8` files to `.gitignore`
   - Never commit environment variables with keys

2. **Limit access**
   - Only authorized team members should have access
   - Use Railway's team permissions

3. **Rotate keys periodically**
   - Generate new key annually
   - Update environment variables
   - Redeploy backend

### Validate Device Tokens

1. **Handle invalid tokens**
   - Backend automatically disables push for invalid tokens
   - Implement re-registration flow in app

2. **Verify token ownership**
   - Associate tokens with authenticated users
   - Prevent token hijacking

---

## Part 9: Monitoring and Maintenance

### Monitor APNs Performance

Track the following metrics:
- Notification send success rate
- Notification delivery rate
- Background sync success rate
- Invalid token rate

### Set Up Alerts

Create alerts for:
- 3+ consecutive APNs failures
- High invalid token rate (>5%)
- Cron job not executing
- Background sync failures

### Regular Maintenance

- Review APNs logs weekly
- Update device tokens as needed
- Rotate APNs key annually
- Test notification delivery monthly

---

## Resources

- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
- [APNs Provider API](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [node-apn Library Documentation](https://github.com/node-apn/node-apn)
- [Background Execution in iOS](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)

---

## Support

For issues with:
- **APNs Setup**: Check Apple Developer Portal documentation
- **iOS Implementation**: Review Apple's UserNotifications framework docs
- **Backend Integration**: Check Railway logs and node-apn documentation
- **Testing**: Use Apple's Push Notification Console for testing
