import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ParkMapConfig } from './parkMapRegistry';
import { MAPBOX_AVAILABLE } from './mapboxConfig';

const MapboxGL = MAPBOX_AVAILABLE ? require('@rnmapbox/maps').default : null;

// ============================================
// Types
// ============================================

interface EditorNode {
  id: string;
  lng: number;
  lat: number;
  zoneId: number; // 0 = bridge (connects to all), 1+ = zone-specific
}

interface EditorEdge {
  from: string;
  to: string;
  weight: number;
}

type ClusterSize = 1 | 3 | 5 | 10;
type EditorMode = 'zone' | 'cluster' | 'bridge';

interface UndoAction {
  type: 'cluster' | 'bridge' | 'fill';
  nodeCount: number;
}

// ============================================
// Constants
// ============================================

const CONNECT_THRESHOLD_M = 40;
const GRID_SPACING_M = 15;

const ZONE_COLORS = [
  '#00CC66', // green (zone 1)
  '#3399FF', // blue (zone 2)
  '#CC66FF', // purple (zone 3)
  '#FF9933', // orange (zone 4)
  '#00CCCC', // cyan (zone 5)
  '#FF6699', // pink (zone 6)
];

const BRIDGE_FILL = '#FFFFFF';
const BRIDGE_STROKE = '#FFD700';
const BRIDGE_EDGE_COLOR = '#FFD700';
const POLYGON_COLOR = '#FF3333';

// ============================================
// Haversine distance (meters)
// ============================================

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// Point-in-polygon (ray casting)
// ============================================

function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// ============================================
// Fill polygon with grid nodes
// ============================================

function fillPolygonWithNodes(
  corners: [number, number][], // [lng, lat][]
  spacingM: number,
  centerLat: number,
): { lng: number; lat: number }[] {
  // Compute bbox
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of corners) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Convert spacing to degrees
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180);
  const dLat = spacingM / mPerDegLat;
  const dLng = spacingM / mPerDegLng;

  const points: { lng: number; lat: number }[] = [];
  for (let lat = minLat; lat <= maxLat; lat += dLat) {
    for (let lng = minLng; lng <= maxLng; lng += dLng) {
      if (pointInPolygon(lng, lat, corners)) {
        points.push({ lng, lat });
      }
    }
  }
  return points;
}

// ============================================
// Cluster generation
// ============================================

function generateCluster(
  centerLng: number,
  centerLat: number,
  count: ClusterSize,
): { lng: number; lat: number }[] {
  if (count === 1) return [{ lng: centerLng, lat: centerLat }];

  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180);
  const radiusM = count <= 3 ? 10 : count <= 5 ? 15 : 20;
  const points: { lng: number; lat: number }[] = [];

  points.push({ lng: centerLng, lat: centerLat });

  const ringCount = count - 1;
  for (let i = 0; i < ringCount; i++) {
    const angle = (2 * Math.PI * i) / ringCount;
    const jitter = 0.8 + Math.random() * 0.4;
    const r = radiusM * jitter;
    const dLat = (r * Math.sin(angle)) / mPerDegLat;
    const dLng = (r * Math.cos(angle)) / mPerDegLng;
    points.push({
      lng: centerLng + dLng,
      lat: centerLat + dLat,
    });
  }

  return points;
}

// ============================================
// Zone-aware auto-connect
// ============================================

function zoneAwareAutoConnect(nodes: EditorNode[], thresholdM: number): EditorEdge[] {
  const edges: EditorEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const sameZone = a.zoneId === b.zoneId && a.zoneId > 0;
      const bridged = a.zoneId === 0 || b.zoneId === 0;
      if (!sameZone && !bridged) continue;

      const d = haversine(a.lat, a.lng, b.lat, b.lng);
      if (d <= thresholdM) {
        edges.push({
          from: a.id,
          to: b.id,
          weight: Math.round(d * 100) / 100,
        });
      }
    }
  }
  return edges;
}

// ============================================
// Helpers
// ============================================

function getZoneColor(zoneId: number): string {
  if (zoneId === 0) return BRIDGE_FILL;
  return ZONE_COLORS[(zoneId - 1) % ZONE_COLORS.length];
}

// ============================================
// useWalkwayEditor
// ============================================

