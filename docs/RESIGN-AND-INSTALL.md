# Re-sign & Install TrackR on Your iPhone

Your free Apple ID signing profile expires every 7 days. When TrackR stops opening on your phone (you'll see "Untrusted Developer" or it just crashes on launch), follow these steps.

There's a helper script at the bottom that automates what it can.

---

## Quick Version (run the script)

```bash
cd /Users/Lanting-Digital-LLC/Documents/ExecutiveAssistant/projects/trackr
./docs/resign.sh
```

This will:
1. Open the Xcode workspace
2. Print the remaining manual steps

---

## Full Manual Steps

### Step 1: Open the project in Xcode

```bash
open ios/TrackR.xcworkspace
```

If the `ios/` folder doesn't exist (you deleted it or ran `npx expo prebuild --clean`):
```bash
npx expo prebuild --platform ios
open ios/TrackR.xcworkspace
```

### Step 2: Set your signing team

1. In Xcode, click **TrackR** in the left sidebar (the blue project icon at the top)
2. Select the **TrackR** target (under TARGETS, not the project)
3. Click the **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Set **Team** to your Personal Team (your Apple ID)
6. Bundle Identifier should be: `com.lantingdigital.trackr`

If you see a signing error, Xcode may need you to pick a slightly different bundle ID. You can append something unique like `com.lantingdigital.trackr.dev` -- it doesn't matter for dev builds.

### Step 3: Plug in your iPhone and select it

1. Plug your iPhone into your Mac with a cable
2. In the top toolbar, click the device dropdown (next to the play button)
3. Select your physical iPhone (NOT a simulator)
4. If this is the first time, your phone may ask you to **Trust This Computer** -- tap Trust

### Step 4: Build and run

Press **Cmd+R** or click the Play button in Xcode.

First build takes a few minutes. Subsequent builds are faster.

### Step 5: Trust the developer on your iPhone

After the first install (or after the profile expired), you need to re-trust:

1. On your iPhone: **Settings > General > VPN & Device Management**
2. Tap your Apple ID email under "Developer App"
3. Tap **Trust "[your email]"**
4. Tap **Trust** to confirm
5. Now open TrackR -- it should launch

### Step 6 (alternative): Run from terminal instead of Xcode

If you'd rather skip the Xcode UI after signing is set up:
```bash
# Private WiFi (home) -- set your Mac's WiFi IP so the app can find Metro wirelessly
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo run:ios --device "00008140-00044DA42E00401C"

# Public WiFi (Panera/cafe) -- USB tethered the whole time
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.2.1 npx expo run:ios --device "00008140-00044DA42E00401C"
```

### Step 7: WiFi-only sessions (no rebuild needed)

If the app is already installed and signing hasn't expired, you just need Metro:
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0) npx expo start --dev-client
```
Then open TrackR on your phone. If the dev client launcher doesn't auto-discover Metro,
type your Mac's IP + port in the launcher (e.g. `192.168.1.14:8081`).
The dev client remembers recent URLs so you usually only type it once.

---

## Troubleshooting

**"Unable to install app" or provisioning error**
- Your 7-day window expired. Just rebuild (Cmd+R) and re-trust on the phone.

**"No signing certificate" or "No profiles for 'com.lantingdigital.trackr'"**
- In Xcode: Signing & Capabilities > uncheck then re-check "Automatically manage signing"
- Make sure your Apple ID is added: Xcode > Settings > Accounts > add your Apple ID if missing

**Device not showing in Xcode**
- Unlock your phone, tap Trust if prompted
- Try a different cable
- Restart Xcode

**App crashes immediately after install**
- Go to Settings > General > VPN & Device Management and re-trust the developer profile

**"ios/" folder is messed up**
- Delete and regenerate:
  ```bash
  rm -rf ios/
  npx expo prebuild --platform ios
  open ios/TrackR.xcworkspace
  ```
  Then redo Step 2 (signing).

---

## Summary (the 30-second version)

1. `open ios/TrackR.xcworkspace`
2. Xcode > TrackR target > Signing & Capabilities > set your Personal Team
3. Select your iPhone in the device dropdown
4. Cmd+R to build
5. On phone: Settings > General > VPN & Device Management > Trust
6. Open TrackR
