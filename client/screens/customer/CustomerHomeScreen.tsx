import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomerHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleRequestElectrician = () => {
    navigation.navigate("RequestJob");
  };

  const features = [
    { icon: "clock" as const, title: "Fast Response", description: "Electrician arrives in 30-60 minutes" },
    { icon: "shield" as const, title: "Verified Pros", description: "All electricians are background-checked" },
    { icon: "tag" as const, title: "Fixed Pricing", description: "Know the exact cost upfront" },
  ];

  const howItWorks = [
    { step: 1, title: "Describe Your Issue", description: "Tell us what electrical work you need" },
    { step: 2, title: "Get Matched", description: "We find the nearest available electrician" },
    { step: 3, title: "Job Completed", description: "Pay securely when the work is done" },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: tabBarHeight + Spacing.buttonHeight + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../../assets/images/icon.png")}
              style={styles.headerLogo}
            />
            <ThemedText style={styles.headerTitle}>Modo</ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.supportButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="help-circle" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Card style={styles.heroCard}>
          <View style={[styles.heroIconContainer, { backgroundColor: theme.primary }]}>
            <Feather name="zap" size={40} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.heroTitle}>Need an Electrician?</ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Professional electrical services for your home in Amman
          </ThemedText>
        </Card>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Why Choose Modo</ThemedText>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name={feature.icon} size={22} color={theme.primary} />
              </View>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                <ThemedText style={[styles.featureDescription, { color: theme.textSecondary }]}>
                  {feature.description}
                </ThemedText>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>How It Works</ThemedText>
          {howItWorks.map((item, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.stepNumberText}>{item.step}</ThemedText>
              </View>
              <View style={styles.stepContent}>
                <ThemedText style={styles.stepTitle}>{item.title}</ThemedText>
                <ThemedText style={[styles.stepDescription, { color: theme.textSecondary }]}>
                  {item.description}
                </ThemedText>
              </View>
              {index < howItWorks.length - 1 ? (
                <View style={[styles.stepConnector, { backgroundColor: theme.border }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Card style={[styles.trustCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Feather name="check-circle" size={18} color={theme.success} />
              <ThemedText style={styles.trustBadgeText}>Verified</ThemedText>
            </View>
            <View style={styles.trustBadge}>
              <Feather name="shield" size={18} color={theme.primary} />
              <ThemedText style={styles.trustBadgeText}>Insured</ThemedText>
            </View>
            <View style={styles.trustBadge}>
              <Feather name="star" size={18} color={Colors.light.warning} />
              <ThemedText style={styles.trustBadgeText}>Top Rated</ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View
        style={[
          styles.floatingButtonContainer,
          { bottom: tabBarHeight + Spacing.lg, paddingHorizontal: Spacing.xl },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.requestButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
            Shadows.card,
          ]}
          onPress={handleRequestElectrician}
        >
          <Feather name="zap" size={22} color="#FFFFFF" />
          <ThemedText style={styles.requestButtonText}>Request Electrician</ThemedText>
        </Pressable>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
  },
  headerTitle: {
    ...Typography.h3,
  },
  supportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h4,
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.small,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    position: "relative",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
    zIndex: 1,
  },
  stepNumberText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    ...Typography.h4,
    marginBottom: 2,
  },
  stepDescription: {
    ...Typography.small,
  },
  stepConnector: {
    position: "absolute",
    left: 15,
    top: 36,
    width: 2,
    height: 32,
  },
  trustCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  trustBadges: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  trustBadgeText: {
    ...Typography.small,
    fontWeight: "500",
  },
  floatingButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  requestButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  requestButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
});
