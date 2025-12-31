import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function PaymentMethodsScreen() {
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
        <Card style={styles.infoCard}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="credit-card" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.title}>Payment Methods</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Payment integration will be available once Modo is officially launched in Jordan. For now, all services are paid in cash directly to the electrician.
          </ThemedText>
        </Card>

        <Card style={styles.cashCard}>
          <View style={styles.cashRow}>
            <View style={[styles.cashIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="dollar-sign" size={24} color={theme.success} />
            </View>
            <View style={styles.cashInfo}>
              <ThemedText style={styles.cashTitle}>Cash Payment</ThemedText>
              <ThemedText style={[styles.cashSubtitle, { color: theme.textSecondary }]}>
                Default payment method
              </ThemedText>
            </View>
            <View style={[styles.activeTag, { backgroundColor: theme.success }]}>
              <ThemedText style={styles.activeTagText}>Active</ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.comingSoon, { color: theme.textSecondary }]}>
          Credit card and mobile wallet options coming soon
        </ThemedText>
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
  infoCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  cashCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cashRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cashIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cashInfo: {
    flex: 1,
  },
  cashTitle: {
    ...Typography.h4,
    marginBottom: 2,
  },
  cashSubtitle: {
    ...Typography.small,
  },
  activeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  activeTagText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  comingSoon: {
    ...Typography.small,
    textAlign: "center",
    fontStyle: "italic",
  },
});
