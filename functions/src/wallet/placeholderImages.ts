/**
 * Apple Wallet PKPass — Placeholder Images
 *
 * Minimal valid PNG buffers used as placeholder pass images.
 * These should be replaced with actual TrackR-branded images
 * stored in Cloud Storage before production launch.
 *
 * Apple Wallet image requirements:
 * - icon.png: 29x29pt (required, shown in notifications)
 * - icon@2x.png: 58x58pt
 * - icon@3x.png: 87x87pt
 * - logo.png: ~160x50pt (shown on pass front, next to logoText)
 * - logo@2x.png: ~320x100pt
 * - strip.png: 375x123pt (for NanoBanana style, behind primary fields)
 * - strip@2x.png: 750x246pt
 */

import { Buffer } from 'node:buffer';

/**
 * Minimal 1x1 white pixel PNG.
 * Used as placeholder for all pass image slots.
 * Replace with properly sized TrackR-branded images from Cloud Storage.
 */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQA' +
  'AAABJRU5ErkJggg==';

export const PLACEHOLDER_ICON = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
export const PLACEHOLDER_LOGO = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
export const PLACEHOLDER_STRIP = Buffer.from(MINIMAL_PNG_BASE64, 'base64');

/**
 * Returns the complete set of image buffers for a pass.
 * In production, these should be fetched from Cloud Storage
 * with properly designed TrackR-branded images.
 *
 * @param includeStrip Whether to include strip images (NanoBanana style)
 * @param stripImageBuffer Optional custom strip image buffer (e.g., card art)
 */
export function getPassImageBuffers(
  includeStrip: boolean,
  stripImageBuffer?: Buffer,
): Record<string, Buffer> {
  const buffers: Record<string, Buffer> = {
    'icon.png': PLACEHOLDER_ICON,
    'icon@2x.png': PLACEHOLDER_ICON,
    'icon@3x.png': PLACEHOLDER_ICON,
    'logo.png': PLACEHOLDER_LOGO,
    'logo@2x.png': PLACEHOLDER_LOGO,
  };

  if (includeStrip) {
    const strip = stripImageBuffer ?? PLACEHOLDER_STRIP;
    buffers['strip.png'] = strip;
    buffers['strip@2x.png'] = strip;
  }

  return buffers;
}
