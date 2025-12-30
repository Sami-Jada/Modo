import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "job_updates",
      title: "Job Updates",
      description: "Get notified when your job status changes",
      enabled: true,
    },
    {
      id: "electrician_arrival",
      title: "Electrician Arrival",
      description: "Know when your electrician is on the way",
      enabled: true,
    },
    {
      id: "promotions",
      title: "Promotions & Offers",
      description: "Receive special deals and discounts",
      enabled: false,
    },
    {
      id: "reminders",
      title: "Service Reminders",
      description: "Get reminded about scheduled services",
      enabled: true,
    },
    {
      id: "feedback",
      title: "Review Requests",
      description: "Be asked to rate completed services",
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
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
        <Card style={styles.settingsCard}>
          {settings.map((setting, index) => (
            <View 
              key={setting.id} 
              style={[
                styles.settingRow,
                index < settings.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null,
              ]}
            >
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>{setting.title}</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {setting.description}
                </ThemedText>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: theme.border, true: theme.primary + "80" }}
                thumbColor={setting.enabled ? theme.primary : theme.textSecondary}
              />
            </View>
          ))}
        </Card>

        <ThemedText style={[styles.note, { color: theme.textSecondary }]}>
          Push notifications require enabling notifications for Kahraba in your device settings.
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
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.h4,
    marginBottom: 4,
  },
  settingDescription: {
    ...Typography.small,
    lineHeight: 18,
  },
  note: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
});
