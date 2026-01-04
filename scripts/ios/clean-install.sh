#!/bin/bash
set -e

echo "🧹 [1/6] Cleaning Watchman..."
watchman watch-del-all 2>/dev/null || true

echo "🧹 [2/6] Cleaning Metro & Haste cache..."
rm -rf $TMPDIR/metro-* $TMPDIR/haste-*

echo "🧹 [3/6] Cleaning Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData

echo "🧹 [4/6] Cleaning project artifacts (node_modules, ios/build)..."
rm -rf node_modules package-lock.json ios/build ios/Pods

echo "📥 [5/6] Installing NPM Dependencies..."
npm install --legacy-peer-deps

echo "🏗️ [6/6] Regenerating iOS Project (Prebuild)..."
npx expo prebuild --platform ios --clean

echo "✅ Deep Clean & Setup Complete."
