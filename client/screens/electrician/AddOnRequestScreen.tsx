import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "AddOnRequest">;

const ADD_ON_OPTIONS = [
  { id: "1", name: "Additional Outlet Installation", description: "Install an extra outlet", price: 15 },
  { id: "2", name: "Wire Replacement (per meter)", description: "Replace damaged wiring", price: 8 },
  { id: "3", name: "Circuit Breaker Replacement", description: "Replace faulty breaker", price: 20 },
  { id: "4", name: "Light Fixture Installation", description: "Install new light fixture", price: 25 },
  { id: "5", name: "Emergency Repair Surcharge", description: "After-hours or urgent work", price: 15 },
  { id: "6", name: "Electrical Panel Upgrade", description: "Upgrade main panel", price: 50 },
];

export default function AddOnRequestScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalPrice = ADD_ON_OPTIONS.filter((a) => selectedAddOns.includes(a.id)).reduce(
    (sum, a) => sum + a.price,
    0
  );

  const handleSubmit = () => {
    if (selectedAddOns.length === 0) {
      Alert.alert("Select Add-ons", "Please select at least one add-on to request.");
      return;
    }

    Alert.alert(
      "Add-on Request Sent",
      "The customer will be notified and must approve the add-ons before you can proceed.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.buttonHeight + Spacing["2xl"] },
        ]}
      >
        <Card style={[styles.warningCard, { backgroundColor: `${theme.warning}15` }]}>
          <Feather name="alert-circle" size={20} color={theme.warning} />
          <ThemedText style={[styles.warningText, { color: theme.warning }]}>
            Add-ons require customer approval before work can continue.
          </ThemedText>
        </Card>

        <ThemedText style={styles.sectionTitle}>Available Add-ons</ThemedText>

        {ADD_ON_OPTIONS.map((option) => {
          const isSelected = selectedAddOns.includes(option.id);
          return (
            <Pressable key={option.id} onPress={() => toggleAddOn(option.id)}>
              <Card
                style={[
                  styles.addOnCard,
                  isSelected && { borderColor: theme.primary, borderWidth: 2 },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: isSelected ? theme.primary : "transparent",
                    },
                  ]}
                >
                  {isSelected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                </View>
                <View style={styles.addOnInfo}>
                  <ThemedText style={styles.addOnName}>{option.name}</ThemedText>
                  <ThemedText style={[styles.addOnDescription, { color: theme.textSecondary }]}>
                    {option.description}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.addOnPrice, { color: theme.primary }]}>
                  +{option.price} JOD
                </ThemedText>
              </Card>
            </Pressable>
          );
        })}

        {selectedAddOns.length > 0 ? (
          <Card style={styles.summaryCard}>
            <ThemedText style={styles.summaryTitle}>Selected Add-ons</ThemedText>
            {ADD_ON_OPTIONS.filter((a) => selectedAddOns.includes(a.id)).map((addon) => (
              <View key={addon.id} style={styles.summaryRow}>
                <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  {addon.name}
                </ThemedText>
                <ThemedText style={styles.summaryValue}>+{addon.price} JOD</ThemedText>
              </View>
            ))}
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryRow}>
              <ThemedText style={styles.totalLabel}>Total Add-ons</ThemedText>
              <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
                +{totalPrice} JOD
              </ThemedText>
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: selectedAddOns.length > 0 ? theme.primary : theme.backgroundTertiary,
              opacity: pressed && selectedAddOns.length > 0 ? 0.9 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={selectedAddOns.length === 0}
        >
          <ThemedText
            style={[
              styles.submitButtonText,
              { color: selectedAddOns.length > 0 ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            Request Add-ons ({selectedAddOns.length})
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  warningText: {
    ...Typography.small,
    flex: 1,
    fontWeight: "500",
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  addOnCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    ...Typography.body,
    marginBottom: 2,
  },
  addOnDescription: {
    ...Typography.caption,
  },
  addOnPrice: {
    ...Typography.h4,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.small,
  },
  summaryValue: {
    ...Typography.small,
    fontWeight: "500",
  },
  summaryDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.h3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    ...Typography.h4,
  },
});
