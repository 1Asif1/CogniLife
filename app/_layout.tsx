import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      setTimeout(() => router.replace('/auth/login'), 0);
    } else if (session && inAuthGroup) {
      setTimeout(() => router.replace('/(tabs)'), 0);
    }
  }, [session, isLoading, segments, isNavigationReady]);

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
      <Stack.Screen name="help-center" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="contact-doctors" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications-settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy-security" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="app-permissions" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

function AppWithLanguage() {
  const { user } = useAuth();
  return (
    <LanguageProvider userId={user?.id}>
      <InitialLayout />
      <StatusBar style="auto" />
    </LanguageProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A25D7" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppWithLanguage />
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