/**
 * TermsScreen
 *
 * Scrollable Terms of Service screen with mock legal content.
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
import { radius } from '../../theme/radius';
import { TIMING } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { FogHeader } from '../../components/FogHeader';

const HEADER_HEIGHT = 52;

// ============================================
// Mock Terms Content
// ============================================

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading, installing, or using TrackR ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the App. We reserve the right to update or modify these Terms at any time, and your continued use of the App following any such changes constitutes your acceptance of the revised Terms.',
  },
  {
    title: '2. Description of Service',
    body: 'TrackR is a mobile application designed for roller coaster and theme park enthusiasts. The App provides features including but not limited to ride logging, park maps, wait time tracking, trip planning, social interactions, and game features. The App is provided on an "as is" basis and certain features may be modified, suspended, or discontinued at any time without notice.',
  },
  {
    title: '3. User Accounts',
    body: 'To access certain features of the App, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You must notify us immediately of any unauthorized access to or use of your account.',
  },
  {
    title: '4. User Content',
    body: 'You retain ownership of any content you submit, post, or display through the App ("User Content"), including ride logs, ratings, reviews, and profile information. By submitting User Content, you grant TrackR a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with the operation and improvement of the App. You represent and warrant that your User Content does not violate the rights of any third party.',
  },
  {
    title: '5. Acceptable Use',
    body: 'You agree not to use the App to: (a) violate any applicable laws or regulations; (b) infringe upon the rights of others; (c) transmit any harmful, threatening, abusive, or otherwise objectionable content; (d) impersonate any person or entity; (e) interfere with or disrupt the App or servers; (f) attempt to gain unauthorized access to any portion of the App; (g) collect or harvest personal information of other users; or (h) use the App for any commercial purpose without our prior written consent.',
  },
  {
    title: '6. Intellectual Property',
    body: 'The App and its original content, features, and functionality are owned by Lanting Digital LLC and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Lanting Digital LLC.',
  },
  {
    title: '7. Third-Party Content',
    body: 'The App may contain links to or integrate with third-party websites, services, or content that are not owned or controlled by TrackR. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party services. Park information, wait times, and other third-party data are provided for informational purposes only and may not be accurate or up to date.',
  },
  {
    title: '8. Privacy',
    body: 'Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding the collection, use, and disclosure of your personal information.',
  },
  {
    title: '9. Disclaimer of Warranties',
    body: 'THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.',
  },
  {
    title: '10. Limitation of Liability',
    body: 'IN NO EVENT SHALL LANTING DIGITAL LLC, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE APP.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in Riverside County, California.',
  },
  {
    title: '12. Contact',
    body: 'If you have any questions about these Terms, please contact us at legal@lantingdigital.com.',
  },
];

// ============================================
// TermsScreen
// ============================================

export function TermsScreen() {
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
        {/* Last updated */}
        <Text style={styles.lastUpdated}>Last updated: January 1, 2026</Text>

        {TERMS_SECTIONS.map((section, i) => (
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
      <FogHeader headerHeight={headerTotalHeight} fogExtension={80} />

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
