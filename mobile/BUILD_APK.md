# Android APK Build Guide - Quick Deploy

## Build APK in 5 Minutes

### Option 1: EAS Build (Recommended - Cloud Build)

```powershell
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
cd c:\projects\school-website\mobile
npx eas login

# Build APK (takes 5-10 min, builds in cloud)
npx eas build -p android --profile preview
```

### Option 2: Local Build (Requires Android Studio)

```powershell
cd c:\projects\school-website\mobile

# Create Android folder
npx expo prebuild -p android

# Build APK
cd android
.\gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/
```

## Update API URL for Production

Edit `mobile/services/api.ts`:
```typescript
const API_BASE_URL = 'https://jesus-junior-academy.railway.app';
```

## Test on Device

```powershell
# Start Expo dev server
cd c:\projects\school-website\mobile
npm run android
```

Scan QR code with **Expo Go** app on your phone.
