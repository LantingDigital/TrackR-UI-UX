# Physical Device Testing Setup

Testing on a physical iPhone is essential for validating animation performance (60fps), haptic feedback, and real-world touch responsiveness. The iOS Simulator does not accurately represent animation performance.

---

## Prerequisites

- **Xcode** installed (latest stable version)
- **Apple ID** (free tier is sufficient for development)
- **iPhone** connected via USB (or on same Wi-Fi for wireless debugging)
- **Expo SDK 54** project with native modules (requires dev client, not Expo Go)

---

## Method 1: Expo Prebuild + Xcode

This is the recommended approach for full native testing.

### Steps

1. **Generate native project**:
   ```bash
   npx expo prebuild --clean
   ```
   This creates the `ios/` directory with an Xcode workspace.

2. **Open in Xcode**:
   ```bash
   open ios/*.xcworkspace
   ```
   Always open the `.xcworkspace`, not the `.xcodeproj`.

3. **Configure signing**:
   - In Xcode, select the project in the navigator
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Add your Apple ID under "Team" (Xcode > Settings > Accounts > Add)
   - Select "Personal Team"

4. **Connect device**:
   - Plug in your iPhone via USB
   - Trust the computer on the device if prompted
   - Select your device as the build target in Xcode's toolbar

5. **Trust developer profile on device**:
   - On your iPhone: Settings > General > VPN & Device Management
   - Tap your developer profile
   - Tap "Trust"

6. **Build and run**:
   - Press Cmd+R in Xcode or click the Play button
   - First build takes several minutes
   - App will launch on device

### Provisioning Notes
- Free Apple ID provisioning profiles are valid for **7 days**
- After 7 days, you need to re-build from Xcode to refresh
- Maximum 3 apps can be installed with free provisioning at a time

---

## Method 2: Expo Run (Faster Iteration)

For quicker device builds without opening Xcode:

```bash
npx expo run:ios --device
```

This will:
- List connected devices
- Build the native project
- Install and launch on the selected device

---

## Method 3: Development Build (EAS)

For team distribution:

```bash
eas build --profile development --platform ios
```

This creates a development build that can be installed via QR code. Requires an Expo account and EAS CLI setup.

---

## Testing on Public WiFi (USB Network Bridge)

When on public WiFi (coffee shops, airports, etc.), the network blocks device-to-device communication. This sets up a direct USB network link between your Mac and iPhone so Metro can serve the app without relying on WiFi.

### Setup

1. **Enable Internet Sharing**:
   - System Settings → General → Sharing
   - Click the `ⓘ` next to **Internet Sharing**
   - "Share your connection from:" → **Wi-Fi**
   - "To computers using:" → check **iPhone USB** (if two identical entries appear, check both)
   - Toggle Internet Sharing **ON** and confirm

2. **Find the USB bridge IP**:
   ```bash
   ifconfig | grep -E "^bridge|inet " | grep -B1 "192.168"
   ```
   Look for a bridge interface (e.g. `bridge101`) with an IP like `192.168.2.1`.

3. **Build and deploy using the bridge IP**:
   ```bash
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.2.1 npx expo run:ios --device "YOUR_DEVICE_NAME"
   ```
   Find your device name with: `xcrun devicectl list devices`

4. **Force-quit the app** on your phone if it was already running, then let the build install and auto-launch.

### Restarting Metro Without Rebuilding

If you only need to restart Metro (no native code changes):
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.2.1 npx expo start --dev-client --port 8081
```
Force-quit and reopen the app on your phone.

### Switching Back to Private WiFi

No special setup needed. Run normally:
```bash
npx expo start --dev-client
```
The app auto-discovers Metro on your local network. Internet Sharing can stay on or be turned off.

### Quick Reference

| Scenario | Command |
|----------|---------|
| **Public WiFi (USB)** | `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.2.1 npx expo run:ios --device "DeviceName"` |
| **Private WiFi** | `npx expo start --dev-client` |
| **Rebuild on private WiFi** | `npx expo run:ios --device "DeviceName"` |

### Public WiFi Troubleshooting

**"No script URL provided" error** — App can't reach Metro:
- Verify Internet Sharing is ON
- Check bridge interface has an IP: `ifconfig | grep -B1 "192.168"`
- Ensure you used `REACT_NATIVE_PACKAGER_HOSTNAME=<bridge_ip>` in the build command

**Bridge IP didn't appear**:
- Toggle Internet Sharing OFF and back ON
- Unplug and re-plug the USB cable
- Check both "iPhone USB" options if duplicates exist

---

## General Troubleshooting

### "Untrusted Developer"
Go to Settings > General > VPN & Device Management on the device and trust your developer certificate.

### Build fails with signing error
Ensure "Automatically manage signing" is checked and a valid team is selected. Delete the `ios/` folder and re-run `npx expo prebuild --clean` if signing gets corrupted.

### Device not appearing in Xcode
- Ensure USB cable supports data (not charge-only)
- Trust the computer on the device
- Restart Xcode
- Try a different USB port

### App crashes on launch
Check Xcode console for error output. Common causes:
- Missing native module (run `npx expo prebuild --clean`)
- Provisioning profile expired (re-build from Xcode)
