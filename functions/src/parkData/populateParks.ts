/**
 * populateParks — Callable Cloud Function
 *
 * Fetches ALL parks from ThemeParks.wiki and populates Firestore:
 * - parks/{parkId} — park metadata (name, GPS, timezone, tags)
 * - parks/{parkId}/attractions/{attractionId} — all attractions with GPS + tags
 * - parks/{parkId}/restaurants/{restaurantId} — all restaurants with GPS + tags
 * - parks/{parkId}/shows/{showId} — all shows with GPS + tags
 * - parks/{parkId}/geofence — circular geofence (center + radius + test location)
 *
 * This is an admin-only function for initial data seeding.
 * Caleb triggers it once, then daily refresh handles updates.
 *
 * Rate limit: ThemeParks.wiki allows 300 req/min. We process parks
 * sequentially with small delays to stay well under.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  getAllDestinations,
  getEntity,
  getEntityChildren,
  type ThemeParksEntity,
} from '../services/themeparksWiki';

// ============================================
// Types
// ============================================

interface ParkDoc {
  name: string;
  entityId: string;
  destinationId: string;
  destinationName: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  slug: string;
  entityType: 'PARK';
  tags: string[];
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

interface AttractionDoc {
  name: string;
  entityId: string;
  coordinates: { lat: number; lng: number } | null;
  tags: string[];
  entityType: 'ATTRACTION';
  createdAt: FieldValue;
}

interface RestaurantDoc {
  name: string;
  entityId: string;
  coordinates: { lat: number; lng: number } | null;
  entityType: 'RESTAURANT';
  cuisineType: string | null;
  menuItems: null;
  menuHighlights: null;
  priceRange: null;
  lastMenuUpdate: null;
  menuSource: null;
  menuDisclaimer: null;
  tags: string[];
  createdAt: FieldValue;
}

interface ShowDoc {
  name: string;
  entityId: string;
  coordinates: { lat: number; lng: number } | null;
  entityType: 'SHOW';
  tags: string[];
  createdAt: FieldValue;
}

interface GeofenceDoc {
  center: { lat: number; lng: number };
  radiusMeters: number;
  parkName: string;
  testMockLocation: { lat: number; lng: number };
}

// ============================================
// Helpers
// ============================================

function extractTags(entity: ThemeParksEntity): string[] {
  if (!entity.tags) return [];
  return entity.tags.map((t) => t.value || t.id).filter(Boolean);
}

function toCoords(entity: ThemeParksEntity): { lat: number; lng: number } | null {
  if (!entity.location) return null;
  return { lat: entity.location.latitude, lng: entity.location.longitude };
}

/**
 * Estimate geofence radius based on park type/name.
 * Most parks: 500m. Large resort parks: 800-1000m. Small parks: 300m.
 */
function estimateRadiusMeters(parkName: string): number {
  const name = parkName.toLowerCase();

  // Large Disney/Universal resort parks
  if (
    name.includes('magic kingdom') ||
    name.includes('epcot') ||
    name.includes('animal kingdom') ||
    name.includes('hollywood studios') ||
    name.includes('disneyland') ||
    name.includes('disney california') ||
    name.includes('disney adventure') ||
    name.includes('epic universe') ||
    name.includes('tokyo disney')
  ) {
    return 1000;
  }

  // Large regional parks
  if (
    name.includes('cedar point') ||
    name.includes('six flags magic mountain') ||
    name.includes('kings island') ||
    name.includes('busch gardens') ||
    name.includes('europa-park') ||
    name.includes('efteling') ||
    name.includes('universal')
  ) {
    return 800;
  }

  // Water parks (smaller)
  if (
    name.includes('water') ||
    name.includes('soak') ||
    name.includes('hurricane harbor') ||
    name.includes('aquatic') ||
    name.includes('typhoon lagoon') ||
    name.includes('blizzard beach') ||
    name.includes('volcano bay')
  ) {
    return 400;
  }

  // Default for most parks
  return 600;
}

/**
 * Generate a test mock location ~50m inside the geofence center.
 * Offset slightly north-east from center.
 */
function generateMockLocation(center: {
  lat: number;
  lng: number;
}): { lat: number; lng: number } {
  // ~50m north-east offset
  return {
    lat: center.lat + 0.0004,
    lng: center.lng + 0.0004,
  };
}

// ============================================
// Cloud Function
// ============================================

