import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </AuthProvider>
  );
}