import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function ElectricianProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
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
    { icon: "settings" as const, title: "Account Settings", onPress: () => {} },
    { icon: "calendar" as const, title: "Availability Schedule", onPress: () => {} },
    { icon: "credit-card" as const, title: "Payment Settings", onPress: () => {} },
    { icon: "file-text" as const, title: "Documents & Verification", onPress: () => {} },
    { icon: "help-circle" as const, title: "Help & Support", onPress: () => {} },
    { icon: "info" as const, title: "About Kahraba", onPress: () => {} },
  ];

  const verificationStatus = user?.isVerified ? "Verified" : "Pending Verification";
  const probationStatus = user?.isOnProbation ? "On Probation" : "Active";

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

        <View style={styles.statusRow}>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Feather
                name="shield"
                size={18}
                color={user?.isVerified ? theme.success : theme.warning}
              />
              <ThemedText
                style={[
                  styles.statusValue,
                  { color: user?.isVerified ? theme.success : theme.warning },
                ]}
              >
                {verificationStatus}
              </ThemedText>
            </View>
            <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Account Status
            </ThemedText>
          </Card>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Feather
                name="activity"
                size={18}
                color={user?.isOnProbation ? theme.warning : theme.success}
              />
              <ThemedText
                style={[
                  styles.statusValue,
                  { color: user?.isOnProbation ? theme.warning : theme.success },
                ]}
              >
                {probationStatus}
              </ThemedText>
            </View>
            <ThemedText style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Membership
            </ThemedText>
          </Card>
        </View>

        {user?.trustScore !== undefined ? (
          <Card style={styles.trustScoreCard}>
            <View style={styles.trustScoreHeader}>
              <ThemedText style={styles.trustScoreTitle}>Trust Score</ThemedText>
              <View style={styles.trustScoreBadge}>
                <Feather name="star" size={16} color={theme.warning} />
                <ThemedText style={[styles.trustScoreValue, { color: theme.text }]}>
                  {user.trustScore}/100
                </ThemedText>
              </View>
            </View>
            <View style={styles.trustScoreBar}>
              <View
                style={[
                  styles.trustScoreFill,
                  {
                    width: `${user.trustScore}%`,
                    backgroundColor:
                      user.trustScore >= 80
                        ? theme.success
                        : user.trustScore >= 60
                        ? theme.warning
                        : theme.error,
                  },
                ]}
              />
            </View>
            <ThemedText style={[styles.trustScoreHint, { color: theme.textSecondary }]}>
              Complete jobs on time and maintain high ratings to improve your score.
            </ThemedText>
          </Card>
        ) : null}

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
    marginBottom: Spacing.lg,
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
  statusRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusCard: {
    flex: 1,
    padding: Spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    ...Typography.small,
    fontWeight: "600",
  },
  statusLabel: {
    ...Typography.caption,
  },
  trustScoreCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  trustScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  trustScoreTitle: {
    ...Typography.h4,
  },
  trustScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  trustScoreValue: {
    ...Typography.h4,
  },
  trustScoreBar: {
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  trustScoreFill: {
    height: "100%",
    borderRadius: 4,
  },
  trustScoreHint: {
    ...Typography.caption,
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
