#!/bin/bash

echo "🔍 Verifying React Native App Setup"
echo "=================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js first:"
    echo "1. Install Xcode Command Line Tools: xcode-select --install"
    echo "2. Install Node.js: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "3. Restart terminal and run: nvm install node"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."

cd mobile
if [ ! -d "node_modules" ]; then
    echo "📥 Installing mobile dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install mobile dependencies"
        exit 1
    fi
fi

echo "✅ Mobile dependencies installed"

cd ../server
if [ ! -d "node_modules" ]; then
    echo "📥 Installing server dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install server dependencies"
        exit 1
    fi
fi

echo "✅ Server dependencies installed"

# Create .env files if they don't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Server .env file created"
fi

cd ../mobile
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Mobile .env file created"
fi

echo ""
echo "🚀 Starting verification process..."
echo ""

# Start server in background
echo "🔧 Starting server..."
cd ../server
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test server
echo "🌐 Testing server..."
curl -s http://localhost:3000 > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running on http://localhost:3000"
    
    # Test API endpoint
    curl -s http://localhost:3000/health > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Health API endpoint is working"
    else
        echo "❌ Health API endpoint failed"
    fi
else
    echo "❌ Server failed to start"
fi

# Test mobile app compilation
echo ""
echo "📱 Testing mobile app compilation..."
cd ../mobile
npx expo start --no-dev --minify &
EXPO_PID=$!

# Wait a bit for Expo to start
sleep 10

# Check if Expo started
if ps -p $EXPO_PID > /dev/null; then
    echo "✅ Expo started successfully"
    echo "📲 To test in iOS simulator:"
    echo "   1. Keep this terminal open"
    echo "   2. Open new terminal"
    echo "   3. Run: cd mobile && npx expo start"
    echo "   4. Press 'i' to open iOS simulator"
    echo ""
    echo "🔗 App will connect to: http://localhost:3000"
else
    echo "❌ Expo failed to start"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null
kill $EXPO_PID 2>/dev/null

echo ""
echo "✨ Verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start server: cd server && npm run dev"
echo "2. Start mobile: cd mobile && npx expo start"
echo "3. Press 'i' for iOS simulator"
echo "4. Test the app functionality"
