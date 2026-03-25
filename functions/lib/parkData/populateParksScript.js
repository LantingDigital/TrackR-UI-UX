"use strict";
/**
 * Standalone script to populate Firestore with ThemeParks.wiki data.
 *
 * Run with: npx ts-node src/parkData/populateParksScript.ts
 * (from functions/ directory, with Firebase credentials configured)
 *
 * OR: compile first with `npm run build`, then `node lib/parkData/populateParksScript.js`
 *
 * Requires:
 * - Firebase Admin SDK initialized (uses application default credentials or service account)
 * - Network access to api.themeparks.wiki
 *
 * This script does the same work as the `populateParks` Cloud Function but runs locally.
 * Useful for initial data seeding without deploying the CF.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const themeparksWiki_1 = require("../services/themeparksWiki");
// Initialize Firebase Admin if not already initialized
if ((0, app_1.getApps)().length === 0) {
    // Try service account key first, fall back to application default credentials
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath);
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
            projectId: 'trackr-coaster-app',
        });
    }
    else {
        (0, app_1.initializeApp)({ projectId: 'trackr-coaster-app' });
    }
}
// ============================================
// Helpers (same as populateParks.ts)
// ============================================
function extractTags(entity) {
    if (!entity.tags)
        return [];
    return entity.tags.map((t) => t.value || t.id).filter(Boolean);
}
function toCoords(entity) {
    if (!entity.location)
        return null;
    return { lat: entity.location.latitude, lng: entity.location.longitude };
}
function estimateRadiusMeters(parkName) {
    const name = parkName.toLowerCase();
    if (name.includes('magic kingdom') || name.includes('epcot') ||
        name.includes('animal kingdom') || name.includes('hollywood studios') ||
        name.includes('disneyland') || name.includes('disney california') ||
        name.includes('disney adventure') || name.includes('epic universe') ||
        name.includes('tokyo disney'))
        return 1000;
    if (name.includes('cedar point') || name.includes('six flags magic mountain') ||
        name.includes('kings island') || name.includes('busch gardens') ||
        name.includes('europa-park') || name.includes('efteling') ||
        name.includes('universal'))
        return 800;
    if (name.includes('water') || name.includes('soak') ||
        name.includes('hurricane harbor') || name.includes('aquatic') ||
        name.includes('typhoon lagoon') || name.includes('blizzard beach') ||
        name.includes('volcano bay'))
        return 400;
    return 600;
}
function generateMockLocation(center) {
    return { lat: center.lat + 0.0004, lng: center.lng + 0.0004 };
}
// ============================================
// Main
// ============================================
async function main() {
    const db = (0, firestore_1.getFirestore)();
    const stats = {
        destinations: 0,
        parks: 0,
        attractions: 0,
        restaurants: 0,
        shows: 0,
        errors: [],
    };
    console.log('Fetching all destinations from ThemeParks.wiki...');
    const destinations = await (0, themeparksWiki_1.getAllDestinations)();
    stats.destinations = destinations.length;
    console.log(`Found ${destinations.length} destinations\n`);
    for (const dest of destinations) {
        console.log(`\n=== ${dest.name} (${dest.parks.length} parks) ===`);
        for (const parkRef of dest.parks) {
            try {
                const parkEntity = await (0, themeparksWiki_1.getEntity)(parkRef.id);
                const parkCoords = toCoords(parkEntity);
                if (!parkCoords) {
                    const msg = `${parkRef.name}: no GPS coordinates, skipping`;
                    stats.errors.push(msg);
                    console.warn(`  SKIP: ${msg}`);
                    continue;
                }
                const parkDocId = parkRef.id;
                // Write park document
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
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
                stats.parks++;
                // Fetch children
                const children = await (0, themeparksWiki_1.getEntityChildren)(parkRef.id);
                let batch = db.batch();
                let batchCount = 0;
                let aCount = 0, rCount = 0, sCount = 0;
                for (const child of children) {
                    const coords = toCoords(child);
                    const tags = extractTags(child);
                    if (child.entityType === 'ATTRACTION') {
                        batch.set(db.doc(`parks/${parkDocId}/attractions/${child.id}`), {
                            name: child.name,
                            entityId: child.id,
                            coordinates: coords,
                            tags,
                            entityType: 'ATTRACTION',
                            createdAt: firestore_1.FieldValue.serverTimestamp(),
                        }, { merge: true });
                        stats.attractions++;
                        aCount++;
                    }
                    else if (child.entityType === 'RESTAURANT') {
                        batch.set(db.doc(`parks/${parkDocId}/restaurants/${child.id}`), {
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
                            createdAt: firestore_1.FieldValue.serverTimestamp(),
                        }, { merge: true });
                        stats.restaurants++;
                        rCount++;
                    }
                    else if (child.entityType === 'SHOW') {
                        batch.set(db.doc(`parks/${parkDocId}/shows/${child.id}`), {
                            name: child.name,
                            entityId: child.id,
                            coordinates: coords,
                            entityType: 'SHOW',
                            tags,
                            createdAt: firestore_1.FieldValue.serverTimestamp(),
                        }, { merge: true });
                        stats.shows++;
                        sCount++;
                    }
                    batchCount++;
                    if (batchCount >= 450) {
                        await batch.commit();
                        batch = db.batch();
                        batchCount = 0;
                    }
                }
                // Write geofence
                batch.set(db.doc(`parks/${parkDocId}/geofence/config`), {
                    center: parkCoords,
                    radiusMeters: estimateRadiusMeters(parkEntity.name),
                    parkName: parkEntity.name,
                    testMockLocation: generateMockLocation(parkCoords),
                });
                if (batchCount > 0) {
                    await batch.commit();
                }
                console.log(`  ${parkEntity.name}: ${aCount}A ${rCount}R ${sCount}S (${children.length} total)`);
                // Rate limit buffer
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
            catch (err) {
                const msg = `${parkRef.name}: ${err instanceof Error ? err.message : String(err)}`;
                stats.errors.push(msg);
                console.error(`  ERROR: ${msg}`);
            }
        }
    }
    console.log('\n========================================');
    console.log('POPULATION COMPLETE');
    console.log(`  Destinations: ${stats.destinations}`);
    console.log(`  Parks: ${stats.parks}`);
    console.log(`  Attractions: ${stats.attractions}`);
    console.log(`  Restaurants: ${stats.restaurants}`);
    console.log(`  Shows: ${stats.shows}`);
    console.log(`  Errors: ${stats.errors.length}`);
    if (stats.errors.length > 0) {
        console.log('\nErrors:');
        for (const err of stats.errors) {
            console.log(`  - ${err}`);
        }
    }
    process.exit(0);
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=populateParksScript.js.map