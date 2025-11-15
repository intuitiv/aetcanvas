#!/bin/bash
set -e

# =============================================================
# 🚀 iOS Standalone Deployment Script (for aetcanvas)
# Compatible with macOS + Xcode. Designed for local dev install.
# =============================================================

APP_SCHEME="aetcanvas" # fixed scheme
DEVICE_NAME="$1"

echo "🚀 Starting iOS standalone deployment (guided mode)..."

# --- Detect connected device ---
if [ -n "$DEVICE_NAME" ]; then
  echo "📱 Using provided device: $DEVICE_NAME"
else
  echo "🔌 Detecting connected iPhone..."
  DEVICE_NAME=$(xcrun xctrace list devices 2>/dev/null | grep -m1 "iPhone" | sed 's/ (.*//')
  if [ -z "$DEVICE_NAME" ]; then
    echo "⚠️ No connected iPhone detected."
    echo "👉 Please connect your iPhone via USB and ensure it is trusted."
    read -p "Press [Enter] once the device appears in Xcode → Devices and Simulators..."
    DEVICE_NAME=$(xcrun xctrace list devices 2>/dev/null | grep -m1 "iPhone" | sed 's/ (.*//')
    if [ -z "$DEVICE_NAME" ]; then
      echo "❌ Still no device detected. Aborting."
      exit 1
    fi
  fi
fi
echo "📱 Target device: $DEVICE_NAME"

# --- Detect app name ---
if [ -f "app.json" ]; then
  APP_NAME=$(jq -r '.expo.name // empty' app.json 2>/dev/null)
elif [ -f "package.json" ]; then
  APP_NAME=$(jq -r '.name // empty' package.json 2>/dev/null)
fi
APP_NAME=${APP_NAME:-aetcanvas}
APP_NAME_CLEAN=$(echo "$APP_NAME" | tr -d '"')
echo "🧩 App name: $APP_NAME_CLEAN"

# --- Detect workspace/project ---
WORKSPACE_PATH=$(find ios -maxdepth 1 -name "*.xcworkspace" | head -n 1)
if [ -z "$WORKSPACE_PATH" ]; then
  PROJECT_PATH=$(find ios -maxdepth 1 -name "*.xcodeproj" | head -n 1)
  if [ -z "$PROJECT_PATH" ]; then
    echo "❌ No Xcode workspace or project found in ios/"
    exit 1
  fi
  WORKSPACE_PATH="$PROJECT_PATH/project.xcworkspace"
fi
echo "🧱 Workspace: $WORKSPACE_PATH"

# --- Clean & prepare paths ---
ARCHIVE_PATH="ios/build/${APP_NAME_CLEAN}.xcarchive"
EXPORT_PATH="ios/build/export"
IPA_PATH="${EXPORT_PATH}/${APP_NAME_CLEAN}.ipa"
EXPORT_OPTIONS_PLIST="ios/exportOptions.plist"
rm -rf ios/build
mkdir -p ios/build

# --- Build & archive ---
echo "🛠️ Archiving app (Release)..."
xcodebuild \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$APP_SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  clean archive CODE_SIGN_STYLE=Automatic \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration || {
    echo "⚠️ Build/Archive failed."
    echo "👉 Open Xcode manually and run Product → Archive."
    read -p "Once Archive completes successfully, press [Enter] to continue..."
  }

# --- Ensure archive exists ---
if [ ! -d "$ARCHIVE_PATH" ]; then
  echo "⚠️ No archive found at $ARCHIVE_PATH"
  echo "👉 Please locate the .xcarchive file in Xcode Organizer."
  read -p "Once you have the correct path, enter it here: " ARCHIVE_PATH
fi
echo "✅ Archive located: $ARCHIVE_PATH"

# --- Create export options plist ---
cat > "$EXPORT_OPTIONS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>development</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
EOF

# --- Export IPA ---
echo "📦 Exporting IPA..."
if xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates \
  -allowProvisioningDeviceRegistration; then
  echo "✅ IPA successfully exported to $EXPORT_PATH"
else
  echo "⚠️ IPA export failed — likely due to provisioning or signing."
  echo "👉 Open Xcode → Window → Organizer → Archives"
  echo "   → Select your archive → Distribute App → Development → Export"
  echo "   → Choose export location: $EXPORT_PATH"
  read -p "Press [Enter] once you manually export the IPA..."
fi

# --- Locate IPA file ---
if [ ! -f "$IPA_PATH" ]; then
  IPA_PATH=$(find ios/build -name "*.ipa" | head -n 1)
  if [ -z "$IPA_PATH" ]; then
    echo "❌ IPA not found. Please provide path manually:"
    read -p "Path to IPA file: " IPA_PATH
  fi
fi
echo "✅ IPA ready: $IPA_PATH"

# --- Detect connected device (Name + UDID) ---
echo "🔍 Detecting connected iPhone..."

RAW_DEVICE_LINE=$(xcrun xctrace list devices 2>/dev/null | grep "(0000" -m1)

if [ -z "$RAW_DEVICE_LINE" ]; then
  echo "❌ No iPhone detected. Connect your device and trust this Mac."
  exit 1
fi

# Extract Device Name (before the first parenthesis)
DEVICE_NAME=$(echo "$RAW_DEVICE_LINE" | sed -E 's/^(.*) \(.*/\1/' | sed 's/[[:space:]]*$//')

# Extract UDID (the long hex inside parentheses)
DEVICE_UDID=$(echo "$RAW_DEVICE_LINE" | sed -n 's/.*(\([A-F0-9\-]*\)).*/\1/p')

echo "📱 Detected device:"
echo "   Name : $DEVICE_NAME"
echo "   UDID : $DEVICE_UDID"

echo ""
echo "📲 Ready to install IPA on:"
echo "   $DEVICE_NAME ($DEVICE_UDID)"
echo ""
echo "👉 Ensure your iPhone is:"
echo "   - Unlocked"
echo "   - Developer Mode enabled"
echo "   - Trusted with this Mac"
read -p "Press [Enter] to install using ios-deploy..."

# --- Install using ios-deploy ---
if command -v ios-deploy &>/dev/null; then
  echo "📦 Installing IPA using ios-deploy..."
  ios-deploy --bundle "$IPA_PATH" --id "$DEVICE_UDID" || {
    echo "⚠️ ios-deploy failed."
    echo "👉 You can manually install via Finder:"
    echo "   Drag & drop the IPA onto your device in Finder → Devices."
  }
else
  echo "⚠️ ios-deploy not installed."
  echo "👉 To install:"
  echo "   npm i -g ios-deploy"
  read -p "Press [Enter] once installed to retry..."
  ios-deploy --bundle "$IPA_PATH" --id "$DEVICE_UDID" || {
    echo "⚠️ If still failing: manually drag the IPA into Finder device list."
  }
fi

echo "🎉 Done! Installed on $DEVICE_NAME ($DEVICE_UDID)"
