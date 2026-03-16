#!/usr/bin/env node
// ============================================
// Generate OSM Walkway Graphs — Batch version
//
// Queries parks individually with automatic retry.
// Saves progress to a JSON cache so failed parks
// can be retried without re-fetching successful ones.
//
// Usage:
//   node scripts/generate-osm-graphs-batch.js          # fetch all missing
//   node scripts/generate-osm-graphs-batch.js --force  # re-fetch everything
//   node scripts/generate-osm-graphs-batch.js --emit   # just emit TS from cache
// ============================================

const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, '.osm-cache.json');
const OUTPUT_PATH = path.join(
  __dirname, '..', 'src', 'features', 'parks', 'map', 'osm', 'osmGraphData.ts',
);

// Park registry — bounding boxes from parkMapRegistry.ts
const PARKS = {
  "knotts-berry-farm": { name: "Knott's Berry Farm", boundsSW: [-118.0040, 33.8385], boundsNE: [-117.9960, 33.8490] },
  "cedar-point": { name: "Cedar Point", boundsSW: [-82.6950, 41.4750], boundsNE: [-82.6720, 41.4880] },
  "kings-island": { name: "Kings Island", boundsSW: [-84.2800, 39.3380], boundsNE: [-84.2580, 39.3520] },
  "carowinds": { name: "Carowinds", boundsSW: [-80.9530, 35.0970], boundsNE: [-80.9310, 35.1110] },
  "six-flags-magic-mountain": { name: "Six Flags Magic Mountain", boundsSW: [-118.6080, 34.4180], boundsNE: [-118.5860, 34.4330] },
  "universal-studios-hollywood": { name: "Universal Studios Hollywood", boundsSW: [-118.3640, 34.1320], boundsNE: [-118.3430, 34.1440] },
  "six-flags-great-adventure": { name: "Six Flags Great Adventure", boundsSW: [-74.4520, 40.1300], boundsNE: [-74.4300, 40.1450] },
  "busch-gardens-tampa": { name: "Busch Gardens Tampa Bay", boundsSW: [-82.4290, 28.0300], boundsNE: [-82.4100, 28.0440] },
  "hersheypark": { name: "Hersheypark", boundsSW: [-76.6640, 40.2810], boundsNE: [-76.6470, 40.2930] },
  "dollywood": { name: "Dollywood", boundsSW: [-83.5390, 35.7900], boundsNE: [-83.5230, 35.8010] },
  "islands-of-adventure": { name: "Islands of Adventure", boundsSW: [-81.4780, 28.4660], boundsNE: [-81.4600, 28.4780] },
  "magic-kingdom": { name: "Magic Kingdom", boundsSW: [-81.5900, 28.4110], boundsNE: [-81.5730, 28.4240] },
  "epic-universe": { name: "Universal Epic Universe", boundsSW: [-81.4550, 28.4690], boundsNE: [-81.4400, 28.4790] },
  "universal-studios-florida": { name: "Universal Studios Florida", boundsSW: [-81.4750, 28.4710], boundsNE: [-81.4580, 28.4800] },
  "six-flags-over-georgia": { name: "Six Flags Over Georgia", boundsSW: [-84.5600, 33.7630], boundsNE: [-84.5430, 33.7740] },
  "disneyland": { name: "Disneyland", boundsSW: [-117.9260, 33.8070], boundsNE: [-117.9120, 33.8170] },
  "busch-gardens-williamsburg": { name: "Busch Gardens Williamsburg", boundsSW: [-76.6520, 37.2270], boundsNE: [-76.6360, 37.2400] },
  "dorney-park": { name: "Dorney Park", boundsSW: [-75.5420, 40.5740], boundsNE: [-75.5270, 40.5830] },
  "six-flags-great-america": { name: "Six Flags Great America", boundsSW: [-87.9420, 42.3660], boundsNE: [-87.9280, 42.3770] },
  "legoland-california": { name: "LEGOLAND California", boundsSW: [-117.3180, 33.1220], boundsNE: [-117.3040, 33.1310] },
  "seaworld-orlando": { name: "SeaWorld Orlando", boundsSW: [-81.4700, 28.4050], boundsNE: [-81.4530, 28.4170] },
  "seaworld-san-diego": { name: "SeaWorld San Diego", boundsSW: [-117.2340, 32.7610], boundsNE: [-117.2190, 32.7710] },
  "legoland-florida": { name: "LEGOLAND Florida", boundsSW: [-81.6970, 27.9840], boundsNE: [-81.6840, 27.9930] },
  "canadas-wonderland": { name: "Canada's Wonderland", boundsSW: [-79.5490, 43.8370], boundsNE: [-79.5340, 43.8480] },
  "six-flags-fiesta-texas": { name: "Six Flags Fiesta Texas", boundsSW: [-98.6190, 29.5930], boundsNE: [-98.6000, 29.6040] },
  "epcot": { name: "EPCOT", boundsSW: [-81.5560, 28.3670], boundsNE: [-81.5430, 28.3790] },
  "hollywood-studios": { name: "Disney's Hollywood Studios", boundsSW: [-81.5670, 28.3530], boundsNE: [-81.5520, 28.3620] },
  "animal-kingdom": { name: "Disney's Animal Kingdom", boundsSW: [-81.5980, 28.3500], boundsNE: [-81.5820, 28.3610] },
};

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function queryOverpass(park, urlIdx = 0) {
  const [swLng, swLat] = park.boundsSW;
  const [neLng, neLat] = park.boundsNE;
  const bbox = `${swLat},${swLng},${neLat},${neLng}`;
  const query = `[out:json][timeout:60];way["highway"~"footway|path|pedestrian|steps|service"](${bbox});(._;>;);out body;`;
  const url = OVERPASS_URLS[urlIdx % OVERPASS_URLS.length];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

function buildGraph(overpassData) {
  const nodeCoords = new Map();
  for (const el of overpassData.elements) {
    if (el.type === 'node') nodeCoords.set(el.id, { lat: el.lat, lng: el.lon });
  }

  const ways = overpassData.elements.filter((el) => el.type === 'way');
  const nodeWayCount = new Map();
  for (const way of ways) {
    for (const nodeId of way.nodes) {
      nodeWayCount.set(nodeId, (nodeWayCount.get(nodeId) || 0) + 1);
    }
  }

  const graphNodeIds = new Set();
  const edges = [];

  for (const way of ways) {
    const nodes = way.nodes;
    if (nodes.length < 2) continue;

    graphNodeIds.add(nodes[0]);
    graphNodeIds.add(nodes[nodes.length - 1]);

    for (const nid of nodes) {
      if (nodeWayCount.get(nid) > 1) graphNodeIds.add(nid);
    }

    // Add intermediate nodes every ~30m
    let accumDist = 0;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodeCoords.get(nodes[i - 1]);
      const curr = nodeCoords.get(nodes[i]);
      if (!prev || !curr) continue;
      accumDist += haversine(prev.lat, prev.lng, curr.lat, curr.lng);
      if (accumDist > 30 || graphNodeIds.has(nodes[i])) {
        graphNodeIds.add(nodes[i]);
        accumDist = 0;
      }
    }

    // Build edges between consecutive graph nodes
    let segStart = 0;
    for (let i = 1; i < nodes.length; i++) {
      if (graphNodeIds.has(nodes[i])) {
        let dist = 0;
        for (let j = segStart; j < i; j++) {
          const a = nodeCoords.get(nodes[j]);
          const b = nodeCoords.get(nodes[j + 1]);
          if (a && b) dist += haversine(a.lat, a.lng, b.lat, b.lng);
        }
        if (dist > 0) {
          edges.push({
            from: `osm-${nodes[segStart]}`,
            to: `osm-${nodes[i]}`,
            weight: Math.round(dist * 100) / 100,
          });
        }
        segStart = i;
      }
    }
  }

  const graphNodes = [];
  for (const nid of graphNodeIds) {
    const coords = nodeCoords.get(nid);
    if (!coords) continue;
    graphNodes.push({
      id: `osm-${nid}`,
      lat: Math.round(coords.lat * 1e7) / 1e7,
      lng: Math.round(coords.lng * 1e7) / 1e7,
    });
  }

  return { nodes: graphNodes, edges };
}

