# News Article Image Audit

**Date:** March 9, 2026

## Summary

News article cards use valid Wikimedia Commons URLs. No broken URLs detected. The "blank" appearance is likely caused by missing error handling when images fail to load (rate limiting, network conditions).

## Mock News Data (4 articles)

| # | Title | Image Source | Status |
|---|-------|-------------|--------|
| 1 | Cedar Point New Coaster | Wikimedia Commons | Valid (may 429 rate limit) |
| 2 | Six Flags / Cedar Fair Merger | Wikimedia Commons | Valid |
| 3 | Top 10 Hidden Gems | Wikimedia Commons | Valid |
| 4 | New RMC Conversion | Wikipedia Special:FilePath | Valid (302 redirect) |

## Issues Found

1. **No error handling in NewsCard** -- no `onError` callback, no fallback UI. Other components (ArticleSheet, LogConfirmSheet) do implement error handling.
2. **Article 4 uses redirect URL** -- requires extra HTTP roundtrip
3. **Rate limiting risk** -- Wikimedia CDN can return 429 temporarily

## Recommendations

### Priority 1: Add error handling to NewsCard.tsx
- Add `onError` callback to the expo-image `<Image>` component (line ~45)
- Show neutral placeholder color on failure
- Matches pattern used in ArticleSheet and LogConfirmSheet

### Priority 2: Fix redirect URL
- Replace article 4's `Special:FilePath` URL with direct Wikimedia Commons CDN path

### Priority 3: Local images
- Create `assets/news/` directory with local placeholder images
- Eliminates external URL dependency entirely
- Instant load, guaranteed availability

## Key Files
- Mock data: `src/data/mockNews.ts`
- NewsCard: `src/components/NewsCard.tsx` (expo-image, cachePolicy="memory-disk", aspectRatio 1.618)
- No `assets/news/` directory exists yet
