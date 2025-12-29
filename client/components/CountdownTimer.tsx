import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, Typography } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface CountdownTimerProps {
  durationSeconds: number;
  onComplete: () => void;
}

export function CountdownTimer({ durationSeconds, onComplete }: CountdownTimerProps) {
  const { theme } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        if (prev <= 10) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds, onComplete, progressAnim]);

  useEffect(() => {
    if (secondsLeft <= 10) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [secondsLeft, pulseAnim]);

  const progressColor =
    secondsLeft > 30
      ? theme.success
      : secondsLeft > 10
      ? Colors.light.warning
      : theme.error;

  const circumference = 2 * Math.PI * 22;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: secondsLeft <= 10 ? pulseAnim : 1 }] },
      ]}
    >
      <View style={styles.circleContainer}>
        <View style={[styles.backgroundCircle, { borderColor: theme.border }]} />
        <Animated.View
          style={[
            styles.progressCircle,
            {
              borderColor: progressColor,
              transform: [
                {
                  rotate: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["360deg", "0deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <View style={styles.textContainer}>
          <ThemedText style={[styles.timerText, { color: progressColor }]}>
            {secondsLeft}
          </ThemedText>
          <ThemedText style={[styles.unitText, { color: theme.textSecondary }]}>
            sec
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
  },
  progressCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  textContainer: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unitText: {
    ...Typography.caption,
    marginTop: -2,
  },
});
