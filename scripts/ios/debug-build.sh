#!/bin/bash
set -e

echo "🧩 Checking iOS build environment for Kilocanvas"
cd ios

# --- 1️⃣ Detect where the React Native bundling script comes from ---
echo ""
echo "🔍 react-native-xcode.sh location:"
grep -R "react-native-xcode.sh" *.xcodeproj | head -n 3 || echo "❌ Not found"

# --- 2️⃣ Resolve the ENTRY_FILE the same way Expo's build phase does ---
echo ""
echo "🔍 Testing Expo entry resolution:"
NODE_BINARY=$(which node)
PROJECT_ROOT=$(pwd)/..
ENTRY_FILE_OUTPUT=$($NODE_BINARY -e "require('expo/scripts/resolveAppEntry')" "$PROJECT_ROOT" ios absolute || echo "FAILED")
echo "➡ ENTRY_FILE resolved to: $ENTRY_FILE_OUTPUT"

# --- 3️⃣ Print key Expo + React Native environment variables ---
echo ""
echo "🔍 Key environment variables:"
echo "NODE_BINARY=$NODE_BINARY"
echo "PROJECT_ROOT=$PROJECT_ROOT"
echo "REACT_NATIVE_PATH=$(dirname $(dirname $(realpath $(which react-native))))"
echo "REACT_NATIVE_VERSION=$(npx react-native --version)"
echo "EXPO_VERSION=$(npx expo --version || echo 'expo cli not found')"

# --- 4️⃣ Simulate how Xcode's bundling script runs ---
echo ""
echo "🔧 Simulating Xcode bundling command (dry run):"
echo "----------------------------------------------"
cat <<'EOF'
"$NODE_BINARY" --print "require('path').dirname(require.resolve('react-native/package.json')) + '/scripts/react-native-xcode.sh'"
EOF
echo "----------------------------------------------"

# --- 5️⃣ Check if a main.jsbundle already exists (after a real build) ---
echo ""
if [ -f "build/Kilocanvas.xcarchive/Products/Applications/Kilocanvas.app/main.jsbundle" ]; then
  echo "✅ Found main.jsbundle in archive."
else
  echo "⚠️ main.jsbundle not found in archive."
fi

# --- 6️⃣ Print summary ---
echo ""
echo "✅ Diagnostic summary complete."
echo "If ENTRY_FILE is valid and react-native-xcode.sh exists, bundling should succeed automatically in Xcode."
