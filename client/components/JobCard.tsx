import React from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography, JobStateColors } from "@/constants/theme";
import { JOB_STATUS_LABELS } from "@/types";
import type { Job, UserRole } from "@/types";

interface JobCardProps {
  job: Job;
  onPress: () => void;
  userRole: UserRole;
}

export function JobCard({ job, onPress, userRole }: JobCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const statusColor = JobStateColors[job.status] || theme.textSecondary;
  const isCompleted = ["COMPLETED", "SETTLED"].includes(job.status);
  const isCancelled = job.status === "CANCELLED";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={[styles.card, isCancelled && { opacity: 0.7 }]}>
          <View style={styles.header}>
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

          <ThemedText style={styles.description} numberOfLines={2}>
            {job.description}
          </ThemedText>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText
                style={[styles.detailText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {job.address}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
                {formatDate(job.createdAt)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.personInfo}>
              {userRole === "customer" && job.electricianName ? (
                <>
                  <View style={[styles.personAvatar, { backgroundColor: theme.success }]}>
                    <ThemedText style={styles.personAvatarText}>
                      {job.electricianName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.personName, { color: theme.textSecondary }]}>
                    {job.electricianName}
                  </ThemedText>
                </>
              ) : userRole === "electrician" && job.customerName ? (
                <>
                  <View style={[styles.personAvatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.personAvatarText}>
                      {job.customerName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.personName, { color: theme.textSecondary }]}>
                    {job.customerName}
                  </ThemedText>
                </>
              ) : null}
            </View>

            <View style={styles.priceContainer}>
              <ThemedText
                style={[
                  styles.price,
                  { color: isCompleted ? theme.success : theme.primary },
                ]}
              >
                {job.totalPrice} JOD
              </ThemedText>
              {isCompleted ? (
                <View style={styles.completedBadge}>
                  <Feather name="check" size={12} color={theme.success} />
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  jobId: {
    ...Typography.caption,
    fontWeight: "500",
  },
  description: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  detailText: {
    ...Typography.caption,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  personInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  personAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  personAvatarText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  personName: {
    ...Typography.small,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  price: {
    ...Typography.h4,
    fontVariant: ["tabular-nums"],
  },
  completedBadge: {
    marginLeft: 2,
  },
});
