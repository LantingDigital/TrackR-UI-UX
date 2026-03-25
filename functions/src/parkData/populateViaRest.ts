/**
 * Populate Firestore via REST API using Firebase CLI access token.
 * Bypasses the firebase-admin cert requirement.
 *
 * Run: cd functions && npx ts-node src/parkData/populateViaRest.ts
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAllDestinations,
  getEntity,
  getEntityChildren,
  type ThemeParksEntity,
} from '../services/themeparksWiki';

const PROJECT_ID = 'trackr-coaster-app';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Get access token from Firebase CLI
function getAccessToken(): string {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const token = config.tokens?.access_token;
  if (!token) throw new Error('No access token. Run: firebase login --reauth');
  return token;
}

let accessToken = getAccessToken();

// Refresh token if needed
async function refreshAccessToken(): Promise<void> {
  const configPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const refreshToken = config.tokens?.refresh_token;
  if (!refreshToken) throw new Error('No refresh token');

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }),
  });

  if (!resp.ok) throw new Error(`Token refresh failed: ${resp.status}`);
  const data = (await resp.json()) as { access_token: string };
  accessToken = data.access_token;

  // Update stored token
  config.tokens.access_token = accessToken;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ============================================
// Firestore REST API Helpers
// ============================================

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: string;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values: FirestoreValue[] };
  timestampValue?: string;
}

function toFirestoreValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: 'NULL_VALUE' };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'createdAt' || key === 'updatedAt' || key === 'lastUpdated') {
      fields[key] = { timestampValue: new Date().toISOString() };
    } else {
      fields[key] = toFirestoreValue(val);
    }
  }
  return fields;
}

async function firestoreSet(
  docPath: string,
  data: Record<string, unknown>,
  retries = 2,
): Promise<boolean> {
  const url = `${FIRESTORE_BASE}/${docPath}`;
  const body = JSON.stringify({ fields: toFirestoreFields(data) });

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (resp.status === 401 && retries > 0) {
    await refreshAccessToken();
    return firestoreSet(docPath, data, retries - 1);
  }

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Firestore write error ${resp.status} for ${docPath}: ${errText.substring(0, 200)}`);
    return false;
  }

  return true;
}

// Batch commit via REST (up to 200 writes per commit)
interface BatchWrite {
  docPath: string;
  data: Record<string, unknown>;
}

async function firestoreBatchCommit(writes: BatchWrite[], retries = 2): Promise<number> {
  if (writes.length === 0) return 0;

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;

  const body = JSON.stringify({
    writes: writes.map((w) => ({
      update: {
        name: `projects/${PROJECT_ID}/databases/(default)/documents/${w.docPath}`,
        fields: toFirestoreFields(w.data),
      },
    })),
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (resp.status === 401 && retries > 0) {
    await refreshAccessToken();
    return firestoreBatchCommit(writes, retries - 1);
  }

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`Batch commit error ${resp.status}: ${errText.substring(0, 300)}`);
    return 0;
  }

  return writes.length;
}

// ============================================
// Data Helpers
// ============================================

function extractTags(entity: ThemeParksEntity): string[] {
  if (!entity.tags) return [];
  return entity.tags.map((t) => t.value || t.id).filter(Boolean);
}

function toCoords(entity: ThemeParksEntity): { lat: number; lng: number } | null {
  if (!entity.location) return null;
  return { lat: entity.location.latitude, lng: entity.location.longitude };
}

function estimateRadiusMeters(parkName: string): number {
  const name = parkName.toLowerCase();
  if (
    name.includes('magic kingdom') || name.includes('epcot') ||
    name.includes('animal kingdom') || name.includes('hollywood studios') ||
    name.includes('disneyland') || name.includes('disney california') ||
    name.includes('disney adventure') || name.includes('epic universe') ||
    name.includes('tokyo disney')
  ) return 1000;
  if (
    name.includes('cedar point') || name.includes('six flags magic mountain') ||
    name.includes('kings island') || name.includes('busch gardens') ||
    name.includes('europa-park') || name.includes('efteling') ||
    name.includes('universal')
  ) return 800;
  if (
    name.includes('water') || name.includes('soak') ||
    name.includes('hurricane harbor') || name.includes('aquatic') ||
    name.includes('typhoon lagoon') || name.includes('blizzard beach') ||
    name.includes('volcano bay')
  ) return 400;
  return 600;
}

// ============================================
// Main
// ============================================

async function main() {
  // Test connection
  console.log('Testing Firestore REST API connection...');
  const testOk = await firestoreSet('_test/populate_test', { ok: true, ts: new Date().toISOString() });
  if (!testOk) {
    console.error('Connection test failed. Check auth.');
    process.exit(1);
  }
  console.log('Connection OK!\n');

  const stats = { parks: 0, attractions: 0, restaurants: 0, shows: 0, geofences: 0, errors: [] as string[] };

  console.log('Fetching all destinations from ThemeParks.wiki...');
  const destinations = await getAllDestinations();
  console.log(`Found ${destinations.length} destinations\n`);

  for (const dest of destinations) {
    console.log(`\n=== ${dest.name} (${dest.parks.length} parks) ===`);

    for (const parkRef of dest.parks) {
      try {
        const parkEntity = await getEntity(parkRef.id);
        const parkCoords = toCoords(parkEntity);

        if (!parkCoords) {
          stats.errors.push(`${parkRef.name}: no GPS`);
          console.warn(`  SKIP: ${parkRef.name} (no GPS)`);
          continue;
        }

        const parkDocId = parkRef.id;

        // Write park doc
        const parkOk = await firestoreSet(`parks/${parkDocId}`, {
          name: parkEntity.name,
          entityId: parkEntity.id,
          destinationId: dest.id,
          destinationName: dest.name,
          coordinates: parkCoords,
          timezone: parkEntity.timezone || 'UTC',
          slug: parkEntity.slug || parkEntity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          entityType: 'PARK',
          tags: extractTags(parkEntity),
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP',
        });

        if (!parkOk) {
          stats.errors.push(`${parkRef.name}: park write failed`);
          continue;
        }
        stats.parks++;

        // Fetch children
        const children = await getEntityChildren(parkRef.id);

        // Batch writes (200 per commit for REST API)
        const batchWrites: BatchWrite[] = [];
        let aCount = 0, rCount = 0, sCount = 0;

        for (const child of children) {
          const coords = toCoords(child);
          const tags = extractTags(child);

          if (child.entityType === 'ATTRACTION') {
            batchWrites.push({
              docPath: `parks/${parkDocId}/attractions/${child.id}`,
              data: {
                name: child.name, entityId: child.id, coordinates: coords,
                tags, entityType: 'ATTRACTION', createdAt: 'SERVER_TIMESTAMP',
              },
            });
            aCount++;
          } else if (child.entityType === 'RESTAURANT') {
            batchWrites.push({
              docPath: `parks/${parkDocId}/restaurants/${child.id}`,
              data: {
                name: child.name, entityId: child.id, coordinates: coords,
                entityType: 'RESTAURANT', cuisineType: null, menuItems: null,
                menuHighlights: null, priceRange: null, lastMenuUpdate: null,
                menuSource: null, menuDisclaimer: null, tags,
                createdAt: 'SERVER_TIMESTAMP',
              },
            });
            rCount++;
          } else if (child.entityType === 'SHOW') {
            batchWrites.push({
              docPath: `parks/${parkDocId}/shows/${child.id}`,
              data: {
                name: child.name, entityId: child.id, coordinates: coords,
                entityType: 'SHOW', tags, createdAt: 'SERVER_TIMESTAMP',
              },
            });
            sCount++;
          }
        }

        // Add geofence
        batchWrites.push({
          docPath: `parks/${parkDocId}/geofence/config`,
          data: {
            center: parkCoords,
            radiusMeters: estimateRadiusMeters(parkEntity.name),
            parkName: parkEntity.name,
            testMockLocation: { lat: parkCoords.lat + 0.0004, lng: parkCoords.lng + 0.0004 },
          },
        });

        // Commit in chunks of 200
        let written = 0;
        for (let i = 0; i < batchWrites.length; i += 200) {
          const chunk = batchWrites.slice(i, i + 200);
          const count = await firestoreBatchCommit(chunk);
          written += count;
        }

        stats.attractions += aCount;
        stats.restaurants += rCount;
        stats.shows += sCount;
        stats.geofences++;

        console.log(`  ${parkEntity.name}: ${aCount}A ${rCount}R ${sCount}S (${written}/${batchWrites.length} written)`);
        await new Promise((r) => setTimeout(r, 250));
      } catch (err) {
        const msg = `${parkRef.name}: ${err instanceof Error ? err.message : String(err)}`;
        stats.errors.push(msg);
        console.error(`  ERROR: ${msg}`);
      }
    }
  }

  // Clean up test doc
  await fetch(`${FIRESTORE_BASE}/_test/populate_test`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  console.log('\n========================================');
  console.log('POPULATION COMPLETE');
  console.log(`  Parks: ${stats.parks}`);
  console.log(`  Attractions: ${stats.attractions}`);
  console.log(`  Restaurants: ${stats.restaurants}`);
  console.log(`  Shows: ${stats.shows}`);
  console.log(`  Geofences: ${stats.geofences}`);
  console.log(`  Total entities: ${stats.attractions + stats.restaurants + stats.shows}`);
  console.log(`  Errors: ${stats.errors.length}`);
  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach((e) => console.log(`  - ${e}`));
  }

  process.exit(0);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
