import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <ThemedText style={styles.lastUpdated}>Last updated: December 2025</ThemedText>

          <ThemedText style={styles.sectionTitle}>1. Information We Collect</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We collect information you provide directly, including your name, phone number, email address, and service addresses. We also collect location data when you request services to match you with nearby electricians.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>2. How We Use Your Information</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Your information is used to provide our services, match you with electricians, process payments, send service notifications, and improve our platform. We may also use your data for customer support.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>3. Information Sharing</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We share your name, phone number, and service address with electricians assigned to your jobs. We do not sell your personal information to third parties. We may share data with service providers who help operate our platform.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>4. Data Security</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We implement industry-standard security measures to protect your personal information. However, no system is completely secure, and we cannot guarantee absolute security of your data.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>5. Your Rights</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            You have the right to access, correct, or delete your personal information. You can update your profile in the app or contact us to make changes. You may also request a copy of your data.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>6. Location Data</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We collect location data to provide accurate service matching and estimated arrival times. You can control location permissions in your device settings. Disabling location may limit app functionality.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>7. Cookies and Analytics</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We use analytics to understand how users interact with our app. This helps us improve our services. You can opt out of analytics in the notification settings.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>8. Data Retention</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We retain your data as long as your account is active or as needed to provide services. Job history is kept for dispute resolution and legal compliance. You can request account deletion at any time.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>9. Children's Privacy</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Our services are not intended for users under 18 years of age. We do not knowingly collect information from children under 18.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>10. Contact Us</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            For privacy-related questions or to exercise your data rights, contact us at privacy@modo.jo or through the Help & Support section of the app.
          </ThemedText>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  card: {
    padding: Spacing.xl,
  },
  lastUpdated: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
    fontStyle: "italic",
  },
  sectionTitle: {
    ...Typography.h4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.body,
    lineHeight: 24,
  },
});
