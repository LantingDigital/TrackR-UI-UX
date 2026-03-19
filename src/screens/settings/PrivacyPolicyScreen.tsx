/**
 * PrivacyPolicyScreen
 *
 * Scrollable Privacy Policy screen with mock legal content.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { TIMING } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { FogHeader } from '../../components/FogHeader';

const HEADER_HEIGHT = 52;

// ============================================
// Mock Privacy Policy Content
// ============================================

const PRIVACY_SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us when you create an account, use the App, or communicate with us. This may include your name, email address, username, profile photo, ride logs, ratings, park preferences, and any other information you choose to provide. We also collect certain information automatically when you use the App, including device information, usage data, and location data (if you grant permission).',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use the information we collect to: (a) provide, maintain, and improve the App; (b) personalize your experience, including recommending parks and rides; (c) process and complete transactions; (d) send you technical notices and support messages; (e) respond to your comments, questions, and requests; (f) monitor and analyze trends, usage, and activities; (g) detect, investigate, and prevent fraudulent or unauthorized activities; and (h) carry out any other purpose described to you at the time the information was collected.',
  },
  {
    title: '3. Information Sharing',
    body: 'We do not sell your personal information to third parties. We may share your information in the following circumstances: (a) with other users, in accordance with your privacy settings (e.g., public ride logs, profile information); (b) with service providers who perform services on our behalf; (c) in response to legal process or government requests; (d) to protect our rights, privacy, safety, or property; and (e) in connection with a merger, acquisition, or sale of assets.',
  },
  {
    title: '4. Data Retention',
    body: 'We retain your personal information for as long as your account is active or as needed to provide you with the App. We may also retain certain information as required by law, to resolve disputes, enforce our agreements, or for other legitimate business purposes. If you delete your account, we will delete or anonymize your personal information within 30 days, except as required by law.',
  },
  {
    title: '5. Security',
    body: 'We take reasonable measures to protect your personal information from unauthorized access, use, alteration, and destruction. However, no method of transmission over the internet or method of electronic storage is 100% secure. We cannot guarantee the absolute security of your information.',
  },
  {
    title: '6. Your Choices',
    body: 'You may update, correct, or delete your account information at any time by accessing your account settings within the App. You may also opt out of receiving promotional communications by following the unsubscribe instructions in those messages. You can control location sharing through your device settings. Please note that opting out of certain data collection may limit the functionality of certain features.',
  },
  {
    title: '7. Location Data',
    body: 'With your permission, we may collect and process your precise location data to provide park-related features such as wait times, maps, trip planning, and park detection. You can disable location services at any time through your device settings. Disabling location services may limit the functionality of certain App features.',
  },
  {
    title: '8. Children\'s Privacy',
    body: 'The App is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information as soon as practicable.',
  },
  {
    title: '9. Analytics and Cookies',
    body: 'We may use analytics services and similar technologies to collect and analyze usage information. These technologies help us understand how users interact with the App and improve our services. You may be able to control the use of certain tracking technologies through your device settings.',
  },
  {
    title: '10. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the App and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes. Your continued use of the App after any changes to this Privacy Policy constitutes your acceptance of such changes.',
  },
  {
    title: '11. Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at privacy@lantingdigital.com.\n\nLanting Digital LLC\nRiverside, CA, United States',
  },
];

// ============================================
// PrivacyPolicyScreen
// ============================================

export function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: TIMING.normal });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Scroll content — fills entire screen, scrolls behind header */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: January 1, 2026</Text>

        <Text style={styles.intro}>
          Lanting Digital LLC ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our TrackR mobile application ("the App").
        </Text>

        {PRIVACY_SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Lanting Digital LLC | Riverside, CA
          </Text>
        </View>
      </ScrollView>

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerStyle]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  lastUpdated: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginBottom: spacing.lg,
  },
  intro: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * 1.65,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  sectionBody: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * 1.65,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});
