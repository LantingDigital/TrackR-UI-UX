#!/bin/bash
# TrackR - Re-sign and install helper
# Run this when your 7-day free signing profile expires

TRACKR_DIR="/Users/Lanting-Digital-LLC/Documents/ExecutiveAssistant/projects/trackr"
WORKSPACE="$TRACKR_DIR/ios/TrackR.xcworkspace"

cd "$TRACKR_DIR" || { echo "TrackR directory not found!"; exit 1; }

# Check if ios/ exists, prebuild if not
if [ ! -d "ios" ]; then
    echo "No ios/ directory found. Running expo prebuild..."
    npx expo prebuild --platform ios
fi

# Open Xcode workspace
if [ -d "$WORKSPACE" ]; then
    echo "Opening TrackR in Xcode..."
    open "$WORKSPACE"
else
    echo "ERROR: Workspace not found at $WORKSPACE"
    echo "Try running: npx expo prebuild --platform ios"
    exit 1
fi

echo ""
echo "========================================="
echo "  TrackR Re-sign Checklist"
echo "========================================="
echo ""
echo "  In Xcode (should be opening now):"
echo ""
echo "  1. Click 'TrackR' in the left sidebar (blue project icon)"
echo "  2. Select 'TrackR' under TARGETS"
echo "  3. Click 'Signing & Capabilities' tab"
echo "  4. Check 'Automatically manage signing'"
echo "  5. Set Team -> your Personal Team (Apple ID)"
echo "  6. Plug in your iPhone, select it in the top bar"
echo "  7. Press Cmd+R to build and install"
echo ""
echo "  On your iPhone after install:"
echo ""
echo "  8. Settings > General > VPN & Device Management"
echo "  9. Tap your Apple ID > Trust"
echo " 10. Open TrackR"
echo ""
echo "========================================="
echo ""
echo "  OR skip Xcode and run from terminal"
echo "  (only works if signing is already set):"
echo ""
echo "    npx expo run:ios --device"
echo ""
