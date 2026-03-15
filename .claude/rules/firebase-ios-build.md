# Firebase iOS Build Configuration (Hard-Won Knowledge)

## The Problem

Firebase iOS SDK v11+ (Auth, Functions, Storage) is written in Swift. The ObjC API is exposed via generated `-Swift.h` headers. These headers ONLY exist when `use_frameworks! :linkage => :static` is enabled. Without it, any native module that imports Firebase (RNFB) fails with "file not found" errors.

BUT `use_frameworks!` makes ALL pods into framework modules, which breaks any pod that imports React headers (which aren't fully modular). This creates "non-modular include" and "must be imported from module" errors.

## The Solution (applied 2026-03-12)

Three-part fix in `ios/Podfile`:

1. **`use_frameworks! :linkage => :static`** via `Podfile.properties.json` — required for Firebase Swift headers
2. **Firebase modular headers** — 15 pods with `:modular_headers => true` so Swift can import them
3. **Disable module maps for RNFB pods** — in post_install, set `DEFINES_MODULE = NO`, delete `MODULEMAP_FILE`, and remove the generated `.modulemap` files for `RNFB*` targets. This prevents Clang from enforcing module boundaries when RNFB imports React headers.
4. **`CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES`** on all pods — catches remaining warnings-as-errors.

## What NOT to Do

- **Don't remove `use_frameworks! :static`** — Firebase Swift headers won't generate, causing `*-Swift.h file not found`
- **Don't delete umbrella headers** — modulemaps reference them, build fails with "umbrella header not found"
- **Don't create empty Swift header stubs** — the types (FIRFunctions, FIRHTTPSCallable, etc.) only exist IN the generated Swift headers; empty stubs mean no types
- **Don't add `react-native-maps` or `@rnmapbox/maps` back** without testing — they have their own module declaration conflicts with `use_frameworks!`. Maps are v2 anyway.

## After `expo prebuild --clean`

The Podfile gets regenerated. You MUST re-add:
1. All 15 Firebase `:modular_headers => true` pod declarations
2. The post_install hook with RNFB module map removal
3. The `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES` setting
4. Verify `Podfile.properties.json` has `"ios.useFrameworks": "static"`

## Pod Install Order

After any Podfile changes: `cd ios && pod install` then rebuild with `npx expo run:ios --device`.
