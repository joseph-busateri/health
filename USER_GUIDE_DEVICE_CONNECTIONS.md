# User Guide: Connecting Health Devices

## Overview
This guide walks you through connecting your health devices (Oura Ring, Apple Watch, and Sleep Number bed) to the Health Performance Agent app for automatic health data synchronization.

---

## Table of Contents
1. [Oura Ring Connection](#oura-ring-connection)
2. [Apple Watch Connection](#apple-watch-connection)
3. [Sleep Number Bed Connection](#sleep-number-bed-connection)
4. [Managing Your Connections](#managing-your-connections)
5. [Troubleshooting](#troubleshooting)

---

## Oura Ring Connection

### Prerequisites
- Oura Ring Gen 3 (Horizon or Heritage)
- Active Oura subscription
- Oura mobile app installed and set up
- Internet connection

### Step-by-Step Instructions

#### 1. Navigate to Oura Connection Screen
- Open the Health Performance Agent app
- Tap on **Settings** or **Devices**
- Select **Oura Ring**

#### 2. Initiate Connection
- Tap **Connect Oura Ring** button
- You'll be redirected to Oura's authorization page in your browser

#### 3. Authorize Access
- **Log in** to your Oura account (if not already logged in)
- Review the permissions requested:
  - Daily activity data
  - Sleep data
  - Readiness scores
  - Personal information
- Tap **Authorize** to grant access

#### 4. Return to App
- You'll be automatically redirected back to the app
- A success message will appear
- Your Oura Ring is now connected!

#### 5. Verify Connection
- Check that connection status shows **Connected**
- View your latest readiness score
- See your sync statistics

### What Gets Synced
- **Daily Readiness Score**: Overall recovery and readiness
- **Sleep Data**: Sleep stages, duration, efficiency
- **Activity Data**: Steps, calories, activity score
- **Heart Rate**: Resting heart rate, HRV
- **Body Temperature**: Nightly temperature trends
- **Respiratory Rate**: Breathing rate during sleep

### Sync Schedule
- **Automatic Sync**: Every day at 6 AM UTC
- **Manual Sync**: Tap "Sync Now" button anytime
- **Data Range**: Last 30 days on initial connection, then daily updates

---

## Apple Watch Connection

### Prerequisites
- Apple Watch Series 4 or newer
- iPhone with iOS 14 or newer
- Apple Watch paired with iPhone
- HealthKit data available
- Internet connection

### Step-by-Step Instructions

#### 1. Navigate to Apple Watch Connection Screen
- Open the Health Performance Agent app
- Tap on **Settings** or **Devices**
- Select **Apple Watch**

#### 2. Grant HealthKit Permissions
- Tap **Connect Apple Watch** button
- iOS will show HealthKit permission dialog
- Review the data types requested:
  - Heart Rate
  - Heart Rate Variability (HRV)
  - Activity (steps, calories, exercise)
  - Sleep Analysis
  - Workouts
  - Blood Oxygen
  - Respiratory Rate
- Tap **Allow** for each data type you want to share

#### 3. Grant Notification Permissions
- iOS will ask for notification permissions
- Tap **Allow** to enable automatic background sync
- This allows the app to sync data in the background

#### 4. Initial Sync
- The app will immediately sync your last 7 days of data
- This may take 1-2 minutes
- A progress indicator will show sync status

#### 5. Verify Connection
- Check that connection status shows **Connected**
- View your activity rings for today
- See your latest heart rate and HRV data

### What Gets Synced
- **Heart Rate**: Resting, walking average, real-time samples
- **HRV**: Heart rate variability (SDNN)
- **Activity Rings**: Move, Exercise, Stand goals and progress
- **Steps**: Daily step count
- **Active Energy**: Calories burned during activity
- **Workouts**: Type, duration, distance, heart rate zones
- **Sleep**: Duration, stages (if available), efficiency
- **Blood Oxygen**: SpO2 readings (if available)
- **Respiratory Rate**: Breaths per minute

### Sync Schedule
- **Automatic Sync**: Every day at 6 AM UTC via silent push notification
- **Manual Sync**: Tap "Sync Now" button anytime
- **Background Sync**: Triggered by push notifications
- **Data Range**: Last 7 days on initial connection, then daily updates

### Important Notes
- **Battery Impact**: Minimal - sync happens once daily
- **Privacy**: All data is encrypted and stored securely
- **HealthKit**: Data is read from HealthKit, never written to it
- **Notifications**: Silent notifications don't disturb you

---

## Sleep Number Bed Connection

### Prerequisites
- Sleep Number 360 Smart Bed or newer
- Active Sleep Number account
- Sleep Number app installed and set up
- Internet connection

### Step-by-Step Instructions

#### 1. Navigate to Sleep Number Connection Screen
- Open the Health Performance Agent app
- Tap on **Settings** or **Devices**
- Select **Sleep Number Bed**

#### 2. Enter Sleep Number Credentials
- Tap **Connect Sleep Number** button
- Enter your Sleep Number account email
- Enter your Sleep Number account password
- Tap **Connect**

#### 3. Verify Connection
- Wait for connection verification (5-10 seconds)
- Success message will appear
- Connection status shows **Connected**

#### 4. Initial Sync
- The app will sync your last 30 days of sleep data
- This may take 1-2 minutes
- A progress indicator will show sync status

#### 5. View Sleep Data
- See your latest sleep score
- View sleep duration and quality
- Check heart rate and breathing rate during sleep

### What Gets Synced
- **Sleep Score**: Overall sleep quality score (0-100)
- **Sleep Duration**: Total time in bed and asleep
- **Sleep Stages**: Light, deep, REM sleep percentages
- **Heart Rate**: Average and trends during sleep
- **Breathing Rate**: Respiratory rate during sleep
- **Restlessness**: Movement and restlessness score
- **Time to Fall Asleep**: Sleep onset latency
- **Time Out of Bed**: Bathroom trips and wake time

### Sync Schedule
- **Automatic Sync**: Every day at 6 AM UTC
- **Manual Sync**: Tap "Sync Now" button anytime
- **Data Range**: Last 30 days on initial connection, then daily updates

### Important Notes
- **Credentials**: Stored securely and encrypted
- **Privacy**: Your Sleep Number password is never logged or exposed
- **Bed Settings**: Connection doesn't change your bed settings
- **Multiple Sleepers**: Syncs data for the primary account holder

---

## Managing Your Connections

### Viewing Connection Status

**Check All Devices:**
- Go to **Settings** > **Connected Devices**
- See status of all connected devices
- View last sync time for each device

**Connection Status Indicators:**
- 🟢 **Connected**: Device is connected and syncing
- 🟡 **Syncing**: Sync in progress
- 🔴 **Error**: Sync failed, needs attention
- ⚪ **Not Connected**: Device not connected

### Manual Sync

**Trigger Sync for Any Device:**
1. Open the device connection screen
2. Tap **Sync Now** button
3. Wait for sync to complete (10-60 seconds)
4. View updated data

**When to Manual Sync:**
- After a workout or activity
- Before checking your daily plan
- When you want the latest data
- If automatic sync failed

### Auto-Sync Settings

**Enable/Disable Auto-Sync:**
1. Open device connection screen
2. Find **Automatic Sync** toggle
3. Turn ON for daily automatic sync at 6 AM UTC
4. Turn OFF to sync manually only

**Recommended Setting:** Keep auto-sync ON for all devices

### Disconnecting Devices

**To Disconnect a Device:**
1. Open the device connection screen
2. Scroll to bottom
3. Tap **Disconnect [Device Name]**
4. Confirm disconnection
5. Device is now disconnected

**What Happens When You Disconnect:**
- Automatic sync stops
- Historical data remains in the app
- You can reconnect anytime
- No data is deleted from the device

### Reconnecting Devices

**To Reconnect a Device:**
1. Open the device connection screen
2. Tap **Connect [Device Name]**
3. Follow the connection steps again
4. Previous data is preserved

---

## Troubleshooting

### Oura Ring Issues

#### Issue: "Authorization Failed"
**Possible Causes:**
- Incorrect Oura login credentials
- Network connection issue
- Oura service temporarily unavailable

**Solutions:**
1. Verify your Oura login credentials
2. Check internet connection
3. Try again in a few minutes
4. Restart the app and try again

#### Issue: "No Data Syncing"
**Possible Causes:**
- Oura Ring not synced with Oura app
- Auto-sync disabled
- Connection expired

**Solutions:**
1. Open Oura app and sync your ring
2. Check auto-sync is enabled in settings
3. Try manual sync
4. Disconnect and reconnect if issue persists

---

### Apple Watch Issues

#### Issue: "HealthKit Not Available"
**Possible Causes:**
- Running on Android device
- HealthKit disabled in iOS settings
- App doesn't have HealthKit permissions

**Solutions:**
1. Ensure you're using an iPhone (HealthKit is iOS-only)
2. Go to iPhone Settings > Privacy > Health > [App Name]
3. Enable all required permissions
4. Restart the app

#### Issue: "No Activity Rings Data"
**Possible Causes:**
- Apple Watch not worn today
- HealthKit permissions not granted
- Data not yet available

**Solutions:**
1. Wear your Apple Watch for a few hours
2. Check HealthKit permissions
3. Try manual sync
4. Wait until end of day for complete data

#### Issue: "Background Sync Not Working"
**Possible Causes:**
- Notifications disabled
- Background App Refresh disabled
- Low Power Mode enabled

**Solutions:**
1. Enable notifications for the app
2. Settings > General > Background App Refresh > Enable for app
3. Disable Low Power Mode temporarily
4. Restart iPhone

---

### Sleep Number Issues

#### Issue: "Login Failed"
**Possible Causes:**
- Incorrect email or password
- Sleep Number account locked
- Network connection issue

**Solutions:**
1. Verify email and password in Sleep Number app
2. Reset password if needed at sleepnumber.com
3. Check internet connection
4. Contact Sleep Number support if account is locked

#### Issue: "No Sleep Data"
**Possible Causes:**
- Haven't slept on bed yet
- Bed not connected to WiFi
- Sleep Number app not synced

**Solutions:**
1. Ensure bed is connected to WiFi
2. Open Sleep Number app and sync
3. Wait until morning after sleeping
4. Try manual sync in our app

---

### General Issues

#### Issue: "Sync Taking Too Long"
**Normal Sync Times:**
- Oura Ring: 10-30 seconds
- Apple Watch: 30-60 seconds
- Sleep Number: 20-40 seconds

**If Taking Longer:**
1. Check internet connection speed
2. Close and reopen the app
3. Try manual sync again
4. Contact support if consistently slow

#### Issue: "Data Not Updating"
**Solutions:**
1. Check device connection status
2. Verify auto-sync is enabled
3. Try manual sync
4. Check last sync time
5. Disconnect and reconnect device

#### Issue: "App Crashes When Connecting"
**Solutions:**
1. Update app to latest version
2. Restart your phone
3. Clear app cache (if option available)
4. Reinstall the app
5. Contact support with crash details

---

## Best Practices

### For Optimal Data Quality

**Oura Ring:**
- Wear ring 24/7 for best data
- Sync Oura app daily
- Keep ring charged
- Ensure proper ring fit

**Apple Watch:**
- Wear watch during workouts
- Wear watch while sleeping (if tracking sleep)
- Keep watch charged
- Update watchOS regularly

**Sleep Number Bed:**
- Sleep on bed every night
- Keep bed connected to WiFi
- Update bed firmware when available
- Ensure proper bed setup

### For Reliable Syncing

1. **Keep Auto-Sync Enabled**: Let the app sync automatically
2. **Stable Internet**: Ensure good WiFi or cellular connection
3. **Update Apps**: Keep all apps updated to latest versions
4. **Manual Sync**: Use manual sync after important activities
5. **Check Status**: Review connection status weekly

---

## Privacy and Security

### Your Data is Protected

- **Encryption**: All data encrypted in transit and at rest
- **Secure Storage**: Credentials stored with AES-256 encryption
- **No Sharing**: Your health data is never shared with third parties
- **You Control**: You can disconnect and delete data anytime

### What We Access

- **Oura**: Only data you authorize (sleep, activity, readiness)
- **Apple Watch**: Only HealthKit data types you approve
- **Sleep Number**: Only sleep data from your account

### What We Don't Access

- **Oura**: Payment information, personal messages
- **Apple Watch**: Contacts, photos, location (unless needed for workouts)
- **Sleep Number**: Bed settings, account billing information

---

## Getting Help

### In-App Support
- Go to **Settings** > **Help & Support**
- View FAQs and troubleshooting guides
- Contact support team

### Device-Specific Support
- **Oura**: support@ouraring.com
- **Apple**: support.apple.com/watch
- **Sleep Number**: 1-800-SLEEPNUMBER

### App Support
- Email: support@healthperformanceagent.com
- In-app chat: Available 9 AM - 5 PM EST
- Help Center: help.healthperformanceagent.com

---

## Frequently Asked Questions

**Q: Can I connect multiple devices of the same type?**
A: Currently, one device per type is supported. Future updates may support multiple devices.

**Q: Will connecting devices drain my phone battery?**
A: No, the app uses minimal battery. Syncs happen once daily and take less than a minute.

**Q: Can I use the app without connecting devices?**
A: Yes! You can manually log your health data without connecting devices.

**Q: Is my data backed up?**
A: Yes, all data is securely backed up in the cloud.

**Q: Can I export my data?**
A: Yes, go to Settings > Data Export to download your data.

**Q: What happens if I get a new device?**
A: Simply disconnect the old device and connect the new one. Historical data is preserved.

**Q: Do I need to keep device apps installed?**
A: For Oura and Sleep Number, yes. For Apple Watch, HealthKit handles the data.

**Q: Can I temporarily pause syncing?**
A: Yes, disable auto-sync in device settings. Re-enable when ready.

---

**Last Updated**: April 2026  
**Version**: 2.0
