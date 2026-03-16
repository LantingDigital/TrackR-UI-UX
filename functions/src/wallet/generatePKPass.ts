/**
 * generatePKPass — Cloud Function (onCall v2)
 *
 * Generates a signed Apple Wallet PKPass file from a user's ticket.
 *
 * Flow:
 * 1. Authenticate the caller
 * 2. Read ticket document from Firestore
 * 3. Build the PKPass with the selected style
 * 4. Upload .pkpass to Cloud Storage
 * 5. Return a signed download URL (valid 1 hour)
 *
 * Client usage:
 *   const result = await functions().httpsCallable('generatePKPass')({
 *     ticketId: 'ticket-123',
 *     style: 'clean',
 *   });
 *   // result.data.downloadUrl → signed URL to .pkpass file
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GeneratePKPassRequest, GeneratePKPassResponse, PassStyle } from './types';
import { buildPKPass } from './passBuilder';

// ============================================
// Validation
// ============================================

const VALID_STYLES: PassStyle[] = ['clean', 'nanobanana', 'park-color', 'dark', 'light'];

function validateRequest(data: unknown): GeneratePKPassRequest {
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Request body is required.');
  }

  const { ticketId, style } = data as Record<string, unknown>;

  if (!ticketId || typeof ticketId !== 'string') {
    throw new HttpsError('invalid-argument', 'ticketId is required and must be a string.');
  }

  if (!style || typeof style !== 'string' || !VALID_STYLES.includes(style as PassStyle)) {
    throw new HttpsError(
      'invalid-argument',
      `style must be one of: ${VALID_STYLES.join(', ')}`,
    );
  }

  return { ticketId, style: style as PassStyle };
}

// ============================================
// Ticket Reader
// ============================================

interface FirestoreTicketDoc {
  id: string;
  parkName: string;
  parkChain: string;
  passType: string;
  passholder: string;
  validFrom: string;
  validUntil: string;
  qrData: string | null;
  qrFormat: string | null;
  heroImageUrl: string | null;
}

async function getTicket(uid: string, ticketId: string): Promise<FirestoreTicketDoc> {
  const db = getFirestore();
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('tickets')
    .doc(ticketId)
    .get();

  if (!snap.exists) {
    throw new HttpsError('not-found', `Ticket ${ticketId} not found.`);
  }

  const data = snap.data() as FirestoreTicketDoc;
  return {
    id: snap.id,
    parkName: data.parkName ?? 'Theme Park',
    parkChain: data.parkChain ?? 'other',
    passType: data.passType ?? 'unknown',
    passholder: data.passholder ?? '',
    validFrom: data.validFrom ?? '',
    validUntil: data.validUntil ?? '',
    qrData: data.qrData ?? null,
    qrFormat: data.qrFormat ?? null,
    heroImageUrl: data.heroImageUrl ?? null,
  };
}

// ============================================
// Storage Upload
// ============================================

/**
 * Upload the .pkpass buffer to Cloud Storage and return a signed download URL.
 */
async function uploadAndGetUrl(
  uid: string,
  ticketId: string,
  style: string,
  passBuffer: Buffer,
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const bucket = getStorage().bucket();
  const filename = `apple-wallet-passes/${uid}/${ticketId}-${style}.pkpass`;
  const file = bucket.file(filename);

  await file.save(passBuffer, {
    contentType: 'application/vnd.apple.pkpass',
    metadata: {
      cacheControl: 'private, max-age=3600',
    },
  });

  // Generate signed URL valid for 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: expiresAt,
  });

  return {
    downloadUrl: signedUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

// ============================================
// Cloud Function
// ============================================

export const generatePKPass = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (request): Promise<GeneratePKPassResponse> => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to generate a pass.');
    }

    const uid = request.auth.uid;
    const { ticketId, style } = validateRequest(request.data);

    // Read ticket from Firestore
    const ticket = await getTicket(uid, ticketId);

    // Build the PKPass
    let passBuffer: Buffer;
    try {
      passBuffer = await buildPKPass({
        ticket,
        style,
        userId: uid,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a certificate configuration error
      if (message.includes('certificates not found')) {
        throw new HttpsError(
          'failed-precondition',
          'Apple Wallet certificates are not configured. ' +
          'Please upload Pass Type ID certificates to Cloud Storage.',
        );
      }

      throw new HttpsError('internal', `Failed to generate pass: ${message}`);
    }

    // Upload to Cloud Storage and get signed URL
    const { downloadUrl, expiresAt } = await uploadAndGetUrl(
      uid,
      ticketId,
      style,
      passBuffer,
    );

    return { downloadUrl, expiresAt };
  },
);