export function useWalkwayEditor(mapConfig: ParkMapConfig) {
  const [editorActive, setEditorActive] = useState(false);
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [mode, setMode] = useState<EditorMode>('zone');
  const [clusterSize, setClusterSize] = useState<ClusterSize>(1);
  const [currentZoneId, setCurrentZoneId] = useState(1);
  const [polygonCorners, setPolygonCorners] = useState<[number, number][]>([]);
  const nodeCounter = useRef(0);
  const undoStack = useRef<UndoAction[]>([]);

  const edges = useMemo(() => zoneAwareAutoConnect(nodes, CONNECT_THRESHOLD_M), [nodes]);

  const toggleEditor = useCallback(() => {
    setEditorActive((prev) => !prev);
  }, []);

  const setModeZone = useCallback(() => setMode('zone'), []);
  const setModeCluster = useCallback(() => setMode('cluster'), []);
  const setModeBridge = useCallback(() => setMode('bridge'), []);

  const cycleClusterSize = useCallback(() => {
    setClusterSize((prev) => {
      const order: ClusterSize[] = [1, 3, 5, 10];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  const newZone = useCallback(() => {
    setCurrentZoneId((prev) => prev + 1);
    setPolygonCorners([]);
  }, []);

  const fillPolygon = useCallback(() => {
    if (polygonCorners.length < 3) return;

    // Compute center lat for degree conversion
    const centerLat =
      polygonCorners.reduce((sum, c) => sum + c[1], 0) / polygonCorners.length;

    const gridPoints = fillPolygonWithNodes(polygonCorners, GRID_SPACING_M, centerLat);

    const newNodes: EditorNode[] = [];
    for (const pt of gridPoints) {
      const SNAP_THRESHOLD = 0.00003;
      const tooClose = nodes.some(
        (n) =>
          Math.abs(n.lng - pt.lng) < SNAP_THRESHOLD &&
          Math.abs(n.lat - pt.lat) < SNAP_THRESHOLD,
      );
      if (tooClose) continue;

      nodeCounter.current += 1;
      newNodes.push({
        id: `w-${nodeCounter.current}`,
        lng: pt.lng,
        lat: pt.lat,
        zoneId: currentZoneId,
      });
    }

    if (newNodes.length > 0) {
      setNodes((prev) => [...prev, ...newNodes]);
      undoStack.current.push({ type: 'fill', nodeCount: newNodes.length });
    }
    setPolygonCorners([]);
  }, [polygonCorners, nodes, currentZoneId]);

  const handleEditorTap = useCallback(
    (event: any): boolean => {
      if (!editorActive) return false;

      const coords = event?.geometry?.coordinates;
      if (!coords || coords.length < 2) return true;
      const [lng, lat] = coords;

      // Zone mode: add polygon corners
      if (mode === 'zone') {
        setPolygonCorners((prev) => [...prev, [lng, lat]]);
        return true;
      }

      // Bridge mode: single node with zoneId 0
      if (mode === 'bridge') {
        const SNAP_THRESHOLD = 0.00003;
        const tooClose = nodes.some(
          (n) =>
            Math.abs(n.lng - lng) < SNAP_THRESHOLD &&
            Math.abs(n.lat - lat) < SNAP_THRESHOLD,
        );
        if (tooClose) return true;

        nodeCounter.current += 1;
        const bridgeNode: EditorNode = {
          id: `w-${nodeCounter.current}`,
          lng,
          lat,
          zoneId: 0,
        };
        setNodes((prev) => [...prev, bridgeNode]);
        undoStack.current.push({ type: 'bridge', nodeCount: 1 });
        return true;
      }

      // Cluster mode: drop cluster into current zone
      const clusterPoints = generateCluster(lng, lat, clusterSize);
      const newNodes: EditorNode[] = [];
      for (const pt of clusterPoints) {
        const SNAP_THRESHOLD = 0.00003;
        const tooClose = [...nodes, ...newNodes].some(
          (n) =>
            Math.abs(n.lng - pt.lng) < SNAP_THRESHOLD &&
            Math.abs(n.lat - pt.lat) < SNAP_THRESHOLD,
        );
        if (tooClose) continue;

        nodeCounter.current += 1;
        newNodes.push({
          id: `w-${nodeCounter.current}`,
          lng: pt.lng,
          lat: pt.lat,
          zoneId: currentZoneId,
        });
      }

      if (newNodes.length > 0) {
        setNodes((prev) => [...prev, ...newNodes]);
        undoStack.current.push({ type: 'cluster', nodeCount: newNodes.length });
      }
      return true;
    },
    [editorActive, mode, nodes, clusterSize, currentZoneId],
  );

  const undo = useCallback(() => {
    if (mode === 'zone' && polygonCorners.length > 0) {
      // Undo last polygon corner
      setPolygonCorners((prev) => prev.slice(0, -1));
      return;
    }

    const lastAction = undoStack.current.pop();
    if (!lastAction) return;

    setNodes((prev) => prev.slice(0, Math.max(0, prev.length - lastAction.nodeCount)));
  }, [mode, polygonCorners]);

  const clearAll = useCallback(() => {
    Alert.alert('Clear All', 'Remove all walkway nodes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setNodes([]);
          setPolygonCorners([]);
          setCurrentZoneId(1);
          nodeCounter.current = 0;
          undoStack.current = [];
        },
      },
    ]);
  }, []);

  const save = useCallback(() => {
    if (nodes.length === 0) {
      Alert.alert('Nothing to save', 'Place some walkway nodes first.');
      return;
    }

    const ne = mapConfig.poiBoundsNE;
    const sw = mapConfig.poiBoundsSW;
    const lngRange = ne[0] - sw[0];
    const latRange = ne[1] - sw[1];

    const tsNodes = nodes.map((n) => {
      const x = Math.round(((n.lng - sw[0]) / lngRange) * 10000) / 10000;
      const y = Math.round((1 - (n.lat - sw[1]) / latRange) * 10000) / 10000;
      return `  { id: '${n.id}', x: ${x}, y: ${y} },`;
    });

    const tsEdges = edges.map(
      (e) => `  { from: '${e.from}', to: '${e.to}', weight: ${e.weight} },`,
    );

    const output = `// Walkway graph — ${mapConfig.parkSlug}
// ${nodes.length} nodes, ${edges.length} edges
// Auto-connected at ${CONNECT_THRESHOLD_M}m threshold (zone-aware)
// Generated by WalkwayEditor v2

const WALKWAY_NODES: WalkwayNode[] = [
${tsNodes.join('\n')}
];

const WALKWAY_EDGES: MapEdge[] = [
${tsEdges.join('\n')}
];`;

    Share.share({ message: output, title: `${mapConfig.parkSlug}-walkways` });
  }, [nodes, edges, mapConfig]);

  return {
    editorActive,
    toggleEditor,
    handleEditorTap,
    nodes,
    edges,
    mode,
    setModeZone,
    setModeCluster,
    setModeBridge,
    clusterSize,
    cycleClusterSize,
    currentZoneId,
    newZone,
    polygonCorners,
    fillPolygon,
    undo,
    clearAll,
    save,
  };
}

// ============================================
// WalkwayEditorLayers — render inside MapView
// ============================================

export function WalkwayEditorLayers({
  nodes,
  edges,
  polygonCorners,
}: {
  nodes: EditorNode[];
  edges: EditorEdge[];
  polygonCorners?: [number, number][];
}) {
  // Node GeoJSON: color by zone
  const nodeGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: nodes.map((n) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] },
        properties: {
          id: n.id,
          zoneId: n.zoneId,
          color: getZoneColor(n.zoneId),
          isBridge: n.zoneId === 0,
        },
      })),
    }),
    [nodes],
  );

  // Edge GeoJSON: color by zone or bridge
  const edgeGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return {
      type: 'FeatureCollection',
      features: edges
        .map((e) => {
          const from = nodeMap.get(e.from);
          const to = nodeMap.get(e.to);
          if (!from || !to) return null;
          const isBridge = from.zoneId === 0 || to.zoneId === 0;
          const edgeColor = isBridge
            ? BRIDGE_EDGE_COLOR
            : getZoneColor(from.zoneId > 0 ? from.zoneId : to.zoneId);
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [from.lng, from.lat],
                [to.lng, to.lat],
              ],
            },
            properties: { isBridge, color: edgeColor },
          };
        })
        .filter(Boolean) as GeoJSON.Feature[],
    };
  }, [nodes, edges]);

  // Polygon preview GeoJSON (while drawing in zone mode)
  const polygonGeoJSON = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!polygonCorners || polygonCorners.length === 0) return null;
    const features: GeoJSON.Feature[] = [];

    // Corner dots
    for (const [lng, lat] of polygonCorners) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {},
      });
    }

    // Connecting line (dashed)
    if (polygonCorners.length >= 2) {
      const lineCoords = [...polygonCorners];
      // Close the polygon visually if 3+ corners
      if (polygonCorners.length >= 3) {
        lineCoords.push(polygonCorners[0]);
      }
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoords,
        },
        properties: {},
      });
    }

    return { type: 'FeatureCollection', features };
  }, [polygonCorners]);

  if (!MapboxGL) return null;
  const hasNodes = nodes.length > 0;
  const hasPolygon = polygonGeoJSON !== null;

  if (!hasNodes && !hasPolygon) return null;

  return (
    <>
      {/* Edge lines */}
      {hasNodes && (
        <MapboxGL.ShapeSource id="walkway-editor-edges" shape={edgeGeoJSON}>
          <MapboxGL.LineLayer
            id="walkway-editor-edge-line"
            style={{
              lineColor: ['get', 'color'],
              lineWidth: ['case', ['get', 'isBridge'], 2, 2.5],
              lineOpacity: ['case', ['get', 'isBridge'], 0.8, 0.7],
            }}
          />
        </MapboxGL.ShapeSource>
      )}

      {/* Zone nodes */}
      {hasNodes && (
        <MapboxGL.ShapeSource id="walkway-editor-nodes" shape={nodeGeoJSON}>
          {/* Bridge nodes: white fill, gold stroke */}
          <MapboxGL.CircleLayer
            id="walkway-editor-bridge-dots"
            filter={['==', ['get', 'isBridge'], true]}
            style={{
              circleRadius: 5.5,
              circleColor: BRIDGE_FILL,
              circleStrokeColor: BRIDGE_STROKE,
              circleStrokeWidth: 2.5,
            }}
          />
          {/* Zone nodes: colored by zone */}
          <MapboxGL.CircleLayer
            id="walkway-editor-zone-dots"
            filter={['==', ['get', 'isBridge'], false]}
            style={{
              circleRadius: 4.5,
              circleColor: ['get', 'color'],
              circleStrokeColor: '#FFFFFF',
              circleStrokeWidth: 1.5,
            }}
          />
        </MapboxGL.ShapeSource>
      )}

      {/* Polygon preview */}
      {hasPolygon && (
        <MapboxGL.ShapeSource id="walkway-editor-polygon" shape={polygonGeoJSON}>
          <MapboxGL.CircleLayer
            id="walkway-editor-polygon-dots"
            filter={['==', ['geometry-type'], 'Point']}
            style={{
              circleRadius: 6,
              circleColor: POLYGON_COLOR,
              circleStrokeColor: '#FFFFFF',
              circleStrokeWidth: 2,
            }}
          />
          <MapboxGL.LineLayer
            id="walkway-editor-polygon-line"
            filter={['==', ['geometry-type'], 'LineString']}
            style={{
              lineColor: POLYGON_COLOR,
              lineWidth: 2,
              lineDasharray: [4, 3],
              lineOpacity: 0.8,
            }}
          />
        </MapboxGL.ShapeSource>
      )}
    </>
  );
}

