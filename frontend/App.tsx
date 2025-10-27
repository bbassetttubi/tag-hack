import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoryHomeScreen } from "./src/screens/StoryHomeScreen";
import { StoryDetailScreen } from "./src/screens/StoryDetailScreen";
import { StoryReelsScreen } from "./src/screens/StoryReelsScreen";
import { StoriesFeedScreen } from "./src/screens/StoriesFeedScreen";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";

export type RootStackParamList = {
  StoryHome: undefined;
  StoryDetail: { storyId: string };
  StoryReels: { storyId: string };
  StoriesFeed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user, loading, signIn, authEnabled } = useAuth();

  useEffect(() => {
    if (authEnabled && !loading && !user) {
      signIn().catch((error) => {
        console.error("Auto sign-in failed:", error);
      });
    }
  }, [authEnabled, loading, user, signIn]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="StoryHome">
        <Stack.Screen name="StoryHome" component={StoryHomeScreen} />
        <Stack.Screen name="StoryReels" component={StoryReelsScreen} />
        <Stack.Screen name="StoriesFeed" component={StoriesFeedScreen} />
        <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
});

