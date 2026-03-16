/**
 * Apple Wallet PKPass — Types
 *
 * Request/response types for the generatePKPass Cloud Function
 * and internal pass builder types.
 */

// ============================================
// Cloud Function Request / Response
// ============================================

export interface GeneratePKPassRequest {
  /** Firestore ticket document ID */
  ticketId: string;
  /** Visual style for the pass */
  style: PassStyle;
}

export interface GeneratePKPassResponse {
  /** Signed Cloud Storage download URL for the .pkpass file */
  downloadUrl: string;
  /** ISO 8601 timestamp — when the signed URL expires */
  expiresAt: string;
}

// ============================================
// Pass Styles
// ============================================

export type PassStyle = 'clean' | 'nanobanana' | 'park-color' | 'dark' | 'light';

export interface PassStyleConfig {
  backgroundColor: string; // rgb(r, g, b) format
  foregroundColor: string;
  labelColor: string;
  logoText: string;
  useStripImage: boolean;
}

// ============================================
// Internal — Ticket Data (from Firestore)
// ============================================

export interface TicketData {
  id: string;
  parkName: string;
  parkChain: string;
  passType: string;
  passholder: string;
  validFrom: string; // ISO 8601
  validUntil: string; // ISO 8601
  qrData: string | null;
  qrFormat: string | null;
  heroImageUrl: string | null;
}

// ============================================
// Barcode Format Mapping
// ============================================

/**
 * Maps TrackR barcode format strings to Apple PKPass barcode formats.
 */
export const BARCODE_FORMAT_MAP: Record<string, 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128'> = {
  QR_CODE: 'PKBarcodeFormatQR',
  AZTEC: 'PKBarcodeFormatAztec',
  PDF417: 'PKBarcodeFormatPDF417',
  CODE_128: 'PKBarcodeFormatCode128',
  CODE_39: 'PKBarcodeFormatCode128', // Closest supported format
  DATA_MATRIX: 'PKBarcodeFormatQR', // Fallback
  EAN_13: 'PKBarcodeFormatCode128', // Fallback
  UPC_A: 'PKBarcodeFormatCode128', // Fallback
};
