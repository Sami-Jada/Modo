import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import type { UserRole } from "@/types";

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Select Role", "Please select how you want to use Kahraba.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      Alert.alert("Phone Required", "Please enter a valid phone number.");
      return;
    }

    setIsLoading(true);
    try {
      await login(selectedRole, name.trim(), phone.trim());
    } catch (error) {
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const RoleCard = ({
    role,
    title,
    description,
    icon,
  }: {
    role: UserRole;
    title: string;
    description: string;
    icon: keyof typeof Feather.glyphMap;
  }) => {
    const isSelected = selectedRole === role;
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        onPress={() => setSelectedRole(role)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.roleCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: isSelected ? theme.primary : theme.border,
              borderWidth: isSelected ? 2 : 1,
              transform: [{ scale: scaleAnim }],
            },
            Shadows.card,
          ]}
        >
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary },
            ]}
          >
            <Feather
              name={icon}
              size={28}
              color={isSelected ? "#FFFFFF" : theme.textSecondary}
            />
          </View>
          <View style={styles.roleTextContainer}>
            <ThemedText style={styles.roleTitle}>{title}</ThemedText>
            <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
              {description}
            </ThemedText>
          </View>
          <View
            style={[
              styles.radioOuter,
              { borderColor: isSelected ? theme.primary : theme.border },
            ]}
          >
            {isSelected ? (
              <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
            ) : null}
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/icon.png")}
            style={styles.logo}
          />
          <ThemedText style={styles.title}>Kahraba</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Home services at your fingertips
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>How will you use Kahraba?</ThemedText>

          <RoleCard
            role="customer"
            title="I need an Electrician"
            description="Request electrical services for your home"
            icon="home"
          />

          <RoleCard
            role="electrician"
            title="I am an Electrician"
            description="Accept jobs and grow your business"
            icon="tool"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Information</ThemedText>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <Feather name="user" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            ]}
          >
            <ThemedText style={styles.phonePrefix}>+962</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Phone Number"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <ThemedText style={styles.continueButtonText}>
            {isLoading ? "Creating Account..." : "Get Started"}
          </ThemedText>
        </Pressable>

        <ThemedText style={[styles.termsText, { color: theme.textSecondary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
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
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  roleDescription: {
    ...Typography.small,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  phonePrefix: {
    ...Typography.body,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    ...Typography.body,
  },
  continueButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  continueButtonText: {
    ...Typography.h4,
    color: "#FFFFFF",
  },
  termsText: {
    ...Typography.caption,
    textAlign: "center",
  },
});
