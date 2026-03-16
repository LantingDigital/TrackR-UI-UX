#!/usr/bin/env npx tsx
// ============================================
// Generate Park Walkway Graph from OSM Data
//
// Queries the Overpass API for footways/paths within
// a park's bounding box, builds a walkway graph with
// intersection nodes and edges, normalizes coordinates
// to 0-1 x/y space, and outputs a ready-to-use
// TypeScript file matching the UnifiedParkMapData format.
//
// Usage:
//   npx tsx scripts/generate-park-graph.ts --park "magic-mountain" --bounds "34.42,-118.60,34.43,-118.59"
//   npx tsx scripts/generate-park-graph.ts --park "magic-mountain"   # uses registry bounds
//   npx tsx scripts/generate-park-graph.ts --park "magic-mountain" --dry-run
//   npx tsx scripts/generate-park-graph.ts --park "magic-mountain" --output ./my-output.ts
//
// Flags:
//   --park     Park slug (required). Matches parkMapRegistry slugs.
//   --bounds   "south,west,north,east" lat/lng. Optional if park is in registry.
//   --dry-run  Show query and stats without writing files.
//   --output   Custom output path (default: src/features/parks/data/<slug>MapData.generated.ts)
//   --density  Node density: "low" | "medium" | "high" (default: medium).
//              Controls how many intermediate nodes are kept on long straight paths.
//   --include-service  Include highway=service ways (parking lots, access roads).
// ============================================

// ---- Types ----

interface CliArgs {
  park: string;
  bounds?: { south: number; west: number; north: number; east: number };
  dryRun: boolean;
  output?: string;
  density: 'low' | 'medium' | 'high';
  includeService: boolean;
}

interface OsmNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OsmWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

type OsmElement = OsmNode | OsmWay;

interface OsmResponse {
  version: number;
  generator: string;
  osm3s: { timestamp_osm_base: string };
  elements: OsmElement[];
}

interface LatLng {
  lat: number;
  lng: number;
}

interface GraphNode {
  osmId: number;
  lat: number;
  lng: number;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
}

interface GraphEdge {
  fromOsmId: number;
  toOsmId: number;
  weight: number; // meters
}

interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  wayCount: number;
  rawNodeCount: number;
}

// ---- Registry (matches parkMapRegistry.ts) ----

interface RegistryEntry {
  name: string;
  slug: string;
  boundsNE: [number, number]; // [lng, lat]
  boundsSW: [number, number]; // [lng, lat]
}

