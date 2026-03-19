"use strict";
/**
 * Apple Wallet PKPass — Pass Builder
 *
 * Creates signed .pkpass files using passkit-generator.
 *
 * Certificate Setup (required before production use):
 * 1. Register a Pass Type ID in Apple Developer portal
 *    (Identifiers → Pass Type IDs → pass.com.lantingdigital.trackr)
 * 2. Create a certificate for that Pass Type ID
 * 3. Export the certificate + private key as .p12
 * 4. Convert to PEM:
 *    openssl pkcs12 -in cert.p12 -clcerts -nokeys -out pass-type-id.pem
 *    openssl pkcs12 -in cert.p12 -nocerts -out pass-type-id-key.pem
 * 5. Download Apple WWDR intermediate certificate:
 *    https://www.apple.com/certificateauthority/
 *    (Apple Worldwide Developer Relations Certification Authority - G4)
 * 6. Upload all three PEM files to Cloud Storage:
 *    gs://trackr-coaster-app.appspot.com/apple-wallet-certs/wwdr.pem
 *    gs://trackr-coaster-app.appspot.com/apple-wallet-certs/pass-type-id.pem
 *    gs://trackr-coaster-app.appspot.com/apple-wallet-certs/pass-type-id-key.pem
 * 7. Set PASS_CERT_PASSPHRASE in Cloud Functions environment config:
 *    firebase functions:config:set wallet.cert_passphrase="your-passphrase"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPKPass = buildPKPass;
const passkit_generator_1 = require("passkit-generator");
const storage_1 = require("firebase-admin/storage");
const types_1 = require("./types");
const passStyles_1 = require("./passStyles");
const parkLocations_1 = require("./parkLocations");
const placeholderImages_1 = require("./placeholderImages");
// ============================================
// Constants
// ============================================
/**
 * Pass Type Identifier — must match the ID registered in Apple Developer portal.
 * TODO: Caleb needs to register this in Apple Developer portal (Identifiers → Pass Type IDs).
 */
const PASS_TYPE_IDENTIFIER = 'pass.com.lantingdigital.trackr';
/** Apple Developer Team ID (from Apple Developer account) */
const TEAM_IDENTIFIER = 'Q9H59NQ25W';
/** Cloud Storage paths for certificates */
const CERT_PATHS = {
    wwdr: 'apple-wallet-certs/wwdr.pem',
    signerCert: 'apple-wallet-certs/pass-type-id.pem',
    signerKey: 'apple-wallet-certs/pass-type-id-key.pem',
};
/**
 * Load Apple Wallet certificates from Cloud Storage.
 * Throws a descriptive error if certificates are not found.
 */
async function loadCertificates() {
    const bucket = (0, storage_1.getStorage)().bucket();
    try {
        const [wwdr] = await bucket.file(CERT_PATHS.wwdr).download();
        const [signerCert] = await bucket.file(CERT_PATHS.signerCert).download();
        const [signerKey] = await bucket.file(CERT_PATHS.signerKey).download();
        // Passphrase from environment config or Functions config
        const passphrase = process.env.WALLET_CERT_PASSPHRASE ?? '';
        return {
            wwdr,
            signerCert,
            signerKey,
            signerKeyPassphrase: passphrase,
        };
    }
    catch (error) {
        throw new Error('Apple Wallet certificates not found in Cloud Storage. ' +
            `Upload PEM files to: ${CERT_PATHS.wwdr}, ${CERT_PATHS.signerCert}, ${CERT_PATHS.signerKey}. ` +
            'See functions/src/wallet/passBuilder.ts header comment for setup instructions.');
    }
}
/**
 * Build a signed .pkpass file for the given ticket and style.
 * Returns a Buffer containing the .pkpass zip archive.
 */
