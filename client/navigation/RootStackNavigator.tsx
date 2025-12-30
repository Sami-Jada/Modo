import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

import RoleSelectionScreen from "@/screens/auth/RoleSelectionScreen";
import CustomerTabNavigator from "@/navigation/CustomerTabNavigator";
import ElectricianTabNavigator from "@/navigation/ElectricianTabNavigator";
import JobDetailScreen from "@/screens/shared/JobDetailScreen";
import RequestJobScreen from "@/screens/customer/RequestJobScreen";
import AddOnRequestScreen from "@/screens/electrician/AddOnRequestScreen";

export type RootStackParamList = {
  RoleSelection: undefined;
  CustomerMain: undefined;
  ElectricianMain: undefined;
  JobDetail: { jobId: string };
  RequestJob: undefined;
  AddOnRequest: { jobId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!user ? (
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
      ) : user.role === "customer" ? (
        <>
          <Stack.Screen
            name="CustomerMain"
            component={CustomerTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RequestJob"
            component={RequestJobScreen}
            options={{
              presentation: "modal",
              headerTitle: "Request Electrician",
            }}
          />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{
              presentation: "modal",
              headerTitle: "Job Details",
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="ElectricianMain"
            component={ElectricianTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="JobDetail"
            component={JobDetailScreen}
            options={{
              presentation: "modal",
              headerTitle: "Job Details",
            }}
          />
          <Stack.Screen
            name="AddOnRequest"
            component={AddOnRequestScreen}
            options={{
              presentation: "modal",
              headerTitle: "Request Add-on",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundRoot,
  },
});