const REGISTRY: Record<string, RegistryEntry> = {
  'knotts-berry-farm': { name: "Knott's Berry Farm", slug: 'knotts-berry-farm', boundsSW: [-118.0040, 33.8385], boundsNE: [-117.9960, 33.8490] },
  'cedar-point': { name: 'Cedar Point', slug: 'cedar-point', boundsSW: [-82.6950, 41.4750], boundsNE: [-82.6720, 41.4880] },
  'kings-island': { name: 'Kings Island', slug: 'kings-island', boundsSW: [-84.2800, 39.3380], boundsNE: [-84.2580, 39.3520] },
  'carowinds': { name: 'Carowinds', slug: 'carowinds', boundsSW: [-80.9530, 35.0970], boundsNE: [-80.9310, 35.1110] },
  'six-flags-magic-mountain': { name: 'Six Flags Magic Mountain', slug: 'six-flags-magic-mountain', boundsSW: [-118.6080, 34.4180], boundsNE: [-118.5860, 34.4330] },
  'universal-studios-hollywood': { name: 'Universal Studios Hollywood', slug: 'universal-studios-hollywood', boundsSW: [-118.3640, 34.1320], boundsNE: [-118.3430, 34.1440] },
  'six-flags-great-adventure': { name: 'Six Flags Great Adventure', slug: 'six-flags-great-adventure', boundsSW: [-74.4520, 40.1300], boundsNE: [-74.4300, 40.1450] },
  'busch-gardens-tampa': { name: 'Busch Gardens Tampa Bay', slug: 'busch-gardens-tampa', boundsSW: [-82.4290, 28.0300], boundsNE: [-82.4100, 28.0440] },
  'hersheypark': { name: 'Hersheypark', slug: 'hersheypark', boundsSW: [-76.6640, 40.2810], boundsNE: [-76.6470, 40.2930] },
  'dollywood': { name: 'Dollywood', slug: 'dollywood', boundsSW: [-83.5390, 35.7900], boundsNE: [-83.5230, 35.8010] },
  'islands-of-adventure': { name: 'Islands of Adventure', slug: 'islands-of-adventure', boundsSW: [-81.4780, 28.4660], boundsNE: [-81.4600, 28.4780] },
  'magic-kingdom': { name: 'Magic Kingdom', slug: 'magic-kingdom', boundsSW: [-81.5900, 28.4110], boundsNE: [-81.5730, 28.4240] },
  'epic-universe': { name: 'Universal Epic Universe', slug: 'epic-universe', boundsSW: [-81.4550, 28.4690], boundsNE: [-81.4400, 28.4790] },
  'universal-studios-florida': { name: 'Universal Studios Florida', slug: 'universal-studios-florida', boundsSW: [-81.4750, 28.4710], boundsNE: [-81.4580, 28.4800] },
  'six-flags-over-georgia': { name: 'Six Flags Over Georgia', slug: 'six-flags-over-georgia', boundsSW: [-84.5600, 33.7630], boundsNE: [-84.5430, 33.7740] },
  'disneyland': { name: 'Disneyland', slug: 'disneyland', boundsSW: [-117.9260, 33.8070], boundsNE: [-117.9120, 33.8170] },
  'busch-gardens-williamsburg': { name: 'Busch Gardens Williamsburg', slug: 'busch-gardens-williamsburg', boundsSW: [-76.6520, 37.2270], boundsNE: [-76.6360, 37.2400] },
  'dorney-park': { name: 'Dorney Park', slug: 'dorney-park', boundsSW: [-75.5420, 40.5740], boundsNE: [-75.5270, 40.5830] },
  'six-flags-great-america': { name: 'Six Flags Great America', slug: 'six-flags-great-america', boundsSW: [-87.9420, 42.3660], boundsNE: [-87.9280, 42.3770] },
  'legoland-california': { name: 'LEGOLAND California', slug: 'legoland-california', boundsSW: [-117.3180, 33.1220], boundsNE: [-117.3040, 33.1310] },
  'seaworld-orlando': { name: 'SeaWorld Orlando', slug: 'seaworld-orlando', boundsSW: [-81.4700, 28.4050], boundsNE: [-81.4530, 28.4170] },
  'seaworld-san-diego': { name: 'SeaWorld San Diego', slug: 'seaworld-san-diego', boundsSW: [-117.2340, 32.7610], boundsNE: [-117.2190, 32.7710] },
  'legoland-florida': { name: 'LEGOLAND Florida', slug: 'legoland-florida', boundsSW: [-81.6970, 27.9840], boundsNE: [-81.6840, 27.9930] },
  'canadas-wonderland': { name: "Canada's Wonderland", slug: 'canadas-wonderland', boundsSW: [-79.5490, 43.8370], boundsNE: [-79.5340, 43.8480] },
  'six-flags-fiesta-texas': { name: 'Six Flags Fiesta Texas', slug: 'six-flags-fiesta-texas', boundsSW: [-98.6190, 29.5930], boundsNE: [-98.6000, 29.6040] },
  'epcot': { name: 'EPCOT', slug: 'epcot', boundsSW: [-81.5560, 28.3670], boundsNE: [-81.5430, 28.3790] },
  'hollywood-studios': { name: "Disney's Hollywood Studios", slug: 'hollywood-studios', boundsSW: [-81.5670, 28.3530], boundsNE: [-81.5520, 28.3620] },
  'animal-kingdom': { name: "Disney's Animal Kingdom", slug: 'animal-kingdom', boundsSW: [-81.5980, 28.3500], boundsNE: [-81.5820, 28.3610] },
};

// ---- Utility Functions ----

