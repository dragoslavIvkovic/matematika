import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { initNotifications } from "@/utils/NotificationManager";
import { AppStorage } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="daily-practice"
        options={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (__DEV__) {
      // Korisnikov zahtev: Uvek forsiraj onboarding pri podizanju u dev modu
      AppStorage.remove("math_tutor_onboarding_v1");
    }

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      initNotifications().catch(console.error);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SubscriptionProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ErrorBoundary>
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
}
