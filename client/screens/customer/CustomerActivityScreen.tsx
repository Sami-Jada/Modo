import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { JobCard } from "@/components/JobCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getJobs } from "@/lib/storage";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Job } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomerActivityScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!user) return;
    const allJobs = await getJobs();
    const customerJobs = allJobs.filter((j) => j.customerId === user.id);
    setJobs(customerJobs);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const activeJobs = jobs.filter(
    (j) => !["COMPLETED", "SETTLED", "CANCELLED"].includes(j.status)
  );
  const pastJobs = jobs.filter((j) =>
    ["COMPLETED", "SETTLED", "CANCELLED"].includes(j.status)
  );

  const displayJobs = activeTab === "active" ? activeJobs : pastJobs;

  const handleJobPress = (job: Job) => {
    navigation.navigate("JobDetail", { jobId: job.id });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather
          name={activeTab === "active" ? "briefcase" : "check-circle"}
          size={48}
          color={theme.textSecondary}
        />
      </View>
      <ThemedText style={styles.emptyTitle}>
        {activeTab === "active" ? "No Active Jobs" : "No Past Jobs"}
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        {activeTab === "active"
          ? "When you request an electrician, your active jobs will appear here."
          : "Your completed and cancelled jobs will appear here."}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.headerTitle}>My Jobs</ThemedText>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "active" && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab("active")}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "active" ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            Active ({activeJobs.length})
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "past" && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveTab("past")}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "past" ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            Past ({pastJobs.length})
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={displayJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item)} userRole="customer" />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          displayJobs.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  tabText: {
    ...Typography.small,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    textAlign: "center",
  },
});