/** Haversine distance in meters between two lat/lng points */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Convert a park slug to a PascalCase variable name prefix */
function slugToPascal(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** Convert a park slug to SCREAMING_SNAKE for the export constant */
function slugToScreamingSnake(slug: string): string {
  return slug.replace(/-/g, '_').toUpperCase();
}

/** Density-based max distance between intermediate graph nodes (meters) */
function getDensityThreshold(density: 'low' | 'medium' | 'high'): number {
  switch (density) {
    case 'low': return 60;
    case 'medium': return 30;
    case 'high': return 15;
  }
}

// ---- CLI Parsing ----

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    park: '',
    dryRun: false,
    density: 'medium',
    includeService: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--park':
        result.park = args[++i] || '';
        break;
      case '--bounds': {
        const parts = (args[++i] || '').split(',').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) {
          console.error('Error: --bounds must be "south,west,north,east" (4 numbers)');
          process.exit(1);
        }
        result.bounds = { south: parts[0], west: parts[1], north: parts[2], east: parts[3] };
        break;
      }
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--output':
        result.output = args[++i] || '';
        break;
      case '--density':
        result.density = (args[++i] || 'medium') as 'low' | 'medium' | 'high';
        if (!['low', 'medium', 'high'].includes(result.density)) {
          console.error('Error: --density must be "low", "medium", or "high"');
          process.exit(1);
        }
        break;
      case '--include-service':
        result.includeService = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`Unknown flag: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  if (!result.park) {
    console.error('Error: --park is required');
    printUsage();
    process.exit(1);
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage:
  npx tsx scripts/generate-park-graph.ts --park <slug> [options]

Options:
  --park <slug>       Park slug (required). Must match parkMapRegistry slugs.
  --bounds <s,w,n,e>  Bounding box as "south,west,north,east". Optional if park is in registry.
  --dry-run           Show query and stats without writing files.
  --output <path>     Custom output path. Default: src/features/parks/data/<slug>MapData.generated.ts
  --density <level>   Node density: low (60m), medium (30m), high (15m). Default: medium.
  --include-service   Also include highway=service ways.
  --help, -h          Show this help.

Examples:
  npx tsx scripts/generate-park-graph.ts --park magic-kingdom
  npx tsx scripts/generate-park-graph.ts --park "my-new-park" --bounds "34.42,-118.60,34.43,-118.59"
  npx tsx scripts/generate-park-graph.ts --park cedar-point --dry-run --density high
`);
}

// ---- Overpass API ----

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function buildOverpassQuery(
  south: number,
  west: number,
  north: number,
  east: number,
  includeService: boolean,
): string {
  const bbox = `${south},${west},${north},${east}`;
  const serviceClause = includeService ? `way["highway"="service"](${bbox});` : '';
  return `[out:json][timeout:60];
(
  way["highway"="footway"](${bbox});
  way["highway"="path"](${bbox});
  way["highway"="pedestrian"](${bbox});
  way["highway"="steps"](${bbox});
  ${serviceClause}
);
out body;
>;
out skel qt;`;
}

