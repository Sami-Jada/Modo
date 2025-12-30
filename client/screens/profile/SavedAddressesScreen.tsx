import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export default function SavedAddressesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: "1",
      label: "Home",
      address: "123 King Abdullah II Street, Amman",
      isDefault: true,
    },
  ]);

  const handleAddAddress = () => {
    Alert.alert(
      "Add Address",
      "Address management will be available in a future update.",
      [{ text: "OK" }]
    );
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {addresses.map((address) => (
          <Card key={address.id} style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={[styles.addressIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather 
                  name={address.label === "Home" ? "home" : address.label === "Work" ? "briefcase" : "map-pin"} 
                  size={20} 
                  color={theme.primary} 
                />
              </View>
              <View style={styles.addressInfo}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.addressLabel}>{address.label}</ThemedText>
                  {address.isDefault ? (
                    <View style={[styles.defaultTag, { backgroundColor: theme.primary }]}>
                      <ThemedText style={styles.defaultTagText}>Default</ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText style={[styles.addressText, { color: theme.textSecondary }]}>
                  {address.address}
                </ThemedText>
              </View>
            </View>
            {!address.isDefault ? (
              <Pressable
                style={({ pressed }) => [
                  styles.setDefaultButton,
                  { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleSetDefault(address.id)}
              >
                <ThemedText style={[styles.setDefaultText, { color: theme.primary }]}>
                  Set as default
                </ThemedText>
              </Pressable>
            ) : null}
          </Card>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleAddAddress}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText}>Add New Address</ThemedText>
        </Pressable>
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
  addressCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  addressInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressLabel: {
    ...Typography.h4,
    marginRight: Spacing.sm,
  },
  defaultTag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  defaultTagText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 10,
  },
  addressText: {
    ...Typography.body,
    lineHeight: 20,
  },
  setDefaultButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  setDefaultText: {
    ...Typography.small,
    fontWeight: "600",
  },
  addButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  addButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
});
