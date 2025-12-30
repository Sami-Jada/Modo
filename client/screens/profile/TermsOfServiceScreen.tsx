import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

export default function TermsOfServiceScreen() {
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

          <ThemedText style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            By accessing or using the Kahraba application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>2. Service Description</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Kahraba is a platform that connects customers with licensed electricians in Jordan. We facilitate the matching process but are not responsible for the actual electrical work performed.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>3. User Responsibilities</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Users must provide accurate information when requesting services. You are responsible for ensuring safe access to your property for the electrician and for describing your electrical issues accurately.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>4. Pricing and Payments</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            All prices are displayed before service confirmation. Additional work discovered during service requires customer approval before proceeding. Payment is due upon service completion.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>5. Cancellation Policy</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Customers may cancel requests before the electrician arrives without charge. Cancellations after arrival may incur a cancellation fee to compensate the electrician for their time and travel.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>6. Liability</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Kahraba is not liable for any damages arising from electrical work performed by electricians on our platform. All electricians are independently licensed and insured.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>7. Dispute Resolution</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            Any disputes should first be reported through our app. We will work to mediate between customers and electricians. Unresolved disputes may be escalated to appropriate authorities in Jordan.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>8. Changes to Terms</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>9. Contact</ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.textSecondary }]}>
            For questions about these Terms of Service, please contact us at legal@kahraba.jo or through the Help & Support section of the app.
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
