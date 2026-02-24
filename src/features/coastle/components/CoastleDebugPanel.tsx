import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AnimTuning {
  arcHeight: number;
  arcBias: number;
  sizeStart: number;
  expandDuration: number;
  bounceAmount: number;
  overshootAmount: number;
  easingP1X: number;
  easingP1Y: number;
  easingP2X: number;
  easingP2Y: number;
  springDamping: number;
  springStiffness: number;
  springMass: number;
  duration: number;
}

export const DEFAULT_TUNING: AnimTuning = {
  arcHeight: 120,
  arcBias: 0.5,
  sizeStart: 0.5,
  expandDuration: 650,
  bounceAmount: 10,
  overshootAmount: 1.03,
  easingP1X: 0.5,
  easingP1Y: 0.70,
  easingP2X: 0.5,
  easingP2Y: 1.0,
  springDamping: 20,
  springStiffness: 220,
  springMass: 0.6,
  duration: 550,
};

// ─── Slider ───────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

const DebugSlider: React.FC<SliderProps> = ({ label, value, min, max, step = 0.01, onChange }) => {
  const trackRef = useRef<View>(null);
  const trackX = useRef(0);
  const trackW = useRef(200);

  const update = useCallback((pageX: number) => {
    const frac = Math.max(0, Math.min(1, (pageX - trackX.current) / trackW.current));
    const raw = min + frac * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(stepped);
  }, [min, max, step, onChange]);

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View style={sliderStyles.row}>
      <Text style={sliderStyles.label}>
        {label}: {step >= 1 ? Math.round(value) : value.toFixed(2)}
      </Text>
      <View
        ref={trackRef}
        onLayout={() => {
          trackRef.current?.measureInWindow((x, _y, w) => {
            trackX.current = x;
            trackW.current = w;
          });
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => update(e.nativeEvent.pageX)}
        onResponderMove={(e) => update(e.nativeEvent.pageX)}
        style={sliderStyles.track}
      >
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  row: { marginBottom: 8 },
  label: { color: '#fff', fontSize: 10, marginBottom: 2, fontFamily: 'Courier' },
  track: {
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    backgroundColor: 'rgba(90,160,240,0.5)',
    borderRadius: 4,
  },
});

// ─── Panel ────────────────────────────────────────────────

interface DebugPanelProps {
  tuning: AnimTuning;
  onChange: (tuning: AnimTuning) => void;
}

export const CoastleDebugPanel: React.FC<DebugPanelProps> = ({ tuning, onChange }) => {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const set = useCallback((key: keyof AnimTuning, val: number) => {
    onChange({ ...tuning, [key]: val });
  }, [tuning, onChange]);

  const reset = useCallback(() => {
    onChange({ ...DEFAULT_TUNING });
  }, [onChange]);

  if (!expanded) {
    return (
      <Pressable
        onPress={() => setExpanded(true)}
        style={[panelStyles.toggleBtn, { bottom: insets.bottom + 8 }]}
      >
        <Text style={panelStyles.toggleText}>Tune</Text>
      </Pressable>
    );
  }

  return (
    <View style={[panelStyles.container, { paddingBottom: insets.bottom + 8 }]}>
      {/* Header */}
      <View style={panelStyles.header}>
        <Text style={panelStyles.title}>Animation Tuning</Text>
        <View style={panelStyles.headerBtns}>
          <Pressable onPress={reset} style={panelStyles.headerBtn}>
            <Text style={panelStyles.headerBtnText}>Reset</Text>
          </Pressable>
          <Pressable onPress={() => setExpanded(false)} style={panelStyles.headerBtn}>
            <Text style={panelStyles.headerBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={panelStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Arc */}
        <Text style={panelStyles.section}>Arc</Text>
        <DebugSlider label="Arc Height" value={tuning.arcHeight} min={0} max={300} step={5} onChange={(v) => set('arcHeight', v)} />
        <DebugSlider label="Arc Bias" value={tuning.arcBias} min={0} max={1} step={0.05} onChange={(v) => set('arcBias', v)} />

        {/* Timing */}
        <Text style={panelStyles.section}>Timing</Text>
        <DebugSlider label="Duration (ms)" value={tuning.duration} min={300} max={1500} step={25} onChange={(v) => set('duration', v)} />
        <DebugSlider label="Size Start" value={tuning.sizeStart} min={0} max={0.95} step={0.05} onChange={(v) => set('sizeStart', v)} />
        <DebugSlider label="Expand Duration (ms)" value={tuning.expandDuration} min={100} max={800} step={25} onChange={(v) => set('expandDuration', v)} />

        {/* Easing Curve */}
        <Text style={panelStyles.section}>Easing (Bezier)</Text>
        <DebugSlider label="P1 X" value={tuning.easingP1X} min={0} max={1} onChange={(v) => set('easingP1X', v)} />
        <DebugSlider label="P1 Y" value={tuning.easingP1Y} min={0} max={1.5} onChange={(v) => set('easingP1Y', v)} />
        <DebugSlider label="P2 X" value={tuning.easingP2X} min={0} max={1} onChange={(v) => set('easingP2X', v)} />
        <DebugSlider label="P2 Y" value={tuning.easingP2Y} min={0} max={1.5} onChange={(v) => set('easingP2Y', v)} />

        {/* Landing */}
        <Text style={panelStyles.section}>Landing</Text>
        <DebugSlider label="Overshoot" value={tuning.overshootAmount} min={1.0} max={1.15} step={0.005} onChange={(v) => set('overshootAmount', v)} />
        <DebugSlider label="Bounce (px)" value={tuning.bounceAmount} min={0} max={40} step={1} onChange={(v) => set('bounceAmount', v)} />
        <DebugSlider label="Spring Damping" value={tuning.springDamping} min={5} max={40} step={1} onChange={(v) => set('springDamping', v)} />
        <DebugSlider label="Spring Stiffness" value={tuning.springStiffness} min={50} max={500} step={10} onChange={(v) => set('springStiffness', v)} />
        <DebugSlider label="Spring Mass" value={tuning.springMass} min={0.1} max={2.0} step={0.05} onChange={(v) => set('springMass', v)} />
      </ScrollView>
    </View>
  );
};

const panelStyles = StyleSheet.create({
  toggleBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 999,
  },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '55%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  headerBtns: { flexDirection: 'row', gap: 12 },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  scroll: { flex: 1 },
  section: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
});
