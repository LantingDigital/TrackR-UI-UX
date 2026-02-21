# Wallet Feature (Phase 2 -- Placeholder)

The wallet feature will provide a digital wallet for theme park tickets, season passes, and membership cards. It is planned for Phase 2 and will be built from scratch.

---

## Status: Not Started (Phase 2)

The current wallet implementation (`src/screens/WalletScreen.tsx` and `src/components/wallet/`) is broken and should NOT be used or modified. It will be completely rebuilt.

---

## Planned Features

### Apple Wallet-Style Card Stack
- Stacked card interface showing all passes
- Swipe or tap to select a pass
- Spring-animated card transitions

### QR/Barcode Display
- Show QR code or barcode for selected pass
- Auto-brightness boost when displaying code
- Full-screen gate mode for easy scanning

### Quick Access (from Home)
- Tap "Scan" button on Home screen
- MorphingPill expands into wallet quick-use overlay
- Select pass, show code, close

### Pass Management (from Profile)
- View all saved passes
- Add new pass (scan barcode or manual entry)
- Set default pass
- Delete passes with confirmation

---

## Data Model (Planned)

```typescript
interface WalletPass {
  id: string;
  parkName: string;
  passType: 'ticket' | 'season_pass' | 'membership';
  barcode: string;
  barcodeFormat: 'qr' | 'code128' | 'pdf417';
  displayName: string;
  expiresAt?: string;
  color?: string;
  isDefault: boolean;
}
```

---

## Existing Files (Do Not Modify)

These files exist but are broken. They will be deleted and rewritten in Phase 2:

- `src/screens/WalletScreen.tsx`
- `src/components/wallet/*` (12 files)
- `src/hooks/useWallet.ts`
- `src/contexts/WalletContext.tsx`
- `src/services/walletStorage.ts`
- `src/types/wallet.ts`
