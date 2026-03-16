# Apple Wallet (PassKit) -- v1 Requirements Spec

## Overview

This feature does not exist yet. This document specifies the backend and integration requirements for adding theme park passes to Apple Wallet from TrackR.

Target milestone: **M3 (Apr 27, 2026)**

## What Apple Wallet Integration Means

Users tap "Add to Apple Wallet" on any ticket in the TrackR wallet. A `.pkpass` file is generated server-side, downloaded to the device, and added to the native Apple Wallet app. The pass displays the park name, barcode, validity dates, and park branding. It updates automatically when the pass status changes (used, expired).

## PKPass Bundle Structure

A `.pkpass` file is a signed ZIP archive containing:

```
pass.json          -- Pass metadata (JSON)
icon.png           -- 29x29 pass icon
icon@2x.png        -- 58x58
icon@3x.png        -- 87x87
logo.png           -- 160x50 header logo
logo@2x.png        -- 320x100
strip.png          -- 375x123 hero strip image (optional)
strip@2x.png       -- 750x246
thumbnail.png      -- 90x90 (optional)
manifest.json      -- SHA1 hashes of all files
signature           -- PKCS7 detached signature of manifest.json
```

## pass.json Schema (Theme Park Pass)

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.lantingdigital.trackr",
  "serialNumber": "{ticket.id}",
  "teamIdentifier": "{APPLE_TEAM_ID}",
  "organizationName": "TrackR",
  "description": "{parkName} - {passTypeLabel}",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb({parkBrandColor})",
  "labelColor": "rgb(255, 255, 255)",
  "barcode": {
    "message": "{ticket.qrData}",
    "format": "{PKBarcodeFormat}",
    "messageEncoding": "iso-8859-1"
  },
  "barcodes": [{
    "message": "{ticket.qrData}",
    "format": "{PKBarcodeFormat}",
    "messageEncoding": "iso-8859-1"
  }],
  "generic": {
    "primaryFields": [
      { "key": "park", "label": "PARK", "value": "{ticket.parkName}" }
    ],
    "secondaryFields": [
      { "key": "type", "label": "PASS TYPE", "value": "{passTypeLabel}" },
      { "key": "valid", "label": "VALID THROUGH", "value": "{ticket.validUntil}" }
    ],
    "auxiliaryFields": [
      { "key": "holder", "label": "PASSHOLDER", "value": "{ticket.passholder}" }
    ],
    "backFields": [
      { "key": "appLink", "label": "Open in TrackR", "value": "https://trackr.app/pass/{ticket.id}" }
    ]
  },
  "webServiceURL": "https://us-central1-{project}.cloudfunctions.net/appleWallet",
  "authenticationToken": "{per-pass-auth-token}"
}
```

## Barcode Format Mapping

| TrackR BarcodeFormat | PKBarcodeFormat |
|---------------------|-----------------|
| QR_CODE | PKBarcodeFormatQR |
| AZTEC | PKBarcodeFormatAztec |
| PDF417 | PKBarcodeFormatPDF417 |
| CODE_128 | PKBarcodeFormatCode128 |
| IMAGE_ONLY | No barcode field (image-only passes show thumbnail instead) |

## Apple Developer Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Apple Developer Program ($99/year) | NOT PURCHASED | Purchase ASAP (M0 blocker) |
| Pass Type ID certificate | Not created | Create in Apple Developer portal > Certificates > Pass Type IDs |
| Pass Type ID: `pass.com.lantingdigital.trackr` | Not registered | Register in Apple Developer portal |
| Team Identifier | Unknown until enrollment | Retrieve from Apple Developer account |
| WWDR intermediate certificate | Not downloaded | Download from Apple PKI page |
| `.p12` signing certificate | Not created | Export from Keychain after creating Pass Type ID cert |

## Cloud Function Requirements

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generatePKPass` | Callable | Generate signed .pkpass from ticket data. Inputs: ticketId, uid. Returns: signed .pkpass as base64 or Storage download URL. |
| `appleWalletWebService` | HTTPS (REST) | Apple Wallet update protocol endpoints (see below) |
| `updatePassOnChange` | Firestore onUpdate `users/{uid}/tickets/{ticketId}` | Push update to registered Apple Wallet passes when ticket status changes |

### Apple Wallet Web Service Endpoints

