import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getJobs, updateJob, addTransaction, generateId } from "@/lib/storage";
import { Colors, Spacing, BorderRadius, Typography, JobStateColors } from "@/constants/theme";
import { JOB_STATUS_LABELS } from "@/types";
import type { Job, JobStatus, Transaction } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteProps = RouteProp<RootStackParamList, "JobDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  ACCEPTED: "EN_ROUTE",
  EN_ROUTE: "ARRIVED",
  ARRIVED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

const ACTION_LABELS: Partial<Record<JobStatus, string>> = {
  ACCEPTED: "Start Heading There",
  EN_ROUTE: "I've Arrived",
  ARRIVED: "Start Work",
  IN_PROGRESS: "Complete Job",
};

export default function JobDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadJob = useCallback(async () => {
    const jobs = await getJobs();
    const found = jobs.find((j) => j.id === route.params.jobId);
    setJob(found || null);
    setIsLoading(false);
  }, [route.params.jobId]);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [loadJob])
  );

  const handleStatusUpdate = async () => {
    if (!job || !user) return;
    const nextStatus = NEXT_STATUS[job.status];
    if (!nextStatus) return;

    setIsUpdating(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const updates: Partial<Job> = {
      status: nextStatus,
      timeline: [...job.timeline, { status: nextStatus, timestamp: now }],
    };

    if (nextStatus === "COMPLETED") {
      updates.completedAt = now;

      const earning: Transaction = {
        id: generateId(),
        electricianId: user.id,
        jobId: job.id,
        type: "earning",
        amount: job.totalPrice * 0.85,
        description: `Job #${job.id.slice(-6)} completed`,
        createdAt: now,
      };
      await addTransaction(earning);

      const commission: Transaction = {
        id: generateId(),
        electricianId: user.id,
        jobId: job.id,
        type: "commission",
        amount: job.totalPrice * 0.15,
        description: `Platform fee for Job #${job.id.slice(-6)}`,
        createdAt: now,
      };
      await addTransaction(commission);
    }

    const updatedJob = await updateJob(job.id, updates);
    if (updatedJob) {
      setJob(updatedJob);
    }

    setIsUpdating(false);

    if (nextStatus === "COMPLETED") {
      Alert.alert("Job Completed", "Great work! The payment has been processed.");
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Job",
      "Are you sure you want to cancel this job? This action cannot be undone.",
      [
        { text: "Keep Job", style: "cancel" },
        {
          text: "Cancel Job",
          style: "destructive",
          onPress: async () => {
            if (!job) return;
            const now = new Date();
            await updateJob(job.id, {
              status: "CANCELLED",
              cancelledAt: now,
              timeline: [...job.timeline, { status: "CANCELLED", timestamp: now }],
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRequestAddOn = () => {
    if (!job) return;
    navigation.navigate("AddOnRequest", { jobId: job.id });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!job) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={styles.errorText}>Job not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const isElectrician = user?.role === "electrician";
  const canUpdateStatus = isElectrician && NEXT_STATUS[job.status] && job.status !== "COMPLETED";
  const canCancel = !["COMPLETED", "SETTLED", "CANCELLED"].includes(job.status);
  const statusColor = JobStateColors[job.status] || theme.textSecondary;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (canUpdateStatus ? Spacing.buttonHeight + Spacing["3xl"] : Spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {JOB_STATUS_LABELS[job.status]}
            </ThemedText>
          </View>
          <ThemedText style={[styles.jobId, { color: theme.textSecondary }]}>
            #{job.id.slice(-6).toUpperCase()}
          </ThemedText>
        </View>

        <Card style={styles.detailCard}>
          <ThemedText style={styles.cardTitle}>Job Details</ThemedText>
          <ThemedText style={styles.jobDescription}>{job.description}</ThemedText>

          <View style={styles.detailRow}>
            <Feather name="map-pin" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {job.address}, {job.city}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Feather name="calendar" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {job.createdAt.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Feather name="credit-card" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {job.paymentMethod === "card" ? "Card Payment" : "Cash Payment"}
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.priceCard}>
          <ThemedText style={styles.cardTitle}>Price Breakdown</ThemedText>
          <View style={styles.priceRow}>
            <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Base Service
            </ThemedText>
            <ThemedText style={styles.priceValue}>{job.basePrice} JOD</ThemedText>
          </View>
          {job.addOns.length > 0
            ? job.addOns.map((addon) => (
                <View key={addon.id} style={styles.priceRow}>
                  <ThemedText style={[styles.priceLabel, { color: theme.textSecondary }]}>
                    {addon.name}
                  </ThemedText>
                  <ThemedText style={styles.priceValue}>+{addon.price} JOD</ThemedText>
                </View>
              ))
            : null}
          <View style={[styles.priceDivider, { backgroundColor: theme.border }]} />
          <View style={styles.priceRow}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
              {job.totalPrice} JOD
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.timelineCard}>
          <ThemedText style={styles.cardTitle}>Job Timeline</ThemedText>
          <StatusTimeline timeline={job.timeline} currentStatus={job.status} />
        </Card>

        {isElectrician && job.electricianId === user?.id ? (
          <Card style={styles.personCard}>
            <View style={[styles.personAvatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.personAvatarText}>
                {job.customerName?.charAt(0).toUpperCase() || "C"}
              </ThemedText>
            </View>
            <View style={styles.personInfo}>
              <ThemedText style={styles.personName}>{job.customerName || "Customer"}</ThemedText>
              <ThemedText style={[styles.personRole, { color: theme.textSecondary }]}>
                Customer
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="phone" size={20} color={theme.primary} />
            </Pressable>
          </Card>
        ) : job.electricianId ? (
          <Card style={styles.personCard}>
            <View style={[styles.personAvatar, { backgroundColor: theme.success }]}>
              <ThemedText style={styles.personAvatarText}>
                {job.electricianName?.charAt(0).toUpperCase() || "E"}
              </ThemedText>
            </View>
            <View style={styles.personInfo}>
              <View style={styles.personNameRow}>
                <ThemedText style={styles.personName}>
                  {job.electricianName || "Electrician"}
                </ThemedText>
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={14} color={theme.success} />
                </View>
              </View>
              <ThemedText style={[styles.personRole, { color: theme.textSecondary }]}>
                Verified Electrician
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="phone" size={20} color={theme.primary} />
            </Pressable>
          </Card>
        ) : null}

        {isElectrician && canUpdateStatus ? (
          <Pressable
            style={({ pressed }) => [
              styles.addOnButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleRequestAddOn}
          >
            <Feather name="plus-circle" size={20} color={theme.primary} />
            <ThemedText style={[styles.addOnButtonText, { color: theme.primary }]}>
              Request Add-on
            </ThemedText>
          </Pressable>
        ) : null}

        {canCancel ? (
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleCancel}
          >
            <ThemedText style={[styles.cancelButtonText, { color: theme.error }]}>
              Cancel Job
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>

      {canUpdateStatus ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.primary, opacity: pressed || isUpdating ? 0.8 : 1 },
            ]}
            onPress={handleStatusUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather
                  name={job.status === "IN_PROGRESS" ? "check-circle" : "arrow-right"}
                  size={22}
                  color="#FFFFFF"
                />
                <ThemedText style={styles.actionButtonText}>
                  {ACTION_LABELS[job.status]}
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  errorText: {
    ...Typography.h3,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.small,
    fontWeight: "600",
  },
  jobId: {
    ...Typography.small,
    fontWeight: "500",
  },
  detailCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  jobDescription: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailText: {
    ...Typography.small,
    flex: 1,
  },
  priceCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.body,
  },
  priceValue: {
    ...Typography.body,
    fontWeight: "500",
  },
  priceDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.price,
  },
  timelineCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  personAvatarText: {
    ...Typography.h3,
    color: "#FFFFFF",
  },
  personInfo: {
    flex: 1,
  },
  personNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  personName: {
    ...Typography.h4,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  personRole: {
    ...Typography.small,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  addOnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addOnButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: "500",
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
  actionButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
});
