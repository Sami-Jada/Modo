import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomerProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const menuItems = [
    { icon: "credit-card" as const, title: "Payment Methods", onPress: () => navigation.navigate("PaymentMethods") },
    { icon: "map-pin" as const, title: "Saved Addresses", onPress: () => navigation.navigate("SavedAddresses") },
    { icon: "bell" as const, title: "Notifications", onPress: () => navigation.navigate("Notifications") },
    { icon: "help-circle" as const, title: "Help & Support", onPress: () => navigation.navigate("HelpSupport") },
    { icon: "file-text" as const, title: "Terms of Service", onPress: () => navigation.navigate("TermsOfService") },
    { icon: "shield" as const, title: "Privacy Policy", onPress: () => navigation.navigate("PrivacyPolicy") },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user?.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user?.name}</ThemedText>
            <ThemedText style={[styles.profilePhone, { color: theme.textSecondary }]}>
              +962 {user?.phone}
            </ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="edit-2" size={18} color={theme.textSecondary} />
          </Pressable>
        </Card>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.menuItem,
                { backgroundColor: pressed ? theme.backgroundSecondary : theme.backgroundDefault },
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name={item.icon} size={20} color={theme.textSecondary} />
              </View>
              <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: theme.error, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#FFFFFF" />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
        </Pressable>

        <ThemedText style={[styles.versionText, { color: theme.textSecondary }]}>
          Version 1.0.0
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  avatarText: {
    ...Typography.h2,
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h3,
    marginBottom: 2,
  },
  profilePhone: {
    ...Typography.small,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuSection: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  menuTitle: {
    ...Typography.body,
    flex: 1,
  },
  logoutButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  versionText: {
    ...Typography.caption,
    textAlign: "center",
  },
});
