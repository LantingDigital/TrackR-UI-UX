"use strict";
/**
 * Apple Wallet PKPass — Types
 *
 * Request/response types for the generatePKPass Cloud Function
 * and internal pass builder types.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BARCODE_FORMAT_MAP = void 0;
// ============================================
// Barcode Format Mapping
// ============================================
/**
 * Maps TrackR barcode format strings to Apple PKPass barcode formats.
 */
exports.BARCODE_FORMAT_MAP = {
    QR_CODE: 'PKBarcodeFormatQR',
    AZTEC: 'PKBarcodeFormatAztec',
    PDF417: 'PKBarcodeFormatPDF417',
    CODE_128: 'PKBarcodeFormatCode128',
    CODE_39: 'PKBarcodeFormatCode128', // Closest supported format
    DATA_MATRIX: 'PKBarcodeFormatQR', // Fallback
    EAN_13: 'PKBarcodeFormatCode128', // Fallback
    UPC_A: 'PKBarcodeFormatCode128', // Fallback
};
//# sourceMappingURL=types.js.map