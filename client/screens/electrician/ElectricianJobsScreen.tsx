import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { JobCard } from "@/components/JobCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getJobs, getActiveBroadcast, setActiveBroadcast, updateJob, generateId } from "@/lib/storage";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import type { Job, JobStatus } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ElectricianJobsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, updateAvailability } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [activeBroadcast, setActiveBroadcastState] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.availabilityStatus === "available");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeBroadcast) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [activeBroadcast, pulseAnim]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [broadcast, allJobs] = await Promise.all([
      getActiveBroadcast(),
      getJobs(),
    ]);
    setActiveBroadcastState(broadcast);
    const electricianJobs = allJobs.filter(
      (j) => j.electricianId === user.id && j.status !== "BROADCAST"
    );
    setJobs(electricianJobs);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    setIsAvailable(value);
    await updateAvailability(value ? "available" : "offline");
    if (value) {
      await simulateBroadcast();
    } else {
      await setActiveBroadcast(null);
      setActiveBroadcastState(null);
    }
  };

  const simulateBroadcast = async () => {
    const allJobs = await getJobs();
    const broadcastJob = allJobs.find((j) => j.status === "BROADCAST" && !j.electricianId);
    if (broadcastJob) {
      await setActiveBroadcast({ ...broadcastJob, distance: 2.3 });
      setActiveBroadcastState({ ...broadcastJob, distance: 2.3 });
    }
  };

  const handleAcceptJob = async () => {
    if (!activeBroadcast || !user) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const updatedJob = await updateJob(activeBroadcast.id, {
      status: "ACCEPTED" as JobStatus,
      electricianId: user.id,
      electricianName: user.name,
      acceptedAt: now,
      timeline: [
        ...activeBroadcast.timeline,
        { status: "ACCEPTED" as JobStatus, timestamp: now },
      ],
    });

    await setActiveBroadcast(null);
    setActiveBroadcastState(null);
    Alert.alert("Job Accepted", "You have accepted the job. Head to the location now.");
    await loadData();
  };

  const handleDeclineJob = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setActiveBroadcast(null);
    setActiveBroadcastState(null);
  };

  const handleTimeExpired = async () => {
    await setActiveBroadcast(null);
    setActiveBroadcastState(null);
    Alert.alert("Time Expired", "The job broadcast has expired.");
  };

  const handleJobPress = (job: Job) => {
    navigation.navigate("JobDetail", { jobId: job.id });
  };

  const activeJobs = jobs.filter(
    (j) => !["COMPLETED", "SETTLED", "CANCELLED"].includes(j.status)
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="coffee" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText style={styles.emptyTitle}>
        {isAvailable ? "Waiting for Jobs" : "You're Offline"}
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        {isAvailable
          ? "New job requests will appear here. Stay online to receive broadcasts."
          : "Toggle your availability to start receiving job requests."}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.headerTitle}>Jobs</ThemedText>
          <View style={styles.availabilityContainer}>
            <ThemedText
              style={[
                styles.availabilityLabel,
                { color: isAvailable ? theme.success : theme.textSecondary },
              ]}
            >
              {isAvailable ? "Available" : "Offline"}
            </ThemedText>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: theme.backgroundTertiary, true: Colors.light.success }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {activeBroadcast ? (
        <Animated.View style={[styles.broadcastContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Card style={[styles.broadcastCard, Shadows.cardHover]}>
            <View style={styles.broadcastHeader}>
              <View style={[styles.urgentBadge, { backgroundColor: Colors.light.warning }]}>
                <Feather name="zap" size={14} color="#FFFFFF" />
                <ThemedText style={styles.urgentBadgeText}>New Job</ThemedText>
              </View>
              <CountdownTimer
                durationSeconds={60}
                onComplete={handleTimeExpired}
              />
            </View>

            <ThemedText style={styles.broadcastTitle}>{activeBroadcast.description}</ThemedText>

            <View style={styles.broadcastDetails}>
              <View style={styles.broadcastDetailRow}>
                <Feather name="map-pin" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.broadcastDetailText, { color: theme.textSecondary }]}>
                  {activeBroadcast.address}, {activeBroadcast.city}
                </ThemedText>
              </View>
              <View style={styles.broadcastDetailRow}>
                <Feather name="navigation" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.broadcastDetailText, { color: theme.textSecondary }]}>
                  {activeBroadcast.distance?.toFixed(1)} km away
                </ThemedText>
              </View>
            </View>

            <View style={styles.priceRow}>
              <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                You'll Earn
              </ThemedText>
              <ThemedText style={[styles.priceValue, { color: theme.success }]}>
                {(activeBroadcast.totalPrice * 0.85).toFixed(0)} JOD
              </ThemedText>
            </View>

            <View style={styles.broadcastActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.acceptButton,
                  { backgroundColor: theme.success, opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={handleAcceptJob}
              >
                <Feather name="check" size={22} color="#FFFFFF" />
                <ThemedText style={styles.acceptButtonText}>Accept Job</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.declineButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleDeclineJob}
              >
                <ThemedText style={[styles.declineButtonText, { color: theme.error }]}>
                  Decline
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <FlatList
        data={activeJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item)} userRole="electrician" />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          activeJobs.length === 0 && !activeBroadcast && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!activeBroadcast ? renderEmptyState : null}
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h2,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  availabilityLabel: {
    ...Typography.small,
    fontWeight: "600",
  },
  broadcastContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  broadcastCard: {
    padding: Spacing.xl,
  },
  broadcastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  urgentBadgeText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  broadcastTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  broadcastDetails: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  broadcastDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  broadcastDetailText: {
    ...Typography.small,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  priceLabel: {
    ...Typography.body,
  },
  priceValue: {
    ...Typography.price,
  },
  broadcastActions: {
    gap: Spacing.sm,
  },
  acceptButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  acceptButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  declineButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  declineButtonText: {
    ...Typography.body,
    fontWeight: "500",
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
