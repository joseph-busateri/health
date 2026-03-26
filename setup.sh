#!/bin/bash

echo "Setting up full-stack mobile app..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first:"
    echo "1. Install Xcode Command Line Tools (should be done)"
    echo "2. Install Node.js via Homebrew: brew install node"
    echo "3. Or install via nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Setup mobile app
echo "Setting up mobile app..."
cd mobile
npm install

# Setup server
echo "Setting up server..."
cd ../server
npm install

# Create .env files
echo "Creating environment files..."
cp .env.example .env
cd ../mobile
cp .env.example .env

echo "Setup complete!"
echo ""
echo "To run the app:"
echo "1. Start the server: cd server && npm run dev"
echo "2. Start the mobile app: cd mobile && npm start"
echo "3. Press 'i' to open iOS simulator"
