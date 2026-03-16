# Wallet -- v1 Backend Audit

## Screens / Components Covered

- `src/contexts/WalletContext.tsx` (596 lines)
- `src/hooks/useWallet.ts` (9 lines)
- `src/services/walletStorage.ts` (447 lines)
- `src/types/wallet.ts` (278 lines)
- `src/components/wallet/AddTicketFlow.tsx` (~1500 lines)
- `src/components/wallet/WalletCardStack.tsx` (671 lines)
- `src/components/wallet/PassDetailView.tsx` (1090 lines)
- `src/components/wallet/ScanModal.tsx` (663 lines)
- `src/components/wallet/GateModeOverlay.tsx` (496 lines)
- `src/components/wallet/CameraScanner.tsx` (587 lines)
- `src/components/wallet/QuickActionsMenu.tsx` (435 lines)
- `src/components/wallet/EmptyWalletPrompt.tsx` (133 lines)
- `src/components/wallet/PassHeroCard.tsx` (332 lines)
- `src/components/wallet/PassPreviewCard.tsx` (208 lines)
- `src/components/wallet/QRCodeDisplay.tsx` (198 lines)
- `src/components/wallet/WalletCard.tsx` (412 lines)
- `src/components/wallet/index.ts` (19 lines)

## Current Data Sources

| Data | Source | Persistence |
|------|--------|-------------|
| Ticket list | WalletContext -> walletStorage (expo-secure-store) | Encrypted local |
| Ticket images | walletStorage (expo-file-system `wallet/` dir) | Local files |
| Filter preferences | walletStorage (expo-secure-store) | Encrypted local |
| Default ticket | walletStorage (expo-secure-store) | Encrypted local |
| Mock tickets | WalletContext `USE_MOCK_DATA = false` (L33), mock array at L35-86 | Dev only |

## Interaction Inventory

| # | Element | Location | Current Behavior | v1 Target |
|---|---------|----------|-----------------|-----------|
| 1 | WalletCardStack close (backdrop tap) | WalletCardStack L461 | Calls onClose | No change |
| 2 | WalletCardStack close (X button) | WalletCardStack L500 | Calls onClose | No change |
| 3 | Card swipe (up/down) | WalletCardStack L384-402 | PanResponder: up=next, down=prev/close | No change |
| 4 | Card press (gate mode toggle) | WalletCardStack L369-378 | Toggles gateMode, calls onTicketUsed | Write `lastUsedAt` to Firestore |
| 5 | Set default star button | WalletCardStack L553-556 | Calls onSetDefault | Sync default ticket to Firestore |
| 6 | EmptyWalletPrompt "Add First Ticket" | EmptyWalletPrompt L50-59 | Calls onAddTicket | No change |
| 7 | EmptyWalletPrompt "Maybe Later" | EmptyWalletPrompt L63-66 | Calls onClose | No change |
| 8 | ScanModal search input | ScanModal L212-223 | Filters tickets locally | No change |
| 9 | ScanModal pass card press | ScanModal L180-187 | Opens PassDetailView | No change |
| 10 | ScanModal pass card long press | ScanModal L190-193 | Triggers QuickActionsMenu | No change |
| 11 | ScanModal "+ Add" buttons | ScanModal L293,347,402 | Calls onAddTicket | No change |
| 12 | PassDetailView card tap (flip) | PassDetailView L243-294 | Flip animation, brightness boost, calls onUsePass | Write `lastUsedAt` to Firestore |
| 13 | PassDetailView flip back | PassDetailView L297-336 | Reverse flip, restore brightness | No change |
| 14 | PassDetailView swipe close | PassDetailView L439-458 | Swipe down to dismiss | No change |
| 15 | PassDetailView horizontal swipe | PassDetailView L460-490 | Navigate between tickets | No change |
| 16 | PassDetailView dot navigation | PassDetailView L533-548 | Tap dot to jump to ticket | No change |
| 17 | PassDetailView "View Original" | PassDetailView L742-752 | Opens fullscreen original image modal | No change |
| 18 | GateModeOverlay tap to dismiss | GateModeOverlay L204 | Calls onClose | No change |
| 19 | GateModeOverlay close button | GateModeOverlay L209-211 | Calls onClose | No change |
| 20 | GateModeOverlay "View Original" | GateModeOverlay L266-277 | Opens fullscreen original image modal | No change |
| 21 | CameraScanner live scan | CameraScanner L121-129 | expo-camera barcode detection | No change |
| 22 | CameraScanner cancel | CameraScanner L304-313 | Calls onCancel | No change |
| 23 | CameraScanner flash toggle | CameraScanner L316-338 | Toggles torch | No change |
| 24 | CameraScanner library pick | CameraScanner L341-358 | ImagePicker + scanFromURLAsync | No change |
| 25 | CameraScanner permission grant | CameraScanner L245-249 | Requests camera permission | No change |
| 26 | AddTicketFlow type select cards | AddTicketFlow L849-865 | Select pass type (Annual/Season/Day/Express) | No change |
| 27 | AddTicketFlow Continue button | AddTicketFlow L893-913 | Navigates to method step | No change |
| 28 | AddTicketFlow camera option | AddTicketFlow L663-684 | Opens CameraScanner | No change |
| 29 | AddTicketFlow library option | AddTicketFlow L687-703 | Opens ImagePicker + barcode decode | No change |
| 30 | AddTicketFlow manual entry | AddTicketFlow L706-727 | Navigates to manual_barcode step | No change |
| 31 | AddTicketFlow form submit | AddTicketFlow L547-577 | Validates, checks duplicates, calls onComplete | Sync new ticket to Firestore |
| 32 | QuickActionsMenu "Scan at Gate" | QuickActionsMenu L176-194 | Calls onScan (opens gate mode) | No change |
| 33 | QuickActionsMenu "Toggle Favorite" | QuickActionsMenu L197-230 | Calls onToggleFavorite | Sync favorite status to Firestore |
| 34 | QuickActionsMenu "Edit Details" | QuickActionsMenu L233-251 | Calls onEdit | Navigate to edit form (reuse AddTicketFlow?) |
| 35 | QuickActionsMenu "Delete Pass" | QuickActionsMenu L254-272 | Calls onDelete | Delete from Firestore + local storage |

