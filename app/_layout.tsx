import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/ThemeContext";
import { AuthProvider, useAuth } from "@/src/AuthContext";
import LoadingScreen from "@/src/components/LoadingScreen";

if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}
SplashScreen.preventAutoHideAsync();

function RootNav() {
  const { user, loading } = useAuth();
  const { t } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    else if (user && inAuth) router.replace("/(app)/dashboard");
  }, [user, loading, segments]);

  if (loading) {
    return <LoadingScreen />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.surface } }} />;
}

function ThemedStatusBar() {
  const { t } = useTheme();
  return <StatusBar style={t.mode === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStatusBar />
            <RootNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
