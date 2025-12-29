import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, Typography, JobStateColors } from "@/constants/theme";
import { JOB_STATUS_LABELS, JOB_STATUS_ORDER } from "@/types";
import type { JobTimelineEvent, JobStatus } from "@/types";

interface StatusTimelineProps {
  timeline: JobTimelineEvent[];
  currentStatus: JobStatus;
}

export function StatusTimeline({ timeline, currentStatus }: StatusTimelineProps) {
  const { theme } = useTheme();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const completedStatuses = timeline.map((t) => t.status);
  const isCancelled = currentStatus === "CANCELLED";

  const displayStatuses = isCancelled
    ? [...completedStatuses]
    : JOB_STATUS_ORDER.filter((s) => s !== "SETTLED");

  return (
    <View style={styles.container}>
      {displayStatuses.map((status, index) => {
        const event = timeline.find((t) => t.status === status);
        const isCompleted = completedStatuses.includes(status);
        const isCurrent = status === currentStatus;
        const isFuture = !isCompleted && !isCurrent;

        const statusColor = isCompleted || isCurrent
          ? JobStateColors[status] || theme.success
          : theme.textSecondary;

        return (
          <View key={status} style={styles.timelineItem}>
            <View style={styles.iconColumn}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isFuture ? "transparent" : `${statusColor}20`,
                    borderColor: statusColor,
                    borderWidth: isFuture ? 2 : 0,
                  },
                ]}
              >
                {isCompleted || isCurrent ? (
                  <Feather
                    name={isCurrent && !isCancelled ? "circle" : "check"}
                    size={14}
                    color={statusColor}
                  />
                ) : (
                  <View style={[styles.futureCircle, { backgroundColor: theme.textSecondary }]} />
                )}
              </View>
              {index < displayStatuses.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: isCompleted
                        ? theme.success
                        : theme.border,
                    },
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.contentColumn}>
              <ThemedText
                style={[
                  styles.statusLabel,
                  {
                    color: isFuture ? theme.textSecondary : theme.text,
                    fontWeight: isCurrent ? "600" : "400",
                  },
                ]}
              >
                {JOB_STATUS_LABELS[status]}
              </ThemedText>
              {event ? (
                <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
                  {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
                  Pending
                </ThemedText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 52,
  },
  iconColumn: {
    width: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  futureCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  statusLabel: {
    ...Typography.body,
    marginBottom: 2,
  },
  timestamp: {
    ...Typography.caption,
  },
});
