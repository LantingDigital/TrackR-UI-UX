import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

interface Coaster {
  id: string;
  name: string;
  park: string;
  image: string;
}

interface QuickLogSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogComplete?: (coaster: Coaster, seat: { row: number; col: number }) => void;
}

const RECOMMENDED_COASTERS: Coaster[] = [
  { id: '1', name: 'Steel Vengeance', park: 'Cedar Point', image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400' },
  { id: '2', name: 'Millennium Force', park: 'Cedar Point', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400' },
  { id: '3', name: 'Top Thrill 2', park: 'Cedar Point', image: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400' },
  { id: '4', name: 'Maverick', park: 'Cedar Point', image: 'https://images.unsplash.com/photo-1534579070695-f323205f9580?w=400' },
];

const RECENT_COASTERS: Coaster[] = [
  { id: '5', name: 'Iron Gwazi', park: 'Busch Gardens', image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?w=400' },
  { id: '6', name: 'Velocicoaster', park: 'Universal Orlando', image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400' },
];

const CoasterCard: React.FC<{ coaster: Coaster; onPress: () => void }> = ({ coaster, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.coasterCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image source={{ uri: coaster.image }} style={styles.coasterImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.coasterGradient} />
        <View style={styles.coasterInfo}>
          <Text style={styles.coasterName} numberOfLines={2}>{coaster.name}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const SeatSelector: React.FC<{
  selectedSeat: { row: number; col: number } | null;
  onSelectSeat: (seat: { row: number; col: number }) => void;
}> = ({ selectedSeat, onSelectSeat }) => {
  const rows = 8;
  const cols = 2;

  return (
    <View style={styles.seatSelectorContainer}>
      <Text style={styles.seatSelectorTitle}>Select Your Seat</Text>
      <View style={styles.trainDiagram}>
        <View style={styles.trainFront}>
          <Ionicons name="arrow-up" size={16} color="#999" />
          <Text style={styles.trainFrontText}>Front</Text>
        </View>
        <View style={styles.seatsGrid}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <View key={rowIndex} style={styles.seatRow}>
              {Array.from({ length: cols }).map((_, colIndex) => {
                const isSelected = selectedSeat?.row === rowIndex && selectedSeat?.col === colIndex;
                return (
                  <Pressable
                    key={colIndex}
                    style={[styles.seat, isSelected && styles.seatSelected]}
                    onPress={() => onSelectSeat({ row: rowIndex, col: colIndex })}
                  >
                    <Text style={[styles.seatText, isSelected && styles.seatTextSelected]}>
                      {rowIndex + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const QuickLogSheet: React.FC<QuickLogSheetProps> = ({
  visible,
  onClose,
  onLogComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoaster, setSelectedCoaster] = useState<Coaster | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<{ row: number; col: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSelectCoaster = useCallback((coaster: Coaster) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCoaster(coaster);
  }, []);

  const handleSelectSeat = useCallback((seat: { row: number; col: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSeat(seat);
  }, []);

  const handleLogRide = useCallback(() => {
    if (!selectedCoaster || !selectedSeat) return;

    setIsLogging(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);

    setTimeout(() => {
      if (onLogComplete) {
        onLogComplete(selectedCoaster, selectedSeat);
      }
      handleClose();
    }, 2000);
  }, [selectedCoaster, selectedSeat, onLogComplete]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setSearchQuery('');
      setSelectedCoaster(null);
      setSelectedSeat(null);
      setShowSuccess(false);
      setIsLogging(false);
      onClose();
    });
  }, [onClose]);

  const handleBack = useCallback(() => {
    if (selectedCoaster) {
      setSelectedCoaster(null);
      setSelectedSeat(null);
    }
  }, [selectedCoaster]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            {selectedCoaster ? (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#000" />
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}
            <Text style={styles.headerTitle}>{selectedCoaster ? 'Log Ride' : 'Quick Log'}</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#000" />
            </Pressable>
          </View>

          {!selectedCoaster ? (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search coasters..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommended to Log</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                  {RECOMMENDED_COASTERS.map((coaster) => (
                    <CoasterCard key={coaster.id} coaster={coaster} onPress={() => handleSelectCoaster(coaster)} />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Log Again</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
                  {RECENT_COASTERS.map((coaster) => (
                    <CoasterCard key={coaster.id} coaster={coaster} onPress={() => handleSelectCoaster(coaster)} />
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.seatSelectionContent}>
              <View style={styles.selectedCoasterInfo}>
                <Image source={{ uri: selectedCoaster.image }} style={styles.selectedCoasterImage} />
                <View style={styles.selectedCoasterText}>
                  <Text style={styles.selectedCoasterName}>{selectedCoaster.name}</Text>
                  <Text style={styles.selectedCoasterPark}>{selectedCoaster.park}</Text>
                </View>
              </View>

              <SeatSelector selectedSeat={selectedSeat} onSelectSeat={handleSelectSeat} />

              <Pressable
                style={[styles.logButton, (!selectedSeat || isLogging) && styles.logButtonDisabled]}
                onPress={handleLogRide}
                disabled={!selectedSeat || isLogging}
              >
                <Text style={styles.logButtonText}>{isLogging ? 'Logging...' : 'Log Ride'}</Text>
              </Pressable>
            </View>
          )}

          {showSuccess && (
            <View style={styles.successOverlay}>
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={64} color="#CF6769" />
                <Text style={styles.successText}>Ride Logged!</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: { height: SHEET_HEIGHT, backgroundColor: '#F7F7F7', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  grabberContainer: { alignItems: 'center', paddingVertical: 12 },
  grabber: { width: 36, height: 4, backgroundColor: '#D1D1D6', borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 24, paddingHorizontal: 16, height: 48, borderRadius: 24, shadowColor: '#323232', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginBottom: 12 },
  carouselContent: { paddingHorizontal: 16, gap: 12 },
  coasterCard: { width: 120, height: 120, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E1E1E1', shadowColor: '#323232', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  coasterImage: { width: '100%', height: '100%' },
  coasterGradient: { ...StyleSheet.absoluteFillObject, top: '50%' },
  coasterInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  coasterName: { fontSize: 13, fontWeight: '600', color: '#FFF', textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  seatSelectionContent: { flex: 1, paddingHorizontal: 16 },
  selectedCoasterInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, marginBottom: 24, shadowColor: '#323232', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  selectedCoasterImage: { width: 60, height: 60, borderRadius: 12 },
  selectedCoasterText: { marginLeft: 12, flex: 1 },
  selectedCoasterName: { fontSize: 17, fontWeight: '600', color: '#000' },
  selectedCoasterPark: { fontSize: 14, color: '#666', marginTop: 2 },
  seatSelectorContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#323232', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  seatSelectorTitle: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 16, textAlign: 'center' },
  trainDiagram: { alignItems: 'center' },
  trainFront: { alignItems: 'center', marginBottom: 12 },
  trainFrontText: { fontSize: 11, color: '#999', marginTop: 2 },
  seatsGrid: { gap: 8 },
  seatRow: { flexDirection: 'row', gap: 16 },
  seat: { width: 44, height: 36, backgroundColor: '#F0F0F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E5E5' },
  seatSelected: { backgroundColor: '#CF6769', borderColor: '#CF6769' },
  seatText: { fontSize: 13, fontWeight: '600', color: '#666' },
  seatTextSelected: { color: '#FFF' },
  logButton: { backgroundColor: '#CF6769', height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 'auto', shadowColor: '#CF6769', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logButtonDisabled: { backgroundColor: '#D1D1D6', shadowOpacity: 0 },
  logButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  successOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)' },
  successMessage: { alignItems: 'center', backgroundColor: '#FFF', padding: 32, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  successText: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 12 },
});
