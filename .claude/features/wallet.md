# Wallet Feature

Digital wallet for theme park tickets, season passes, and membership cards.

---

## Status: ~85% Complete

The wallet is fully built and integrated into the app. It uses mock data for testing (`USE_MOCK_DATA = true` in WalletContext). The real storage pipeline is implemented but needs device testing.

---

## What's Built

### Components (src/components/wallet/)
- **AddTicketFlow** -- Multi-step wizard: choose method -> camera scan / photo library -> barcode detection -> manual entry form
- **CameraScanner** -- Live camera barcode scanning with expo-camera, animated scan line, flash toggle, photo library import
- **GateModeOverlay** -- Full-screen pass display for park gates with brightness boost and blur backgrounds
- **PassDetailView** -- Bottom sheet with horizontal card swipe, card flip animation (front=hero, back=QR)
- **PassHeroCard** -- Full-width pass card with hero image, logo overlay, gradient fallback, QR in footer
- **PassPreviewCard** -- Mini preview cards for carousels with star badge
- **QRCodeDisplay** -- Unified renderer for QR codes, 1D barcodes, and image-only fallback
- **ScanModal** -- Searchable section-based interface (Favorites, Tickets, Passes, Expired) with snap carousels
- **WalletCard** -- Single ticket card with gate mode variant
- **WalletCardStack** -- Card stack display
- **EmptyWalletPrompt** -- Empty state UI
- **QuickActionsMenu** -- Long-press quick actions

### Infrastructure
- **Types**: `src/types/wallet.ts` -- Ticket, WalletState, FilterPreferences, BarcodeFormat, ParkChain, PassType
- **Park Detection**: `src/services/parkDetection.ts` -- Auto-detection from QR data (Disney, Universal, Cedar Fair, Six Flags, SeaWorld, Busch Gardens)
- **Storage**: `src/services/walletStorage.ts` -- expo-secure-store (encrypted) + expo-file-system (images)
- **Context**: `src/contexts/WalletContext.tsx` -- Full state management with CRUD, filtering, favorites
- **Hook**: `src/hooks/useWallet.ts` -- Convenience re-export

### Integration
- WalletProvider wraps the entire app in RootNavigator
- HomeScreen MorphingPill "scan" button expands into wallet experience
- AddTicketFlow wired to "+" / "Add" buttons in ScanModal
- Full gesture system: horizontal swipe, vertical dismiss, tap to flip for QR

### Assets
- 3 park hero images (Carowinds, Cedar Point, Kings Island) in `assets/wallet/parks/card-art/`
- 3 park logos in `assets/wallet/parks/logos/`

---

## Libraries
- `expo-camera` -- Camera scanning + scanFromURLAsync for photo library
- `react-native-qrcode-svg` -- QR code SVG generation
- `react-native-barcode-creator` -- 1D barcode generation (Code128, PDF417, Aztec, EAN13, UPCA)
- `expo-image-picker` -- Photo library import
- `expo-brightness` -- Auto-brightness boost in gate mode
- `expo-secure-store` -- Encrypted ticket metadata storage

---

## Remaining Work
- Switch `USE_MOCK_DATA` to false and test real storage pipeline on device
- Build Profile screen wallet section for pass management (edit, delete, reorder)
- Add more park card art (currently 3 parks have hero images/logos)
- iOS limitation: expo-camera scanFromURLAsync only handles QR codes from images on iOS (not 1D barcodes)

---

## Research
Full barcode/QR research: `docs/wallet-barcode-research.md`
