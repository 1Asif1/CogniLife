import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Mark navigation as ready after first render
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inAuthGroup) {
      // Not authenticated and not on auth pages → go to login
      setTimeout(() => router.replace('/auth/login'), 0);
    } else if (session && inAuthGroup) {
      // Authenticated but still on auth pages → go to home
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [session, isLoading, segments, isNavigationReady]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A25D7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="daily-log" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
