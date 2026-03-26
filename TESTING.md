# Testing Guide

## Environment Setup Required

Before testing, you need to install the development environment:

### 1. Install Xcode Command Line Tools
```bash
xcode-select --install
```
*Complete the installation dialog that appears*

### 2. Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Restart terminal
nvm install node
nvm use node

# OR using Homebrew (if you have it)
brew install node
```

### 3. Install Expo CLI
```bash
npm install -g @expo/cli
```

## Verification Steps

### Quick Verification
```bash
./verify.sh
```

### Manual Testing

#### 1. Start the Backend Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
*Expected output: Server running on http://localhost:3000*

#### 2. Test Backend API
```bash
# Test root endpoint
curl http://localhost:3000

# Test health endpoint
curl http://localhost:3000/health

# Test specific health item
curl http://localhost:3000/health/1
```

#### 3. Start the Mobile App
```bash
cd mobile
npm install
cp .env.example .env
npx expo start
```

#### 4. Launch iOS Simulator
- Press `i` when Expo starts
- OR run: `npx expo start --ios`

## Expected App Behavior

### Home Screen
- Display "Health Dashboard" title
- Show 4 health metric cards:
  - Heart Rate (72 bpm)
  - Blood Pressure (120 mmHg) 
  - Steps Today (8,432 steps)
  - Sleep Quality (85%)
- Loading states and error handling

### Navigation
- Tap any card to navigate to details screen
- Back button returns to home screen

### Details Screen
- Show metric title and description
- Display current value prominently
- Show 5-day history chart
- Display 3 recommendations
- Proper loading and error states

### API Integration
- App fetches data from http://localhost:3000
- Console logs show API requests/responses
- Error handling displays user-friendly messages

## Troubleshooting

### Common Issues

#### "Node.js not found"
```bash
# Check installation
node --version
npm --version

# Reinstall if needed
nvm install node
```

#### "iOS Simulator not opening"
```bash
# Check Xcode tools
xcode-select --print-path

# Install if missing
sudo xcode-select --install
```

#### "Network request failed"
- Ensure backend server is running on port 3000
- Check that .env files are created
- Verify API URL in mobile/src/services/api.ts

#### "Metro bundler issues"
```bash
cd mobile
npx expo start --clear
```

### Debug Commands

#### Backend Debugging
```bash
cd server
npm run dev
# Check console for server logs
```

#### Mobile Debugging
```bash
cd mobile
npx expo start
# Press 'd' for debug menu
# Shake device in simulator for debug menu
```

## Performance Testing

### API Response Times
- Health list: < 100ms
- Health details: < 50ms

### App Performance
- App launch: < 3 seconds
- Screen navigation: < 500ms
- Data loading: < 2 seconds

## Test Checklist

- [ ] Environment setup complete
- [ ] Backend server starts successfully
- [ ] API endpoints return correct data
- [ ] Mobile app compiles without errors
- [ ] iOS Simulator launches
- [ ] Home screen displays correctly
- [ ] Navigation works between screens
- [ ] API integration functions properly
- [ ] Error handling works
- [ ] Performance is acceptable