async function buildPKPass(options) {
    const { ticket, style, userId } = options;
    // Load signing certificates
    const certs = await loadCertificates();
    // Get style configuration
    const styleConfig = { ...passStyles_1.PASS_STYLE_CONFIGS[style] };
    // Apply park-specific color for park-color style
    if (style === 'park-color') {
        styleConfig.backgroundColor = (0, passStyles_1.getParkBrandColor)(ticket.parkChain);
    }
    // Build image buffers
    const imageBuffers = (0, placeholderImages_1.getPassImageBuffers)(styleConfig.useStripImage);
    // Generate unique serial number
    const serialNumber = `trackr-${userId}-${ticket.id}-${Date.now()}`;
    // Create pass instance
    const pass = new passkit_generator_1.PKPass(imageBuffers, {
        wwdr: certs.wwdr,
        signerCert: certs.signerCert,
        signerKey: certs.signerKey,
        signerKeyPassphrase: certs.signerKeyPassphrase,
    }, {
        passTypeIdentifier: PASS_TYPE_IDENTIFIER,
        teamIdentifier: TEAM_IDENTIFIER,
        serialNumber,
        description: `${ticket.parkName} — ${(0, passStyles_1.getPassTypeLabel)(ticket.passType)}`,
        organizationName: 'TrackR',
        backgroundColor: styleConfig.backgroundColor,
        foregroundColor: styleConfig.foregroundColor,
        labelColor: styleConfig.labelColor,
        logoText: styleConfig.logoText,
        sharingProhibited: false,
        // Web service for pass updates (stub — requires APNs setup)
        // webServiceURL: 'https://us-central1-trackr-coaster-app.cloudfunctions.net/appleWalletWebService',
        // authenticationToken: serialNumber, // Must be at least 16 chars
    });
    // Set pass type
    pass.type = 'generic';
    // ── Header Fields ──────────────────────────
    pass.headerFields.push({
        key: 'parkName',
        label: 'PARK',
        value: ticket.parkName,
    });
    // ── Primary Fields ─────────────────────────
    pass.primaryFields.push({
        key: 'passType',
        label: 'PASS TYPE',
        value: (0, passStyles_1.getPassTypeLabel)(ticket.passType),
    });
    // ── Secondary Fields ───────────────────────
    if (ticket.validFrom) {
        pass.secondaryFields.push({
            key: 'validFrom',
            label: 'VALID FROM',
            value: ticket.validFrom,
            dateStyle: 'PKDateStyleMedium',
        });
    }
    if (ticket.validUntil) {
        pass.secondaryFields.push({
            key: 'validUntil',
            label: 'VALID UNTIL',
            value: ticket.validUntil,
            dateStyle: 'PKDateStyleMedium',
        });
    }
    // ── Auxiliary Fields ───────────────────────
    if (ticket.passholder) {
        pass.auxiliaryFields.push({
            key: 'holder',
            label: 'PASSHOLDER',
            value: ticket.passholder,
        });
    }
    // ── Back Fields ────────────────────────────
    pass.backFields.push({
        key: 'appInfo',
        label: 'TrackR',
        value: 'The premium home for your coaster life. Download TrackR on the App Store.',
    }, {
        key: 'passId',
        label: 'Pass ID',
        value: ticket.id,
    }, {
        key: 'style',
        label: 'Style',
        value: style,
    });
    // ── Barcode ────────────────────────────────
    if (ticket.qrData) {
        const format = types_1.BARCODE_FORMAT_MAP[ticket.qrFormat ?? 'QR_CODE'] ?? 'PKBarcodeFormatQR';
        pass.setBarcodes({
            format,
            message: ticket.qrData,
            messageEncoding: 'iso-8859-1',
        });
    }
    // ── Geo-fence Location ─────────────────────
    const parkLocation = (0, parkLocations_1.findParkLocation)(ticket.parkName);
    if (parkLocation) {
        pass.setLocations({
            latitude: parkLocation.latitude,
            longitude: parkLocation.longitude,
            relevantText: parkLocation.relevantText,
        });
    }
    // ── Relevant Date ──────────────────────────
    if (ticket.validFrom) {
        const relevantDate = new Date(ticket.validFrom);
        if (!isNaN(relevantDate.getTime())) {
            pass.setRelevantDate(relevantDate);
        }
    }
    // Generate the signed .pkpass buffer
    return pass.getAsBuffer();
}
//# sourceMappingURL=passBuilder.js.map