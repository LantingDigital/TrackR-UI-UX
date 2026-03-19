"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLACEHOLDER_STRIP = exports.PLACEHOLDER_LOGO = exports.PLACEHOLDER_ICON = void 0;
exports.getPassImageBuffers = getPassImageBuffers;
const node_buffer_1 = require("node:buffer");
/**
 * Minimal 1x1 white pixel PNG.
 * Used as placeholder for all pass image slots.
 * Replace with properly sized TrackR-branded images from Cloud Storage.
 */
const MINIMAL_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQA' +
    'AAABJRU5ErkJggg==';
exports.PLACEHOLDER_ICON = node_buffer_1.Buffer.from(MINIMAL_PNG_BASE64, 'base64');
exports.PLACEHOLDER_LOGO = node_buffer_1.Buffer.from(MINIMAL_PNG_BASE64, 'base64');
exports.PLACEHOLDER_STRIP = node_buffer_1.Buffer.from(MINIMAL_PNG_BASE64, 'base64');
/**
 * Returns the complete set of image buffers for a pass.
 * In production, these should be fetched from Cloud Storage
 * with properly designed TrackR-branded images.
 *
 * @param includeStrip Whether to include strip images (NanoBanana style)
 * @param stripImageBuffer Optional custom strip image buffer (e.g., card art)
 */
function getPassImageBuffers(includeStrip, stripImageBuffer) {
    const buffers = {
        'icon.png': exports.PLACEHOLDER_ICON,
        'icon@2x.png': exports.PLACEHOLDER_ICON,
        'icon@3x.png': exports.PLACEHOLDER_ICON,
        'logo.png': exports.PLACEHOLDER_LOGO,
        'logo@2x.png': exports.PLACEHOLDER_LOGO,
    };
    if (includeStrip) {
        const strip = stripImageBuffer ?? exports.PLACEHOLDER_STRIP;
        buffers['strip.png'] = strip;
        buffers['strip@2x.png'] = strip;
    }
    return buffers;
}
//# sourceMappingURL=placeholderImages.js.map