## Firestore Collections Required

| Collection | Doc Structure | Read/Write |
|------------|--------------|------------|
| `users/{uid}/tickets` | `{ parkName, parkChain, passType, passholder, validFrom, validUntil, qrData, qrFormat, status, isFavorite, isDefault, lastUsedAt, notes, addedAt, heroImageUrl, logoImageUrl, originalPhotoUrl }` | R/W |

## Cloud Function Requirements

| Function | Trigger | Purpose |
|----------|---------|---------|
| `syncTicketImages` | Callable | Upload original photo + hero images to Firebase Storage, return URLs |
| `refreshTicketStatuses` | Scheduled (daily) | Check `validUntil` dates, mark expired tickets |
| `migrateLocalWallet` | Callable | On first auth, upload all local tickets to Firestore |

## Third-Party API Requirements

| Service | Purpose | Milestone |
|---------|---------|-----------|
| Firebase Storage | Ticket photos (originals, thumbnails) | M2 |
| Firebase Auth | Ticket ownership | M1 |
| expo-camera | Barcode scanning (already integrated) | Done |
| expo-brightness | Gate mode brightness boost (already integrated) | Done |
| react-native-qrcode-svg | QR code rendering (already integrated) | Done |
| react-native-barcode-creator | 1D barcode rendering (already integrated) | Done |

## Open Questions

1. Wallet currently uses expo-secure-store for encrypted local storage. When Firestore sync is added, should secure-store remain as offline cache, or should it be replaced entirely with Firestore + local cache?
2. QR data is stored as plain text. Some park barcodes contain PII (passholder name, membership ID). Should qrData be encrypted in Firestore?
3. "Edit Details" in QuickActionsMenu calls `onEdit` but no edit flow exists. Should AddTicketFlow be reused in edit mode, or is a separate simpler form needed?
4. Image sync strategy: tickets can have originalPhotoUri (local file), heroImageSource (bundled asset), and heroImageUri (remote URL). Which images need to sync to Storage?
5. Ticket sharing between users (e.g., family sharing a season pass) -- is this v1 scope?
