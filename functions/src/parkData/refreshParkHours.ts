/**
 * refreshParkHours — Scheduled Cloud Function
 *
 * Runs daily at 5am ET. Pulls schedule data from ThemeParks.wiki
 * for ALL parks and writes to parks/{parkId}/hours/{date}.
 *
 * Also pulls today's live hours for real-time accuracy.
 * Hours stored in park's LOCAL timezone (not UTC, not user's timezone).
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getEntitySchedule } from '../services/themeparksWiki';

// ============================================
// Types
// ============================================

interface HoursDoc {
  date: string; // YYYY-MM-DD
  open: string | null; // e.g., "10:00"
  close: string | null; // e.g., "22:00"
  timezone: string; // e.g., "America/New_York"
  displayString: string; // e.g., "Open today 10am-10pm ET"
  isClosed: boolean;
  specialEvent: string | null;
  extraHours: { type: string; open: string; close: string }[] | null;
  lastUpdated: FieldValue;
  source: 'themeparks-wiki';
}

// ============================================
// Helpers
// ============================================

/** Extract time portion (HH:mm) from ISO datetime string */
function extractTime(isoString: string): string {
  // Format: 2026-03-24T09:00:00-04:00
  const match = isoString.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : isoString;
}

/** Extract date (YYYY-MM-DD) from ISO datetime string */
function extractDate(isoString: string): string {
  return isoString.substring(0, 10);
}

/** Format time for display: "10:00" -> "10am", "22:00" -> "10pm" */
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  if (minutes === 0) return `${hours12}${period}`;
  return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
}

/** Get short timezone abbreviation */
function getTimezoneAbbrev(tz: string): string {
  const abbrevMap: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Phoenix': 'MST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Amsterdam': 'CET',
    'Europe/Berlin': 'CET',
    'Europe/Copenhagen': 'CET',
    'Europe/Madrid': 'CET',
    'Europe/Rome': 'CET',
    'Europe/Stockholm': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Seoul': 'KST',
    'Asia/Shanghai': 'CST',
    'Asia/Hong_Kong': 'HKT',
    'Australia/Brisbane': 'AEST',
    'Australia/Sydney': 'AEST',
  };
  return abbrevMap[tz] || tz.split('/').pop()?.replace(/_/g, ' ') || tz;
}

/** Build display string like "Open today 10am-10pm ET" */
function buildDisplayString(
  open: string | null,
  close: string | null,
  timezone: string,
  isClosed: boolean,
): string {
  if (isClosed) return 'Closed today';
  if (!open || !close) return 'Hours unavailable';
  const tzAbbrev = getTimezoneAbbrev(timezone);
  return `Open today ${formatTimeDisplay(open)}-${formatTimeDisplay(close)} ${tzAbbrev}`;
}

// ============================================
// Core Logic
// ============================================

async function refreshHoursForAllParks(): Promise<{
  processed: number;
  errors: string[];
}> {
  const db = getFirestore();
  const errors: string[] = [];
  let processed = 0;

  // Get all parks from Firestore
  const parksSnap = await db.collection('parks').get();
  console.log(`[refreshParkHours] Processing ${parksSnap.size} parks`);

  for (const parkDoc of parksSnap.docs) {
    const parkData = parkDoc.data();
    const parkId = parkDoc.id; // ThemeParks.wiki entity ID
    const timezone = parkData.timezone || 'UTC';

    try {
      // Fetch schedule from ThemeParks.wiki
      const schedule = await getEntitySchedule(parkId);

      // Group schedule entries by date
      const byDate = new Map<
        string,
        {
          operating: { open: string; close: string } | null;
          extraHours: { type: string; open: string; close: string }[];
          specialEvent: string | null;
        }
      >();

      for (const entry of schedule) {
        const date = entry.openingTime ? extractDate(entry.openingTime) : entry.date;
        if (!byDate.has(date)) {
          byDate.set(date, { operating: null, extraHours: [], specialEvent: null });
        }
        const dayData = byDate.get(date)!;

        if (entry.type === 'OPERATING' && entry.openingTime && entry.closingTime) {
          dayData.operating = {
            open: extractTime(entry.openingTime),
            close: extractTime(entry.closingTime),
          };
        } else if (entry.type === 'EXTRA_HOURS' && entry.openingTime && entry.closingTime) {
          dayData.extraHours.push({
            type: 'EXTRA_HOURS',
            open: extractTime(entry.openingTime),
            close: extractTime(entry.closingTime),
          });
        } else if (entry.type === 'TICKETED_EVENT') {
          dayData.specialEvent = entry.description || 'Special Event';
        }
      }

      // Write hours documents
      const batch = db.batch();
      let batchCount = 0;

      for (const [date, dayData] of byDate) {
        const isClosed = !dayData.operating;
        const hoursDoc: HoursDoc = {
          date,
          open: dayData.operating?.open || null,
          close: dayData.operating?.close || null,
          timezone,
          displayString: buildDisplayString(
            dayData.operating?.open || null,
            dayData.operating?.close || null,
            timezone,
            isClosed,
          ),
          isClosed,
          specialEvent: dayData.specialEvent,
          extraHours: dayData.extraHours.length > 0 ? dayData.extraHours : null,
          lastUpdated: FieldValue.serverTimestamp(),
          source: 'themeparks-wiki',
        };

        batch.set(db.doc(`parks/${parkId}/hours/${date}`), hoursDoc, { merge: true });
        batchCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      processed++;

      // Small delay between parks
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (err) {
      const msg = `${parkData.name || parkId}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`[refreshParkHours] Error for ${parkData.name}:`, err);
    }
  }

  return { processed, errors };
}

// ============================================
// Scheduled Function (daily at 5am ET)
// ============================================

export const refreshParkHoursScheduled = onSchedule(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
    schedule: '0 5 * * *',
    timeZone: 'America/New_York',
  },
  async () => {
    console.log('[refreshParkHours] Scheduled run starting...');
    const result = await refreshHoursForAllParks();
    console.log(
      `[refreshParkHours] Done. Processed: ${result.processed}, Errors: ${result.errors.length}`,
    );
    if (result.errors.length > 0) {
      console.error('[refreshParkHours] Errors:', result.errors.join('; '));
    }
  },
);

// ============================================
// Manual trigger (admin-callable)
// ============================================

export const refreshParkHoursManual = onCall(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 540,
  },
  async (request) => {
    if (!request.auth?.token?.admin) {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }

    console.log('[refreshParkHours] Manual run starting...');
    const result = await refreshHoursForAllParks();
    return result;
  },
);
