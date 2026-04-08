
## Structure
- `/mobile` - React Native Expo app with TypeScript
- `/server` - Node.js Express API with TypeScript

## Prerequisites
1. Install Xcode Command Line Tools (should be done automatically)
2. Install Node.js:
   ```bash
   # Via Homebrew (recommended)
   brew install node
   
   # Or via nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install node
   ```

## Quick Setup
```bash
./setup.sh
```
### Server Setup
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
cd server
npm run dev

### Mobile App Setup
```bash
cd mobile
npm install
cp .env.example .env
npm start
```
cd mobile
npm start

## Running the App
1. Start the server: `cd server && npm run dev`
2. Start the mobile app: `cd mobile && npm start`
3. Press 'i' to open iOS simulator
4. Press 'a' to open Android emulator


# 1. Check current branch
git branch

# 2. Stage all changes
git add .

# 3. Commit changes
git commit -m "UI/UX improvements: design system, components, and human-centered design enhancements"

# 4. Push to aprilsix-update branch (force replace)
git push origin HEAD:aprilsix-update --force

# Or if you need to create the branch first:
git checkout -b aprilsix-update
git push origin aprilsix-update --force