Apple Wallet checks these endpoints to register devices and fetch updates:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}` | Register device for pass updates |
| DELETE | `/v1/devices/{deviceId}/registrations/{passTypeId}/{serialNumber}` | Unregister device |
| GET | `/v1/devices/{deviceId}/registrations/{passTypeId}` | Get serial numbers of passes for device |
| GET | `/v1/passes/{passTypeId}/{serialNumber}` | Get latest version of a pass |
| POST | `/v1/log` | Log error messages from Apple Wallet |

## Firestore Collections Required

| Collection | Doc Structure | Read/Write |
|------------|--------------|------------|
| `appleWalletRegistrations/{registrationId}` | `{ deviceId, passTypeId, serialNumber, pushToken, authToken, createdAt }` | R/W |
| `appleWalletPasses/{serialNumber}` | `{ uid, ticketId, lastUpdated, authToken }` | R/W |

## Client-Side Integration

### React Native Libraries

| Library | Purpose | Native Rebuild? |
|---------|---------|-----------------|
| `react-native-wallet-manager` | Check if Wallet available, add passes | Yes |
| OR `react-native-passkit-wallet` | Alternative: check + add passes | Yes |

### Client Flow

1. User taps "Add to Apple Wallet" button on ticket detail/gate mode
2. Client calls `generatePKPass` Cloud Function with `{ ticketId }`
3. Cloud Function: fetches ticket from Firestore, assembles pass.json, bundles images, signs with Pass Type ID cert, returns `.pkpass` (base64 or Storage URL)
4. Client downloads `.pkpass` to temp file
5. Client calls `WalletManager.addPassFromUrl(tempFileUrl)` or `PassKit.addPass(base64)`
6. iOS presents native "Add Pass" confirmation sheet
7. On success: update Firestore ticket with `{ appleWalletAdded: true, appleWalletSerial: serialNumber }`

### UI Touchpoints (New Elements Needed)

| Element | Location | Behavior |
|---------|----------|----------|
| "Add to Apple Wallet" button | PassDetailView (back side, below QR) | Trigger PKPass generation + add flow |
| "Add to Apple Wallet" button | GateModeOverlay (below QR card) | Same as above |
| "Add to Apple Wallet" button | QuickActionsMenu (new action row) | Same as above |
| Apple Wallet badge | PassPreviewCard (corner indicator) | Show small Wallet icon if `appleWalletAdded === true` |
| Apple Wallet badge | WalletCard header | Show Wallet icon next to park name |

## Server-Side Signing (Cloud Function Detail)

The `generatePKPass` function must:

1. Read ticket data from Firestore
2. Build `pass.json` with ticket fields mapped to PassKit schema
3. Fetch park logo/strip images from Storage (or use bundled defaults)
4. Create `manifest.json` with SHA1 of every file in the bundle
5. Sign `manifest.json` with Pass Type ID certificate + WWDR cert -> `signature`
6. ZIP all files into `.pkpass`
7. Return the signed bundle

**Dependencies**: `node-forge` or `passkit-generator` npm package for PKCS7 signing.

Recommended: **`passkit-generator`** npm package -- handles manifest, signing, and ZIP in one API.

## Third-Party API Requirements

| Service | Purpose | Milestone |
|---------|---------|-----------|
| Apple Developer Program | Pass Type ID cert, signing | M0 (purchase) |
| Firebase Cloud Functions | PKPass generation + web service | M3 |
| Firebase Storage | Pass images (logos, strips) | M3 |
| APNs (Apple Push Notification) | Push pass updates to Wallet | M3 |

## Open Questions

1. Should passes update automatically when ticket status changes (used/expired), or is one-time generation sufficient for v1?
2. Park-specific branding: should strip images use the NanoBanana card art, park logos, or generic TrackR branding?
3. IMAGE_ONLY passes have no barcode. Apple Wallet requires either a barcode or relevance info. Should these tickets be ineligible for Apple Wallet?
4. Push updates require APNs integration. Is this in M3 scope, or should v1 be generation-only (no live updates)?
5. `passkit-generator` vs manual signing: the npm package simplifies enormously but adds a dependency. Worth it?
6. Multiple passes per park (e.g., annual + day pass): Apple Wallet groups by passTypeIdentifier. Should each pass type get a unique visual treatment?
