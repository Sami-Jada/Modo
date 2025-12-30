import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I request an electrician?",
    answer: "From the home screen, tap 'Request Electrician', describe your electrical issue, and submit. We'll match you with a qualified electrician.",
  },
  {
    question: "How long until an electrician arrives?",
    answer: "Most electricians arrive within 30-60 minutes of accepting your job, depending on their location and current workload.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "Currently, we accept cash payments directly to the electrician. Card and mobile wallet payments are coming soon.",
  },
  {
    question: "How are prices determined?",
    answer: "Prices are fixed based on the type of service. You'll see the price before confirming your request. Additional work requires your approval.",
  },
  {
    question: "What if I need to cancel a job?",
    answer: "You can cancel anytime before the electrician arrives. Cancellations after arrival may incur a small fee.",
  },
];

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const handleContact = (method: string) => {
    if (method === "phone") {
      Linking.openURL("tel:+962791234567");
    } else if (method === "email") {
      Linking.openURL("mailto:support@kahraba.jo");
    } else if (method === "whatsapp") {
      Linking.openURL("https://wa.me/962791234567");
    }
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
        <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
        
        <View style={styles.contactRow}>
          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => handleContact("phone")}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="phone" size={24} color={theme.primary} />
            </View>
            <ThemedText style={styles.contactLabel}>Call</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => handleContact("email")}
          >
            <View style={[styles.contactIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="mail" size={24} color={theme.primary} />
            </View>
            <ThemedText style={styles.contactLabel}>Email</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.contactButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => handleContact("whatsapp")}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#25D366" + "20" }]}>
              <Feather name="message-circle" size={24} color="#25D366" />
            </View>
            <ThemedText style={styles.contactLabel}>WhatsApp</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          Frequently Asked Questions
        </ThemedText>

        <Card style={styles.faqCard}>
          {faqs.map((faq, index) => (
            <Pressable
              key={index}
              style={[
                styles.faqItem,
                index < faqs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: theme.border } : null,
              ]}
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
                <Feather 
                  name={expandedIndex === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </View>
              {expandedIndex === index ? (
                <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                  {faq.answer}
                </ThemedText>
              ) : null}
            </Pressable>
          ))}
        </Card>
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
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  contactLabel: {
    ...Typography.small,
    fontWeight: "600",
  },
  faqCard: {
    padding: 0,
    overflow: "hidden",
  },
  faqItem: {
    padding: Spacing.lg,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    ...Typography.h4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    ...Typography.body,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
