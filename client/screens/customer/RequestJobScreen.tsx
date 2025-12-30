import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { addJob, generateId } from "@/lib/storage";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Job, JobStatus } from "@/types";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SERVICE_OPTIONS = [
  { id: "outlet", name: "Outlet Installation/Repair", price: 25 },
  { id: "switch", name: "Light Switch Replacement", price: 20 },
  { id: "lighting", name: "Lighting Installation", price: 35 },
  { id: "panel", name: "Electrical Panel Inspection", price: 45 },
  { id: "wiring", name: "Wiring Repair", price: 50 },
  { id: "other", name: "Other Electrical Issue", price: 30 },
];

export default function RequestJobScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = SERVICE_OPTIONS.find((s) => s.id === selectedService);

  const handleSubmit = async () => {
    if (!selectedService) {
      Alert.alert("Select Service", "Please select a service type.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter your address.");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    const now = new Date();
    const job: Job = {
      id: generateId(),
      customerId: user.id,
      status: "BROADCAST" as JobStatus,
      description: description.trim() || selectedOption?.name || "Electrical Service",
      address: address.trim(),
      city: "Amman",
      basePrice: selectedOption?.price || 30,
      addOns: [],
      totalPrice: selectedOption?.price || 30,
      paymentMethod,
      createdAt: now,
      customerName: user.name,
      timeline: [
        { status: "CREATED", timestamp: now },
        { status: "BROADCAST", timestamp: now },
      ],
    };

    try {
      await addJob(job);
      Alert.alert(
        "Request Submitted",
        "We're finding the nearest electrician for you. You'll be notified when one accepts your job.",
        [{ 
          text: "View My Jobs", 
          onPress: () => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: "CustomerMain",
                    state: {
                      routes: [{ name: "Activity" }],
                      index: 0,
                    },
                  },
                ],
              })
            );
          }
        }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>What do you need?</ThemedText>
          {SERVICE_OPTIONS.map((option) => (
            <Card
              key={option.id}
              onPress={() => setSelectedService(option.id)}
              style={[
                styles.serviceCard,
                selectedService === option.id && {
                  borderColor: theme.primary,
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.serviceInfo}>
                <ThemedText style={styles.serviceName}>{option.name}</ThemedText>
                <ThemedText style={[styles.servicePrice, { color: theme.primary }]}>
                  {option.price} JOD
                </ThemedText>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selectedService === option.id ? theme.primary : theme.border },
                ]}
              >
                {selectedService === option.id ? (
                  <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                ) : null}
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Additional Details (Optional)</ThemedText>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Describe your issue in more detail..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Service Address</ThemedText>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <Feather name="map-pin" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter your full address"
              placeholderTextColor={theme.textSecondary}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
          <View style={styles.paymentOptions}>
            <Pressable
              style={[
                styles.paymentOption,
                { backgroundColor: theme.backgroundDefault, borderColor: paymentMethod === "card" ? theme.primary : theme.border },
                paymentMethod === "card" && { borderWidth: 2 },
              ]}
              onPress={() => setPaymentMethod("card")}
            >
              <Feather name="credit-card" size={24} color={paymentMethod === "card" ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.paymentLabel, paymentMethod === "card" && { color: theme.primary }]}>
                Card
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.paymentOption,
                { backgroundColor: theme.backgroundDefault, borderColor: paymentMethod === "cash" ? theme.primary : theme.border },
                paymentMethod === "cash" && { borderWidth: 2 },
              ]}
              onPress={() => setPaymentMethod("cash")}
            >
              <Feather name="dollar-sign" size={24} color={paymentMethod === "cash" ? theme.primary : theme.textSecondary} />
              <ThemedText style={[styles.paymentLabel, paymentMethod === "cash" && { color: theme.primary }]}>
                Cash
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {selectedOption ? (
          <Card style={styles.summaryCard}>
            <ThemedText style={styles.summaryTitle}>Order Summary</ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                {selectedOption.name}
              </ThemedText>
              <ThemedText style={styles.summaryValue}>{selectedOption.price} JOD</ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryRow}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={[styles.totalValue, { color: theme.primary }]}>
                {selectedOption.price} JOD
              </ThemedText>
            </View>
          </Card>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: theme.primary, opacity: pressed || isSubmitting ? 0.8 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Request Electrician"}
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.body,
    marginBottom: 2,
  },
  servicePrice: {
    ...Typography.small,
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    minHeight: 100,
    ...Typography.body,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  paymentOptions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  paymentLabel: {
    ...Typography.small,
    fontWeight: "500",
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    ...Typography.body,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: "500",
  },
  summaryDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    ...Typography.h4,
  },
  totalValue: {
    ...Typography.price,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
});
