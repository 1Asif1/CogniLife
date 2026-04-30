import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { Input } from '../../components/Input';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslated } from '../../context/LanguageContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = useTranslated({
    appName: 'CogniLife',
    appSubtitle: 'Your AI Health Intelligence',
    cardTitle: 'Create Account',
    cardSubtitle: 'Join CogniLife to start your journey',
    nameLabel: 'Full Name',
    namePlaceholder: 'John Doe',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    signupBtn: 'Create Account',
    hasAccount: 'Already have an account?',
    signIn: 'Sign In',
  });

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await signUp(email, password, name);
      if (authError) setError(authError.message);
      else router.replace('/onboarding/basic-info');
    } catch (err: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* FIXED CONTAINER: pointerEvents="box-none" is key */}
        <View style={styles.topRightContainer} pointerEvents="box-none">
          <LanguageSwitcher />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="pulse" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>{t.appName}</Text>
              <Text style={styles.subtitle}>{t.appSubtitle}</Text>
            </View>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{t.cardTitle}</Text>
              <Text style={styles.cardSubtitle}>{t.cardSubtitle}</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input label={t.nameLabel} placeholder={t.namePlaceholder} value={name} onChangeText={setName} autoCapitalize="words" />
              <Input label={t.emailLabel} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Input label={t.passwordLabel} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <Input label={t.confirmPasswordLabel} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />

              {loading ? (
                <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
              ) : (
                <Button title={t.signupBtn} onPress={handleSignup} style={styles.button} />
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t.hasAccount} </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.linkText}>{t.signIn}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  topRightContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 100,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 64, height: 64, backgroundColor: '#FFF', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  card: { padding: 24 },
  cardTitle: { ...theme.typography.h2, marginBottom: 4 },
  cardSubtitle: { ...theme.typography.small, marginBottom: 24 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.dangerLight, borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  errorText: { color: theme.colors.danger, fontSize: 13, flex: 1 },
  button: { marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: theme.colors.textSecondary, fontSize: 14 },
  linkText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
});