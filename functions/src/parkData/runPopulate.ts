/**
 * Populate Firestore with ThemeParks.wiki data.
 * Uses Firebase CLI credentials (refresh token from configstore).
 *
 * Run: cd functions && npx ts-node src/parkData/runPopulate.ts
 */

import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  getAllDestinations,
  getEntity,
  getEntityChildren,
  type ThemeParksEntity,
} from '../services/themeparksWiki';

// Initialize with application default credentials
// Firebase CLI reauth creates ADC that firebase-admin can use
if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'trackr-coaster-app',
  });
}

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

async function main() {
  const db = getFirestore();
  const stats = { destinations: 0, parks: 0, attractions: 0, restaurants: 0, shows: 0, errors: [] as string[] };

  console.log('Fetching all destinations from ThemeParks.wiki...');
  const destinations = await getAllDestinations();
  stats.destinations = destinations.length;
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
        await db.doc(`parks/${parkDocId}`).set({
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
        }, { merge: true });
        stats.parks++;

        const children = await getEntityChildren(parkRef.id);
        let batch = db.batch();
        let batchCount = 0;
        let aCount = 0, rCount = 0, sCount = 0;

        for (const child of children) {
          const coords = toCoords(child);
          const tags = extractTags(child);

          if (child.entityType === 'ATTRACTION') {
            batch.set(db.doc(`parks/${parkDocId}/attractions/${child.id}`), {
              name: child.name, entityId: child.id, coordinates: coords,
              tags, entityType: 'ATTRACTION', createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            stats.attractions++; aCount++;
          } else if (child.entityType === 'RESTAURANT') {
            batch.set(db.doc(`parks/${parkDocId}/restaurants/${child.id}`), {
              name: child.name, entityId: child.id, coordinates: coords,
              entityType: 'RESTAURANT', cuisineType: null, menuItems: null,
              menuHighlights: null, priceRange: null, lastMenuUpdate: null,
              menuSource: null, menuDisclaimer: null, tags,
              createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            stats.restaurants++; rCount++;
          } else if (child.entityType === 'SHOW') {
            batch.set(db.doc(`parks/${parkDocId}/shows/${child.id}`), {
              name: child.name, entityId: child.id, coordinates: coords,
              entityType: 'SHOW', tags, createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            stats.shows++; sCount++;
          }

          batchCount++;
          if (batchCount >= 450) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }

        // Geofence
        batch.set(db.doc(`parks/${parkDocId}/geofence/config`), {
          center: parkCoords,
          radiusMeters: estimateRadiusMeters(parkEntity.name),
          parkName: parkEntity.name,
          testMockLocation: { lat: parkCoords.lat + 0.0004, lng: parkCoords.lng + 0.0004 },
        });

        if (batchCount > 0) await batch.commit();
        console.log(`  ${parkEntity.name}: ${aCount}A ${rCount}R ${sCount}S`);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        const msg = `${parkRef.name}: ${err instanceof Error ? err.message : String(err)}`;
        stats.errors.push(msg);
        console.error(`  ERROR: ${msg}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('DONE');
  console.log(`  Parks: ${stats.parks} | A: ${stats.attractions} | R: ${stats.restaurants} | S: ${stats.shows}`);
  console.log(`  Errors: ${stats.errors.length}`);
  if (stats.errors.length > 0) stats.errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(0);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
