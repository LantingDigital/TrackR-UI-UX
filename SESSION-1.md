# Session 1 — 2026-03-16 (Mon, Panera Bread)

## Focus: Onboarding Screen 4 (Wallet) Polish

Working through onboarding screens one by one. Screens 1-2 already approved. Started with Screen 4 (Wallet/Scan) based on Caleb's priority.

## What Was Done

### ScanModal (Wallet carousel view)
- Removed ghost "Search passes..." search bar that was pushing content down
- Added "Search passes..." placeholder inside MorphingPill expanded content for scan mode
- Morph open speed matched to search/log demos (settle 200→100ms, content reveal 900→600ms)
- Shadow line above Favorites fixed (padding + overflow visible on scroll)
- Section cards widened to full-width (marginHorizontal: 0) to match search bar span
- Populated all sections with content:
  - Favorites: Busch Gardens Tampa (Iron Gwazi card art, star badge)
  - Tickets: Islands of Adventure (VelociCoaster art) + Import Ticket dashed card
  - Passes: Cedar Point + Knott's Berry Farm + Import Pass dashed card
- Gap between search bar and Favorites reduced (contentContainer paddingTop: 0)
- ScanModal always mounted (opacity: 0 when hidden) to preload images and reduce open jank
- Spring press feedback on wallet pass cards (scale 0.93, spring back with damping 15)
- Wallet content fade-out + morph pill close now simultaneous (was 650ms gap)

### OnboardingPassDetail (Pass card detail / QR flip view)
- Backdrop fixed: dark BlurView on front face (matching real Wallet), card art blur only on QR flip
- Hero images: tickets now use `heroImageSource` field directly (Steel Vengeance, GhostRider), `resizeMode="cover"`
- Removed separate `TICKET_CARD_ART` mapping — reads from ticket object directly
- Real QR codes via `react-native-qrcode-svg` (replaced grid placeholder)
- Animated dot indicators: spring-animated width (8→24px), scaleY squish (1→1.3→1), color interpolation
- Card vertical centering: header paddingTop 75px, cardContainer marginTop 80px
- Scan (QR flip) view: marginTop -80 offset to center without bottom section
- Hero/footer ratio: 52% hero / 48% footer for QR breathing room
- Card dimensions: 24px horizontal margin, 1.15 aspect ratio

### Native Modules Installed
- `expo-haptics` (Evan Bacon's full haptic control)
- `react-native-qrcode-svg` + `react-native-svg` (real QR codes)
- Native rebuild required: `npx expo run:ios --device 00008140-00044DA42E00401C`

## Still Needs Attention
- Opening animation slightly laggy (images preloaded but morph + content render is heavy)
- Gap between search bar and Favorites section slightly large (layout is in MorphingPill expanded area, hard to control from ScanModal side)
- Hero images are NanoBanana card art (square) shown with cover crop — real hero images would be landscape park photos
- Screens 3, 5 still IN TESTING from prior sessions
- Screens 6-10 not built yet

## Key Decisions
- `heroImageSource` on ticket objects is the source of truth for pass detail hero images (not a separate mapping)
- ScanModal always mounted for image preloading (visibility controlled via opacity)
- Card detail centering uses marginTop offset approach (80px for front, -80px additional for back/scan)

*— Session 1*