export const populateParks = onCall(
  {
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540, // 9 minutes (max for callable)
  },
  async (request) => {
    // Admin-only
    if (!request.auth?.token?.admin) {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }

    const db = getFirestore();
    const stats = {
      destinations: 0,
      parks: 0,
      attractions: 0,
      restaurants: 0,
      shows: 0,
      errors: [] as string[],
    };

    console.log('[populateParks] Starting full ThemeParks.wiki data fetch...');

    // Step 1: Get all destinations
    const destinations = await getAllDestinations();
    stats.destinations = destinations.length;
    console.log(`[populateParks] Found ${destinations.length} destinations`);

    // Step 2: Process each destination
    for (const dest of destinations) {
      console.log(`[populateParks] Processing destination: ${dest.name} (${dest.parks.length} parks)`);

      for (const parkRef of dest.parks) {
        try {
          // Fetch full park entity data
          const parkEntity = await getEntity(parkRef.id);
          const parkCoords = toCoords(parkEntity);

          if (!parkCoords) {
            stats.errors.push(`${parkRef.name}: no GPS coordinates`);
            continue;
          }

          // Use ThemeParks.wiki entity ID as Firestore document ID
          const parkDocId = parkRef.id;

          // Write park document
          const parkDoc: ParkDoc = {
            name: parkEntity.name,
            entityId: parkEntity.id,
            destinationId: dest.id,
            destinationName: dest.name,
            coordinates: parkCoords,
            timezone: parkEntity.timezone || 'UTC',
            slug: parkEntity.slug || parkEntity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            entityType: 'PARK',
            tags: extractTags(parkEntity),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          await db.doc(`parks/${parkDocId}`).set(parkDoc, { merge: true });
          stats.parks++;

          // Fetch all children (attractions, restaurants, shows)
          const children = await getEntityChildren(parkRef.id);

          // Use batched writes for children (500 per batch max)
          let batch = db.batch();
          let batchCount = 0;

          for (const child of children) {
            const coords = toCoords(child);
            const tags = extractTags(child);

            if (child.entityType === 'ATTRACTION') {
              const doc: AttractionDoc = {
                name: child.name,
                entityId: child.id,
                coordinates: coords,
                tags,
                entityType: 'ATTRACTION',
                createdAt: FieldValue.serverTimestamp(),
              };
              batch.set(db.doc(`parks/${parkDocId}/attractions/${child.id}`), doc, { merge: true });
              stats.attractions++;
            } else if (child.entityType === 'RESTAURANT') {
              const doc: RestaurantDoc = {
                name: child.name,
                entityId: child.id,
                coordinates: coords,
                entityType: 'RESTAURANT',
                cuisineType: null,
                menuItems: null,
                menuHighlights: null,
                priceRange: null,
                lastMenuUpdate: null,
                menuSource: null,
                menuDisclaimer: null,
                tags,
                createdAt: FieldValue.serverTimestamp(),
              };
              batch.set(db.doc(`parks/${parkDocId}/restaurants/${child.id}`), doc, { merge: true });
              stats.restaurants++;
            } else if (child.entityType === 'SHOW') {
              const doc: ShowDoc = {
                name: child.name,
                entityId: child.id,
                coordinates: coords,
                entityType: 'SHOW',
                tags,
                createdAt: FieldValue.serverTimestamp(),
              };
              batch.set(db.doc(`parks/${parkDocId}/shows/${child.id}`), doc, { merge: true });
              stats.shows++;
            }

            batchCount++;
            if (batchCount >= 450) {
              await batch.commit();
              batch = db.batch();
              batchCount = 0;
            }
          }

          // Write geofence
          const geofenceDoc: GeofenceDoc = {
            center: parkCoords,
            radiusMeters: estimateRadiusMeters(parkEntity.name),
            parkName: parkEntity.name,
            testMockLocation: generateMockLocation(parkCoords),
          };
          batch.set(db.doc(`parks/${parkDocId}/geofence/config`), geofenceDoc);

          // Commit remaining batch
          if (batchCount > 0) {
            await batch.commit();
          }

          console.log(
            `[populateParks] ${parkEntity.name}: ${children.length} children written`,
          );

          // Small delay between parks to respect rate limit
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          const msg = `${parkRef.name}: ${err instanceof Error ? err.message : String(err)}`;
          stats.errors.push(msg);
          console.error(`[populateParks] Error processing ${parkRef.name}:`, err);
        }
      }
    }

    console.log('[populateParks] Complete!', JSON.stringify(stats));
    return stats;
  },
);