async function queryOverpass(query: string): Promise<OsmResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt];
    try {
      console.log(`  Querying ${endpoint}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as OsmResponse;
      console.log(`  Got ${data.elements.length} OSM elements`);
      return data;
    } catch (err) {
      lastError = err as Error;
      console.log(`  Failed (${(err as Error).message})`);
      if (attempt < OVERPASS_ENDPOINTS.length - 1) {
        console.log(`  Retrying with next endpoint...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw new Error(`All Overpass endpoints failed. Last error: ${lastError?.message}`);
}

// ---- Graph Building ----

function buildGraph(
  osmData: OsmResponse,
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number,
  density: 'low' | 'medium' | 'high',
): GraphResult {
  const densityThreshold = getDensityThreshold(density);

  // Index all OSM nodes by id
  const nodeCoords = new Map<number, LatLng>();
  for (const el of osmData.elements) {
    if (el.type === 'node') {
      const node = el as OsmNode;
      nodeCoords.set(node.id, { lat: node.lat, lng: node.lon });
    }
  }

  // Collect all ways
  const ways = osmData.elements.filter((el): el is OsmWay => el.type === 'way');

  if (ways.length === 0) {
    console.log('  WARNING: No ways found in the bounding box.');
    return { nodes: [], edges: [], wayCount: 0, rawNodeCount: nodeCoords.size };
  }

  // Count how many ways reference each node (intersection detection)
  const nodeWayCount = new Map<number, number>();
  for (const way of ways) {
    for (const nodeId of way.nodes) {
      nodeWayCount.set(nodeId, (nodeWayCount.get(nodeId) || 0) + 1);
    }
  }

  // Determine which OSM nodes become graph nodes:
  // - Way endpoints (first and last node of each way)
  // - Intersections (nodes appearing in 2+ ways)
  // - Intermediate nodes spaced by density threshold
  const graphNodeIds = new Set<number>();

  for (const way of ways) {
    const nodes = way.nodes;
    if (nodes.length < 2) continue;

    // Always include endpoints
    graphNodeIds.add(nodes[0]);
    graphNodeIds.add(nodes[nodes.length - 1]);

    // Always include intersections
    for (const nid of nodes) {
      if ((nodeWayCount.get(nid) || 0) > 1) {
        graphNodeIds.add(nid);
      }
    }

    // Add intermediate nodes based on density
    let accumDist = 0;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodeCoords.get(nodes[i - 1]);
      const curr = nodeCoords.get(nodes[i]);
      if (!prev || !curr) continue;
      accumDist += haversine(prev.lat, prev.lng, curr.lat, curr.lng);
      if (accumDist >= densityThreshold) {
        graphNodeIds.add(nodes[i]);
        accumDist = 0;
      }
    }
  }

  // Build edges between consecutive graph nodes within each way
  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>(); // deduplicate

  for (const way of ways) {
    const nodes = way.nodes;
    if (nodes.length < 2) continue;

    let segStart = 0;
    // Make sure the first node is a graph node
    if (!graphNodeIds.has(nodes[0])) continue;

    for (let i = 1; i < nodes.length; i++) {
      if (graphNodeIds.has(nodes[i])) {
        // Calculate total distance along the path from segStart to i
        let dist = 0;
        for (let j = segStart; j < i; j++) {
          const a = nodeCoords.get(nodes[j]);
          const b = nodeCoords.get(nodes[j + 1]);
          if (a && b) dist += haversine(a.lat, a.lng, b.lat, b.lng);
        }

        if (dist > 0.5) {
          // Skip trivially short edges (< 0.5m)
          const fromId = nodes[segStart];
          const toId = nodes[i];
          // Deduplicate (store both directions as one canonical key)
          const edgeKey = fromId < toId ? `${fromId}-${toId}` : `${toId}-${fromId}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              fromOsmId: fromId,
              toOsmId: toId,
              weight: Math.round(dist * 100) / 100,
            });
          }
        }
        segStart = i;
      }
    }
  }

  // Convert graph nodes to normalized coordinates
  const lngRange = neLng - swLng;
  const latRange = neLat - swLat;
  const graphNodes: GraphNode[] = [];

  for (const osmId of graphNodeIds) {
    const coords = nodeCoords.get(osmId);
    if (!coords) continue;

    // Normalize to 0-1 space
    const x = lngRange !== 0 ? (coords.lng - swLng) / lngRange : 0.5;
    const y = latRange !== 0 ? 1 - (coords.lat - swLat) / latRange : 0.5; // y inverted

    // Clamp to 0-1 (nodes right at the edge might exceed slightly)
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    graphNodes.push({
      osmId,
      lat: coords.lat,
      lng: coords.lng,
      x: Math.round(clampedX * 10000) / 10000, // 4 decimal places
      y: Math.round(clampedY * 10000) / 10000,
    });
  }

  // Remove orphan nodes (nodes with no edges)
  const connectedNodeIds = new Set<number>();
  for (const edge of edges) {
    connectedNodeIds.add(edge.fromOsmId);
    connectedNodeIds.add(edge.toOsmId);
  }
  const connectedNodes = graphNodes.filter((n) => connectedNodeIds.has(n.osmId));

  return {
    nodes: connectedNodes,
    edges,
    wayCount: ways.length,
    rawNodeCount: nodeCoords.size,
  };
}

// ---- TypeScript Output ----

function generateTypeScript(
  parkSlug: string,
  parkName: string,
  graph: GraphResult,
): string {
  const constName = slugToScreamingSnake(parkSlug) + '_OSM_MAP_DATA';
  const lines: string[] = [];

  lines.push(`// ============================================`);
  lines.push(`// ${parkName} -- OSM-Generated Walkway Graph`);
  lines.push(`//`);
  lines.push(`// AUTO-GENERATED by scripts/generate-park-graph.ts`);
  lines.push(`// Do not edit manually. Regenerate with:`);
  lines.push(`//   npx tsx scripts/generate-park-graph.ts --park ${parkSlug}`);
  lines.push(`//`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push(`// Stats: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.wayCount} OSM ways`);
  lines.push(`// ============================================`);
  lines.push(``);
  lines.push(`import { WalkwayNode, MapEdge, UnifiedParkMapData } from '../types';`);
  lines.push(``);

  // Walkway nodes
  lines.push(`const WALKWAY_NODES: WalkwayNode[] = [`);
  for (const node of graph.nodes) {
    lines.push(`  { id: 'w-osm-${node.osmId}', x: ${node.x}, y: ${node.y} },`);
  }
  lines.push(`];`);
  lines.push(``);

  // Edges
  lines.push(`const EDGES: MapEdge[] = [`);
  for (const edge of graph.edges) {
    lines.push(`  { from: 'w-osm-${edge.fromOsmId}', to: 'w-osm-${edge.toOsmId}', weight: ${edge.weight} },`);
  }
  lines.push(`];`);
  lines.push(``);

  // Export
  lines.push(`/**`);
  lines.push(` * OSM-generated walkway graph for ${parkName}.`);
  lines.push(` *`);
  lines.push(` * This provides the walkway network only. To create a full UnifiedParkMapData,`);
  lines.push(` * combine these walkwayNodes and edges with your POI data:`);
  lines.push(` *`);
  lines.push(` *   import { ${parkSlug.replace(/-/g, '_')}_POI } from './${slugToPascal(parkSlug).charAt(0).toLowerCase() + slugToPascal(parkSlug).slice(1)}POI';`);
  lines.push(` *`);
  lines.push(` *   export const ${constName}: UnifiedParkMapData = {`);
  lines.push(` *     parkSlug: '${parkSlug}',`);
  lines.push(` *     pois: ${parkSlug.replace(/-/g, '_')}_POI,`);
  lines.push(` *     walkwayNodes: WALKWAY_NODES,`);
  lines.push(` *     edges: EDGES,`);
  lines.push(` *   };`);
  lines.push(` */`);
  lines.push(`export const ${constName}_WALKWAY_NODES = WALKWAY_NODES;`);
  lines.push(`export const ${constName}_EDGES = EDGES;`);
  lines.push(``);
  lines.push(`// Standalone export (pois array is empty -- fill in with POI data)`);
  lines.push(`export const ${constName}: UnifiedParkMapData = {`);
  lines.push(`  parkSlug: '${parkSlug}',`);
  lines.push(`  pois: [],`);
  lines.push(`  walkwayNodes: WALKWAY_NODES,`);
  lines.push(`  edges: EDGES,`);
  lines.push(`};`);
  lines.push(``);

  return lines.join('\n');
}

// ---- Summary ----

function printSummary(
  parkName: string,
  graph: GraphResult,
  bounds: { south: number; west: number; north: number; east: number },
): void {
  const widthM = haversine(bounds.south, bounds.west, bounds.south, bounds.east);
  const heightM = haversine(bounds.south, bounds.west, bounds.north, bounds.west);
  const areaAcres = (widthM * heightM) / 4046.86;

  console.log(``);
  console.log(`  ==============================`);
  console.log(`  ${parkName}`);
  console.log(`  ==============================`);
  console.log(`  OSM Ways found:       ${graph.wayCount}`);
  console.log(`  Raw OSM nodes:        ${graph.rawNodeCount}`);
  console.log(`  Graph walkway nodes:  ${graph.nodes.length}`);
  console.log(`  Graph edges:          ${graph.edges.length}`);
  console.log(`  Bounding box:         ${Math.round(widthM)}m x ${Math.round(heightM)}m`);
  console.log(`  Approx area:          ${Math.round(areaAcres)} acres`);
  console.log(`  Avg edges/node:       ${graph.nodes.length > 0 ? ((graph.edges.length * 2) / graph.nodes.length).toFixed(1) : 'N/A'}`);

  // Calculate total walkway length
  const totalLength = graph.edges.reduce((sum, e) => sum + e.weight, 0);
  console.log(`  Total walkway length: ${(totalLength / 1000).toFixed(2)} km (${(totalLength * 3.28084 / 5280).toFixed(2)} mi)`);
  console.log(``);
}

// ---- Main ----

async function main(): Promise<void> {
  const args = parseArgs();

  console.log(`\nGenerate Park Graph from OSM`);
  console.log(`Park: ${args.park}`);
  console.log(`Density: ${args.density} (${getDensityThreshold(args.density)}m threshold)`);
  if (args.dryRun) console.log(`Mode: DRY RUN`);

  // Resolve bounds
  let south: number, west: number, north: number, east: number;
  let parkName: string;

  if (args.bounds) {
    south = args.bounds.south;
    west = args.bounds.west;
    north = args.bounds.north;
    east = args.bounds.east;
    parkName = args.park; // user-provided slug as name
  } else {
    const entry = REGISTRY[args.park];
    if (!entry) {
      console.error(`\nError: Park "${args.park}" not found in registry.`);
      console.error(`Available parks:\n${Object.keys(REGISTRY).map((s) => `  ${s}`).join('\n')}`);
      console.error(`\nOr provide custom bounds: --bounds "south,west,north,east"`);
      process.exit(1);
    }
    // Registry uses [lng, lat] format
    south = entry.boundsSW[1];
    west = entry.boundsSW[0];
    north = entry.boundsNE[1];
    east = entry.boundsNE[0];
    parkName = entry.name;
  }

  console.log(`Bounds: S=${south}, W=${west}, N=${north}, E=${east}`);

  // Build Overpass query
  const query = buildOverpassQuery(south, west, north, east, args.includeService);

  if (args.dryRun) {
    console.log(`\nOverpass query:\n${query}\n`);
  }

  // Query the API
  console.log(`\nQuerying Overpass API...`);
  const osmData = await queryOverpass(query);

  // Build graph
  console.log(`\nBuilding walkway graph...`);
  const graph = buildGraph(osmData, west, south, east, north, args.density);

  // Print summary
  printSummary(parkName, graph, { south, west, north, east });

  if (graph.nodes.length === 0) {
    console.log('No walkway nodes generated. The bounding box may not contain any footways in OSM.');
    console.log('Try:\n  - Expanding the bounds (widen by 0.005-0.01 degrees)');
    console.log('  - Adding --include-service to include service roads');
    console.log('  - Checking OSM at https://www.openstreetmap.org/ to see if paths exist');
    process.exit(0);
  }

  if (args.dryRun) {
    console.log('Dry run complete. No files written.');
    console.log(`\nSample nodes (first 5):`);
    for (const n of graph.nodes.slice(0, 5)) {
      console.log(`  w-osm-${n.osmId}: x=${n.x}, y=${n.y} (${n.lat}, ${n.lng})`);
    }
    console.log(`\nSample edges (first 5):`);
    for (const e of graph.edges.slice(0, 5)) {
      console.log(`  w-osm-${e.fromOsmId} -> w-osm-${e.toOsmId}: ${e.weight}m`);
    }
    process.exit(0);
  }

  // Generate TypeScript
  console.log(`Generating TypeScript...`);
  const tsContent = generateTypeScript(args.park, parkName, graph);

  // Determine output path
  const import_path = require('path');
  const scriptDir = import_path.dirname(process.argv[1] || __filename);
  const projectRoot = import_path.resolve(scriptDir, '..');
  const defaultOutput = import_path.join(
    projectRoot,
    'src',
    'features',
    'parks',
    'data',
    `${slugToPascal(args.park).charAt(0).toLowerCase() + slugToPascal(args.park).slice(1)}MapData.generated.ts`,
  );
  const outputPath = args.output || defaultOutput;

  // Ensure output directory exists
  const fs = require('fs');
  const outputDir = import_path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  console.log(`\nWritten to: ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the generated file and adjust bounds if needed`);
  console.log(`  2. Copy walkway nodes + edges into your park's MapData file`);
  console.log(`  3. Connect POIs to nearest walkway nodes with additional edges`);
  console.log(`  4. Test pathfinding in the app`);
}

main().catch((err) => {
  console.error(`\nFatal error: ${err.message}`);
  if (err.cause) console.error(`Cause: ${err.cause}`);
  process.exit(1);
});