// ============================================
// WalkwayEditorToolbar — render outside MapView
// ============================================

export function WalkwayEditorToolbar({
  editorActive,
  toggleEditor,
  nodeCount,
  edgeCount,
  mode,
  onSetModeZone,
  onSetModeCluster,
  onSetModeBridge,
  clusterSize,
  onCycleCluster,
  currentZoneId,
  onNewZone,
  polygonCornerCount,
  onFillPolygon,
  onUndo,
  onClear,
  onSave,
}: {
  editorActive: boolean;
  toggleEditor: () => void;
  nodeCount: number;
  edgeCount: number;
  mode: EditorMode;
  onSetModeZone: () => void;
  onSetModeCluster: () => void;
  onSetModeBridge: () => void;
  clusterSize: ClusterSize;
  onCycleCluster: () => void;
  currentZoneId: number;
  onNewZone: () => void;
  polygonCornerCount: number;
  onFillPolygon: () => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
}) {
  const insets = useSafeAreaInsets();
  const zoneColor = getZoneColor(currentZoneId);

  const hintText =
    mode === 'zone'
      ? polygonCornerCount === 0
        ? 'Tap corners to draw a zone polygon'
        : polygonCornerCount < 3
        ? `${polygonCornerCount} corner${polygonCornerCount > 1 ? 's' : ''} — need ${3 - polygonCornerCount} more`
        : `${polygonCornerCount} corners — tap Fill or keep adding`
      : mode === 'bridge'
      ? 'Tap to place bridge nodes between zones'
      : 'Tap to drop clusters into current zone';

  return (
    <>
      {/* Toggle button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          { top: insets.top + 100 },
          editorActive && styles.toggleButtonActive,
        ]}
        onPress={toggleEditor}
        activeOpacity={0.7}
      >
        <Ionicons
          name={editorActive ? 'pencil' : 'pencil-outline'}
          size={20}
          color={editorActive ? '#FFFFFF' : '#333333'}
        />
      </TouchableOpacity>

      {/* Toolbar */}
      {editorActive && (
        <View style={[styles.toolbar, { bottom: insets.bottom + 20 }]}>
          {/* Stats */}
          <Text style={styles.stats}>
            {nodeCount} nodes · {edgeCount} auto-edges
          </Text>
          <Text style={styles.hint}>{hintText}</Text>

          {/* Mode toggle row */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'zone' && styles.modeButtonActive]}
              onPress={onSetModeZone}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeLabel, mode === 'zone' && styles.modeLabelActive]}>
                Zone
              </Text>
              {mode === 'zone' && (
                <View style={[styles.zoneIndicator, { backgroundColor: zoneColor }]}>
                  <Text style={styles.zoneIndicatorText}>{currentZoneId}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, mode === 'cluster' && styles.modeButtonActive]}
              onPress={onSetModeCluster}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeLabel, mode === 'cluster' && styles.modeLabelActive]}>
                Cluster
              </Text>
              {mode === 'cluster' && (
                <Text style={styles.clusterSizeLabel}>{clusterSize}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, mode === 'bridge' && styles.modeButtonActive]}
              onPress={onSetModeBridge}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeLabel, mode === 'bridge' && styles.modeLabelActive]}>
                Bridge
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action row */}
          <View style={styles.buttonRow}>
            {/* Zone mode: cluster size (hidden), new zone, fill */}
            {mode === 'cluster' && (
              <TouchableOpacity
                style={styles.clusterButton}
                onPress={onCycleCluster}
                activeOpacity={0.7}
              >
                <View style={[styles.clusterBadge, { backgroundColor: zoneColor }]}>
                  <Text style={styles.clusterBadgeText}>{clusterSize}</Text>
                </View>
                <Text style={styles.tbLabel}>Size</Text>
              </TouchableOpacity>
            )}

            {mode === 'zone' && (
              <TBButton
                icon="add-circle-outline"
                label="New Zone"
                onPress={onNewZone}
                color={zoneColor}
              />
            )}

            {mode === 'zone' && polygonCornerCount >= 3 && (
              <TBButton
                icon="grid-outline"
                label="Fill"
                onPress={onFillPolygon}
                primary
              />
            )}

            <TBButton
              icon="arrow-undo"
              label="Undo"
              onPress={onUndo}
              disabled={nodeCount === 0 && polygonCornerCount === 0}
            />
            <TBButton icon="trash-outline" label="Clear" onPress={onClear} destructive />
            <TBButton icon="share-outline" label="Export" onPress={onSave} primary />
          </View>
        </View>
      )}
    </>
  );
}

// ============================================
// Toolbar Button
// ============================================

function TBButton({
  icon,
  label,
  onPress,
  disabled,
  destructive,
  primary,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  primary?: boolean;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tbButton,
        primary && styles.tbButtonPrimary,
        disabled && styles.tbButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={
          disabled
            ? '#999'
            : primary
            ? '#FFF'
            : destructive
            ? '#FF4444'
            : color ?? '#333'
        }
      />
      <Text
        style={[
          styles.tbLabel,
          primary && { color: '#FFF' },
          destructive && { color: '#FF4444' },
          disabled && { color: '#999' },
          color ? { color } : undefined,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 200,
  },
  toggleButtonActive: {
    backgroundColor: '#00CC66',
  },
  toolbar: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 200,
  },
  stats: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modeLabelActive: {
    color: '#333',
  },
  zoneIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  clusterSizeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  clusterButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  clusterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  tbButton: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tbButtonPrimary: {
    backgroundColor: '#00CC66',
    paddingHorizontal: 18,
  },
  tbButtonDisabled: {
    opacity: 0.4,
  },
  tbLabel: {
    fontSize: 11,
    color: '#333',
    marginTop: 2,
    fontWeight: '500',
  },
});
