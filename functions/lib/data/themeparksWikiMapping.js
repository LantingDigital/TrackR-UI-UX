"use strict";
/**
 * Queue-Times Park ID → ThemeParks.wiki Entity ID Mapping
 *
 * Maps all 35 parks in queueTimesParkIds.ts (client-side)
 * to their corresponding ThemeParks.wiki entity GUIDs.
 *
 * Generated from ThemeParks.wiki /destinations endpoint (2026-03-24).
 * All 35 parks confirmed present in ThemeParks.wiki.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARK_ID_MAPPING = void 0;
exports.getMappingBySlug = getMappingBySlug;
exports.getMappingByThemeParksWikiId = getMappingByThemeParksWikiId;
exports.getMappingByQueueTimesId = getMappingByQueueTimesId;
exports.PARK_ID_MAPPING = [
    // === Cedar Fair ===
    {
        trackrSlug: 'cedar-point',
        queueTimesId: 50,
        themeparksWikiId: 'c8299e1a-0098-4677-8ead-dd0da204f8dc',
        destinationId: 'ee2ec4b5-3bc3-403c-9e30-7fa607e6311e',
        name: 'Cedar Point',
    },
    {
        trackrSlug: 'kings-island',
        queueTimesId: 60,
        themeparksWikiId: 'a0df8d87-7f72-4545-a58d-eb8aa76f914b',
        destinationId: '694e1f6e-d6a2-4c86-9749-5da1a9cb8924',
        name: 'Kings Island',
    },
    {
        trackrSlug: 'knotts-berry-farm',
        queueTimesId: 61,
        themeparksWikiId: '0a6123bb-1e8c-4b18-a2d3-2696cf2451f5',
        destinationId: 'b1444147-b93a-4f73-b12d-28f9b1f7ec7c',
        name: "Knott's Berry Farm",
    },
    {
        trackrSlug: 'canadas-wonderland',
        queueTimesId: 58,
        themeparksWikiId: '66f5d97a-a530-40bf-a712-a6317c96b06d',
        destinationId: 'b23d90e6-47f4-4258-8690-e74d777fca0f',
        name: "Canada's Wonderland",
    },
    {
        trackrSlug: 'carowinds',
        queueTimesId: 59,
        themeparksWikiId: '24cdcaa8-0500-4340-9725-992865eb18d6',
        destinationId: '025c75ed-80a8-4bba-8b80-192e2ceff58c',
        name: 'Carowinds',
    },
    {
        trackrSlug: 'kings-dominion',
        queueTimesId: 62,
        themeparksWikiId: '95162318-b955-4b7e-b601-a99033aa0279',
        destinationId: '71f82221-5f3e-4e2c-b09c-31c149e0dd59',
        name: 'Kings Dominion',
    },
    {
        trackrSlug: 'dorney-park',
        queueTimesId: 69,
        themeparksWikiId: '19d7f29b-e2e7-4c95-bd12-2d4e37d14ccf',
        destinationId: 'd5f3aa8d-2ef9-4436-9829-b1f6774f592b',
        name: 'Dorney Park',
    },
    {
        trackrSlug: 'worlds-of-fun',
        queueTimesId: 63,
        themeparksWikiId: 'bb731eae-7bd3-4713-bd7b-89d79b031743',
        destinationId: 'c4231018-dc6f-4d8d-bfc2-7a21a6c9e9fa',
        name: 'Worlds of Fun',
    },
    {
        trackrSlug: 'valleyfair',
        queueTimesId: 68,
        themeparksWikiId: '1989dca9-c8d3-43b8-b0dd-e5575f692b95',
        destinationId: 'd4c0e0c4-18c6-4918-a505-209d839c2615',
        name: 'Valleyfair',
    },
    {
        trackrSlug: 'michigan-adventure',
        queueTimesId: 70,
        themeparksWikiId: 'e9805d65-edad-4700-8942-946e6a2b4784',
        destinationId: '6a33b034-2e39-46ea-8808-a06b29b9b2d6',
        name: "Michigan's Adventure",
    },
    // === Six Flags ===
    {
        trackrSlug: 'six-flags-magic-mountain',
        queueTimesId: 32,
        themeparksWikiId: 'c6073ab0-83aa-4e25-8d60-12c8f25684bc',
        destinationId: '17e01e63-d22f-414f-b65b-1786acbd918c',
        name: 'Six Flags Magic Mountain',
    },
    {
        trackrSlug: 'six-flags-great-adventure',
        queueTimesId: 37,
        themeparksWikiId: '556f0126-8082-4b66-aeee-1e3593fed188',
        destinationId: '8d8e39eb-4b0a-48b9-ac67-444dd6e97519',
        name: 'Six Flags Great Adventure',
    },
    {
        trackrSlug: 'six-flags-over-texas',
        queueTimesId: 34,
        themeparksWikiId: '4535960b-45fb-49fb-a38a-59cf602a0a9c',
        destinationId: '5dd95124-888c-449d-9a65-46d7ecc8878c',
        name: 'Six Flags Over Texas',
    },
    {
        trackrSlug: 'six-flags-over-georgia',
        queueTimesId: 35,
        themeparksWikiId: '0c7ab128-259a-4390-93b9-d2e0233dfc16',
        destinationId: 'a8ea944a-5ab7-42ed-bb02-ed08e64f125a',
        name: 'Six Flags Over Georgia',
    },
    {
        trackrSlug: 'six-flags-fiesta-texas',
        queueTimesId: 39,
        themeparksWikiId: '8be1e984-1e5f-40d0-a750-ce8e4dc2e87c',
        destinationId: 'da6388a0-cbfe-49f9-9c63-12e1f63dda62',
        name: 'Six Flags Fiesta Texas',
    },
    {
        trackrSlug: 'six-flags-great-america',
        queueTimesId: 38,
        themeparksWikiId: '15805a4d-4023-4702-b9f2-3d3cab2e0c1e',
        destinationId: '96fc6528-d143-4c6c-a2ac-01e3c1192d21',
        name: 'Six Flags Great America',
    },
    {
        trackrSlug: 'six-flags-new-england',
        queueTimesId: 43,
        themeparksWikiId: 'd553882d-5316-4fca-9530-cc898258aec0',
        destinationId: 'a2cfe9e9-6734-4b9e-90c2-6427fa303e5c',
        name: 'Six Flags New England',
    },
    // === Disney ===
    {
        trackrSlug: 'magic-kingdom',
        queueTimesId: 6,
        themeparksWikiId: '75ea578a-adc8-4116-a54d-dccb60765ef9',
        destinationId: 'e957da41-3552-4cf6-b636-5babc5cbc4e5',
        name: 'Magic Kingdom Park',
    },
    {
        trackrSlug: 'epcot',
        queueTimesId: 5,
        themeparksWikiId: '47f90d2c-e191-4239-a466-5892ef59a88b',
        destinationId: 'e957da41-3552-4cf6-b636-5babc5cbc4e5',
        name: 'EPCOT',
    },
    {
        trackrSlug: 'hollywood-studios',
        queueTimesId: 7,
        themeparksWikiId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        destinationId: 'e957da41-3552-4cf6-b636-5babc5cbc4e5',
        name: "Disney's Hollywood Studios",
    },
    {
        trackrSlug: 'animal-kingdom',
        queueTimesId: 8,
        themeparksWikiId: '1c84a229-8862-4648-9c71-378ddd2c7693',
        destinationId: 'e957da41-3552-4cf6-b636-5babc5cbc4e5',
        name: "Disney's Animal Kingdom Theme Park",
    },
    {
        trackrSlug: 'disneyland',
        queueTimesId: 16,
        themeparksWikiId: '7340550b-c14d-4def-80bb-acdb51d49a66',
        destinationId: 'bfc89fd6-314d-44b4-b89e-df1a89cf991e',
        name: 'Disneyland Park',
    },
    {
        trackrSlug: 'disney-california-adventure',
        queueTimesId: 17,
        themeparksWikiId: '832fcd51-ea19-4e77-85c7-75d5843b127c',
        destinationId: 'bfc89fd6-314d-44b4-b89e-df1a89cf991e',
        name: 'Disney California Adventure Park',
    },
    // === Universal ===
    {
        trackrSlug: 'universal-studios-florida',
        queueTimesId: 65,
        themeparksWikiId: 'eb3f4560-2383-4a36-9152-6b3e5ed6bc57',
        destinationId: '89db5d43-c434-4097-b71f-f6869f495a22',
        name: 'Universal Studios Florida',
    },
    {
        trackrSlug: 'islands-of-adventure',
        queueTimesId: 64,
        themeparksWikiId: '267615cc-8943-4c2a-ae2c-5da728ca591f',
        destinationId: '89db5d43-c434-4097-b71f-f6869f495a22',
        name: 'Universal Islands of Adventure',
    },
    {
        trackrSlug: 'epic-universe',
        queueTimesId: 334,
        themeparksWikiId: '12dbb85b-265f-44e6-bccf-f1faa17211fc',
        destinationId: '89db5d43-c434-4097-b71f-f6869f495a22',
        name: 'Universals Epic Universe',
    },
    {
        trackrSlug: 'universal-studios-hollywood',
        queueTimesId: 66,
        themeparksWikiId: 'bc4005c5-8c7e-41d7-b349-cdddf1796427',
        destinationId: '9fc68f1c-3f5e-4f09-89f2-aab2cf1a0741',
        name: 'Universal Studios',
    },
    // === SeaWorld / Busch Gardens ===
    {
        trackrSlug: 'seaworld-orlando',
        queueTimesId: 21,
        themeparksWikiId: '27d64dee-d85e-48dc-ad6d-8077445cd946',
        destinationId: '643e837e-b244-4663-8d3a-148c26ecba9c',
        name: 'SeaWorld Orlando',
    },
    {
        trackrSlug: 'seaworld-san-diego',
        queueTimesId: 20,
        themeparksWikiId: '75122979-ddea-414d-b633-6b09042a227c',
        destinationId: '1f1f9558-4e81-48a7-aad5-9879b633802b',
        name: 'SeaWorld San Diego',
    },
    {
        trackrSlug: 'busch-gardens-tampa',
        queueTimesId: 24,
        themeparksWikiId: 'fc40c99a-be0a-42f4-a483-1e939db275c2',
        destinationId: '1d92560c-474f-4425-906d-e9dd2f2da6ca',
        name: 'Busch Gardens Tampa',
    },
    {
        trackrSlug: 'busch-gardens-williamsburg',
        queueTimesId: 23,
        themeparksWikiId: '98f634cd-c388-439c-b309-960f9475b84d',
        destinationId: '0704cf65-5c67-42f3-a054-f45e03a412cf',
        name: 'Busch Gardens Williamsburg',
    },
    // === Other Major Parks ===
    {
        trackrSlug: 'hersheypark',
        queueTimesId: 15,
        themeparksWikiId: '0f044655-cd94-4bb8-a8e3-c789f4eca787',
        destinationId: '6e1c96c1-dafc-4c26-a3d3-1b28c888daa8',
        name: 'Hersheypark',
    },
    {
        trackrSlug: 'dollywood',
        queueTimesId: 55,
        themeparksWikiId: '7502308a-de08-41a3-b997-961f8275ab3c',
        destinationId: '6c3cd0cc-57b5-431b-926c-2658e8104057',
        name: 'Dollywood',
    },
    {
        trackrSlug: 'silver-dollar-city',
        queueTimesId: 10,
        themeparksWikiId: 'd21fac4f-1099-4461-849c-0f8e0d6e85a6',
        destinationId: '8fba5a14-8d04-455c-acf8-eccaaa0f58d9',
        name: 'Silver Dollar City',
    },
    {
        trackrSlug: 'kennywood',
        queueTimesId: 312,
        themeparksWikiId: '3dada5aa-0feb-4a3a-8c2d-685901f256be',
        destinationId: '1dea1b67-0d06-4ad2-9145-8fc1783fd4e8',
        name: 'Kennywood',
    },
];
// Lookup helpers
const bySlug = new Map();
const byThemeParksWikiId = new Map();
const byQueueTimesId = new Map();
for (const m of exports.PARK_ID_MAPPING) {
    bySlug.set(m.trackrSlug, m);
    byThemeParksWikiId.set(m.themeparksWikiId, m);
    byQueueTimesId.set(m.queueTimesId, m);
}
function getMappingBySlug(slug) {
    return bySlug.get(slug);
}
function getMappingByThemeParksWikiId(id) {
    return byThemeParksWikiId.get(id);
}
function getMappingByQueueTimesId(id) {
    return byQueueTimesId.get(id);
}
//# sourceMappingURL=themeparksWikiMapping.js.map