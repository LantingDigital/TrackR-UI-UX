import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

const RECENT_SEARCHES = [
  'Steel Vengeance',
  'Cedar Point',
  'RMC Coasters',
  'Millennium Force',
  'Six Flags Magic Mountain',
];

const TRENDING_SEARCHES = [
  'Top Thrill 2',
  'Iron Gwazi',
  'Velocicoaster',
  'New for 2025',
  'Coaster Rankings',
];

const CATEGORIES = [
  { id: 'coasters', label: 'Coasters', icon: 'flash-outline' as const },
  { id: 'parks', label: 'Parks', icon: 'location-outline' as const },
  { id: 'news', label: 'News', icon: 'newspaper-outline' as const },
];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  visible,
  onClose,
  onSearch,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClearRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  }, [searchQuery, onSearch]);

  const handleRecentPress = useCallback((term: string) => {
    setSearchQuery(term);
    if (onSearch) {
      onSearch(term);
    }
  }, [onSearch]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { paddingTop: insets.top, opacity: fadeAnim }]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header with Search Bar */}
          <View style={styles.header}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search rides, parks, news..."
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color="#999999" />
                </Pressable>
              )}
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#000000" />
            </Pressable>
          </View>

          {/* Category Filters */}
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === category.id && styles.categoryPillActive,
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={14}
                  color={selectedCategory === category.id ? '#FFFFFF' : '#000000'}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchQuery.length === 0 ? (
              <>
                {recentSearches.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent</Text>
                      <Pressable onPress={handleClearRecent} hitSlop={8}>
                        <Text style={styles.clearButton}>Clear all</Text>
                      </Pressable>
                    </View>
                    {recentSearches.map((term, index) => (
                      <Pressable
                        key={index}
                        style={styles.searchItem}
                        onPress={() => handleRecentPress(term)}
                      >
                        <Ionicons name="time-outline" size={18} color="#999999" />
                        <Text style={styles.searchItemText}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                  </View>
                  {TRENDING_SEARCHES.map((term, index) => (
                    <Pressable
                      key={index}
                      style={styles.searchItem}
                      onPress={() => handleRecentPress(term)}
                    >
                      <Ionicons name="trending-up" size={18} color="#CF6769" />
                      <Text style={styles.searchItemText}>{term}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Results</Text>
                {[...RECENT_SEARCHES, ...TRENDING_SEARCHES]
                  .filter(term =>
                    term.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((term, index) => (
                    <Pressable
                      key={index}
                      style={styles.searchItem}
                      onPress={() => handleRecentPress(term)}
                    >
                      <Ionicons name="search" size={18} color="#666666" />
                      <Text style={styles.searchItemText}>{term}</Text>
                    </Pressable>
                  ))}
                {[...RECENT_SEARCHES, ...TRENDING_SEARCHES].filter(term =>
                  term.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <Text style={styles.noResults}>
                    No results for "{searchQuery}"
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(247, 247, 247, 0.92)',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    gap: 6,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryPillActive: {
    backgroundColor: '#CF6769',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CF6769',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  searchItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  noResults: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