function loadCache() {
  if (fs.existsSync(CACHE_PATH)) {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf-8');
}

function emitTypeScript(cache) {
  const lines = [];
  lines.push('// ============================================');
  lines.push('// OSM Walkway Graph Data (AUTO-GENERATED)');
  lines.push('//');
  lines.push('// Do not edit manually. Regenerate with:');
  lines.push('//   node scripts/generate-osm-graphs-batch.js');
  lines.push('//');
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('// ============================================');
  lines.push('');
  lines.push('export interface OsmGraphNode {');
  lines.push('  id: string;');
  lines.push('  lat: number;');
  lines.push('  lng: number;');
  lines.push('}');
  lines.push('');
  lines.push('export interface OsmGraphEdge {');
  lines.push('  from: string;');
  lines.push('  to: string;');
  lines.push('  weight: number; // meters');
  lines.push('}');
  lines.push('');
  lines.push('export interface OsmGraph {');
  lines.push('  nodes: OsmGraphNode[];');
  lines.push('  edges: OsmGraphEdge[];');
  lines.push('}');
  lines.push('');
  lines.push('const OSM_GRAPHS: Record<string, OsmGraph> = {');

  let totalNodes = 0, totalEdges = 0;
  for (const [slug, graph] of Object.entries(cache)) {
    if (!graph.nodes || graph.nodes.length === 0) continue;
    lines.push(`  '${slug}': {`);
    lines.push('    nodes: [');
    for (const n of graph.nodes) {
      lines.push(`      { id: '${n.id}', lat: ${n.lat}, lng: ${n.lng} },`);
    }
    lines.push('    ],');
    lines.push('    edges: [');
    for (const e of graph.edges) {
      lines.push(`      { from: '${e.from}', to: '${e.to}', weight: ${e.weight} },`);
    }
    lines.push('    ],');
    lines.push('  },');
    totalNodes += graph.nodes.length;
    totalEdges += graph.edges.length;
  }

  lines.push('};');
  lines.push('');
  lines.push('/** Get the OSM walkway graph for a park by slug. Returns null if no data. */');
  lines.push('export function getOsmGraph(parkSlug: string): OsmGraph | null {');
  lines.push('  return OSM_GRAPHS[parkSlug] ?? null;');
  lines.push('}');
  lines.push('');

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf-8');
  const parkCount = Object.values(cache).filter(g => g.nodes && g.nodes.length > 0).length;
  console.log(`\nEmitted: ${parkCount} parks, ${totalNodes} nodes, ${totalEdges} edges`);
  console.log(`Output: ${OUTPUT_PATH}`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const emitOnly = args.includes('--emit');

  let cache = loadCache();

  if (emitOnly) {
    emitTypeScript(cache);
    return;
  }

  // Determine which parks need fetching
  const needed = Object.entries(PARKS).filter(([slug]) => {
    if (force) return true;
    const cached = cache[slug];
    return !cached || !cached.nodes || cached.nodes.length === 0;
  });

  if (needed.length === 0) {
    console.log('All parks cached. Use --force to re-fetch.');
    emitTypeScript(cache);
    return;
  }

  console.log(`Fetching ${needed.length} parks...`);

  for (const [slug, park] of needed) {
    process.stdout.write(`  ${park.name}... `);

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const data = await queryOverpass(park, attempt);
        const graph = buildGraph(data);
        cache[slug] = graph;
        saveCache(cache);
        console.log(`${graph.nodes.length} nodes, ${graph.edges.length} edges`);
        success = true;
        break;
      } catch (err) {
        if (attempt < 2) {
          process.stdout.write(`retry ${attempt + 2}... `);
          await new Promise((r) => setTimeout(r, 10000 * (attempt + 1)));
        } else {
          console.log(`FAILED after 3 attempts: ${err.message}`);
        }
      }
    }

    // Wait between parks
    await new Promise((r) => setTimeout(r, 4000));
  }

  emitTypeScript(cache);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
