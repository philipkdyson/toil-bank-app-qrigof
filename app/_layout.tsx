
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
// Note: Error logging is auto-initialized via index.ts import

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)", // Ensure any route can link back to `/`
};

function NavigationHandler() {
  const { hasSeenOnboarding, loading: onboardingLoading } = useOnboarding();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait for both onboarding and auth to finish loading
    if (onboardingLoading || authLoading) {
      return;
    }

    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === 'auth';
    const inApp = segments[0] === '(tabs)';

    console.log('Navigation check:', { 
      hasSeenOnboarding, 
      user: user?.email, 
      inOnboarding, 
      inAuth,
      inApp,
      segments 
    });

    // First time user - show onboarding
    if (!hasSeenOnboarding && !inOnboarding) {
      console.log('Redirecting to onboarding');
      router.replace('/onboarding');
      setIsInitialized(true);
      return;
    }

    // User has seen onboarding but not authenticated
    if (hasSeenOnboarding && !user && !inAuth) {
      console.log('Redirecting to auth');
      router.replace('/auth');
      setIsInitialized(true);
      return;
    }

    // User is authenticated - go to main app
    if (hasSeenOnboarding && user && !inApp) {
      console.log('Redirecting to main app');
      router.replace('/(tabs)/(home)/');
      setIsInitialized(true);
      return;
    }

    setIsInitialized(true);
  }, [hasSeenOnboarding, user, onboardingLoading, authLoading, segments, router]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Note: Removed Alert.alert for offline notification as it's not web-compatible
  // The app works offline by default with local storage

  if (!loaded) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)", // System Blue
      background: "rgb(242, 242, 247)", // Light mode background
      card: "rgb(255, 255, 255)", // White cards/surfaces
      text: "rgb(0, 0, 0)", // Black text for light mode
      border: "rgb(216, 216, 220)", // Light gray for separators/borders
      notification: "rgb(255, 59, 48)", // System Red
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)", // System Blue (Dark Mode)
      background: "rgb(1, 1, 1)", // True black background for OLED displays
      card: "rgb(28, 28, 30)", // Dark card/surface color
      text: "rgb(255, 255, 255)", // White text for dark mode
      border: "rgb(44, 44, 46)", // Dark gray for separators/borders
      notification: "rgb(255, 69, 58)", // System Red (Dark Mode)
    },
  };
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <AuthProvider>
            <OnboardingProvider>
              <WidgetProvider>
                <GestureHandlerRootView>
                  <NavigationHandler />
                  <Stack>
                    {/* Onboarding */}
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    {/* Authentication */}
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="auth-popup" options={{ headerShown: false }} />
                    <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
                    {/* Main app with tabs */}
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  </Stack>
                  <SystemBars style={"auto"} />
                </GestureHandlerRootView>
              </WidgetProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
    </>
  );
}
