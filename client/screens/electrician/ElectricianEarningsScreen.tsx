import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, getElectricianStats } from "@/lib/storage";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Transaction, ElectricianStats } from "@/types";

export default function ElectricianEarningsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<ElectricianStats>({
    currentBalance: 0,
    creditLimit: 50,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0,
    completedJobs: 0,
    acceptanceRate: 0.95,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const allTransactions = await getTransactions();
    const userTransactions = allTransactions.filter((t) => t.electricianId === user.id);
    setTransactions(userTransactions);
    setStats(getElectricianStats(userTransactions));
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

  const formatCurrency = (amount: number) => {
    return `${amount >= 0 ? "" : "-"}${Math.abs(amount).toFixed(0)} JOD`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: Transaction["type"]): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "earning":
        return "plus-circle";
      case "commission":
        return "percent";
      case "settlement":
        return "download";
      case "deduction":
        return "minus-circle";
      case "bonus":
        return "gift";
      default:
        return "circle";
    }
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    switch (type) {
      case "earning":
      case "bonus":
        return theme.success;
      case "commission":
      case "deduction":
        return theme.error;
      case "settlement":
        return theme.primary;
      default:
        return theme.textSecondary;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <View
        style={[
          styles.transactionIcon,
          { backgroundColor: `${getTransactionColor(item.type)}15` },
        ]}
      >
        <Feather
          name={getTransactionIcon(item.type)}
          size={20}
          color={getTransactionColor(item.type)}
        />
      </View>
      <View style={styles.transactionInfo}>
        <ThemedText style={styles.transactionDescription}>{item.description}</ThemedText>
        <ThemedText style={[styles.transactionDate, { color: theme.textSecondary }]}>
          {formatDate(item.createdAt)}
        </ThemedText>
      </View>
      <ThemedText
        style={[
          styles.transactionAmount,
          { color: getTransactionColor(item.type) },
        ]}
      >
        {item.type === "earning" || item.type === "bonus" ? "+" : "-"}
        {Math.abs(item.amount).toFixed(0)} JOD
      </ThemedText>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="trending-up" size={48} color={theme.textSecondary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Earnings Yet</ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Complete jobs to start earning. Your transaction history will appear here.
      </ThemedText>
    </View>
  );

  const balanceIsNegative = stats.currentBalance < 0;

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
          transactions.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <ThemedText style={styles.headerTitle}>Earnings</ThemedText>

            <Card
              style={[
                styles.balanceCard,
                { backgroundColor: balanceIsNegative ? `${theme.error}10` : theme.backgroundDefault },
              ]}
            >
              <View style={styles.balanceHeader}>
                <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                  Current Balance
                </ThemedText>
                {balanceIsNegative ? (
                  <View style={[styles.warningBadge, { backgroundColor: theme.error }]}>
                    <Feather name="alert-circle" size={12} color="#FFFFFF" />
                    <ThemedText style={styles.warningBadgeText}>Low Balance</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText
                style={[
                  styles.balanceAmount,
                  { color: balanceIsNegative ? theme.error : theme.text },
                ]}
              >
                {formatCurrency(stats.currentBalance)}
              </ThemedText>
              {balanceIsNegative ? (
                <View style={styles.creditLimitRow}>
                  <ThemedText style={[styles.creditLimitText, { color: theme.textSecondary }]}>
                    Credit Limit: {stats.creditLimit} JOD
                  </ThemedText>
                </View>
              ) : null}
            </Card>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  This Week
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.success }]}>
                  {formatCurrency(stats.thisWeekEarnings)}
                </ThemedText>
              </Card>
              <Card style={styles.statCard}>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  This Month
                </ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                  {formatCurrency(stats.thisMonthEarnings)}
                </ThemedText>
              </Card>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Feather name="briefcase" size={20} color={theme.textSecondary} />
                <ThemedText style={[styles.metricValue, { color: theme.text }]}>
                  {stats.completedJobs}
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Jobs
                </ThemedText>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
              <View style={styles.metricItem}>
                <Feather name="check-circle" size={20} color={theme.textSecondary} />
                <ThemedText style={[styles.metricValue, { color: theme.text }]}>
                  {(stats.acceptanceRate * 100).toFixed(0)}%
                </ThemedText>
                <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Acceptance
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>Transaction History</ThemedText>
          </>
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
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyListContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xl,
  },
  balanceCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    ...Typography.small,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  warningBadgeText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  creditLimitRow: {
    marginTop: Spacing.sm,
  },
  creditLimitText: {
    ...Typography.small,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
    fontVariant: ["tabular-nums"],
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  metricItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    ...Typography.h4,
  },
  metricLabel: {
    ...Typography.caption,
  },
  metricDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    ...Typography.body,
    marginBottom: 2,
  },
  transactionDate: {
    ...Typography.caption,
  },
  transactionAmount: {
    ...Typography.h4,
    fontVariant: ["tabular-nums"],
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
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
