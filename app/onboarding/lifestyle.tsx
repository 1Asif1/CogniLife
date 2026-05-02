import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function LifestyleScreen() {
  const router = useRouter();
  const { user, fetchUserProfile } = useAuth();
  const [agreed, setAgreed] = useState(false);

  const handleGetStarted = async () => {
    if (!agreed) return;
    
    if (user) {
      await fetchUserProfile(user.email ?? '', user.id);
    }
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="pulse" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>CogniLife</Text>
            <Text style={styles.subtitle}>Your AI Health Intelligence</Text>

            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>User Disclaimer & Consent</Text>

            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerIntro}>
                By creating an account and using this application, you acknowledge and agree to the following:
              </Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Informational Purpose Only</Text>
                <Text style={styles.sectionText}>
                  The insights, predictions, and recommendations provided by this application are generated using machine learning models and are intended for informational and educational purposes only. They do not constitute medical advice, diagnosis, or treatment.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Not a Substitute for Professional Care</Text>
                <Text style={styles.sectionText}>
                  This application is not a replacement for professional medical consultation. You should always seek advice from a qualified healthcare professional regarding any health-related concerns.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Data Collection & Usage</Text>
                <Text style={styles.sectionText}>
                  The application collects and processes data such as lifestyle habits, activity levels, and usage patterns (including data from wearable devices and mobile monitoring) to generate personalized insights.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Accuracy of Data</Text>
                <Text style={styles.sectionText}>
                  The quality of insights depends on the accuracy and completeness of the data provided or collected. The application is not responsible for incorrect predictions resulting from inaccurate or incomplete data.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Privacy & Security</Text>
                <Text style={styles.sectionText}>
                  Your data will be handled securely and used only for analysis and improvement of the system. However, no digital system can guarantee absolute security.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>6. User Responsibility</Text>
                <Text style={styles.sectionText}>
                  You are responsible for how you interpret and act upon the information provided by this application.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>7. Consent</Text>
                <Text style={styles.sectionText}>
                  By proceeding, you confirm that you have read, understood, and agreed to this disclaimer and consent to the collection and processing of your data as described.
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the terms and conditions and consent to data processing.
              </Text>
            </TouchableOpacity>

            <Button
              title="Get Started"
              onPress={handleGetStarted}
              style={[styles.button, !agreed && styles.buttonDisabled]}
              disabled={!agreed}
            />

            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 64, height: 64, backgroundColor: '#FFF', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24 },
  dotsContainer: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  activeDot: { width: 20, backgroundColor: '#FFF' },
  card: { padding: 24 },
  cardTitle: { ...theme.typography.h2, marginBottom: 20, textAlign: 'center' },
  disclaimerContainer: { marginBottom: 24 },
  disclaimerIntro: { ...theme.typography.body, marginBottom: 16, lineHeight: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { ...theme.typography.h3, marginBottom: 6, color: theme.colors.primary },
  sectionText: { ...theme.typography.small, lineHeight: 18, color: theme.colors.text },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxText: { flex: 1, ...theme.typography.small, lineHeight: 18 },
  button: { marginTop: 4 },
  buttonDisabled: { opacity: 0.5 },
  backButton: { marginTop: 12, alignItems: 'center' },
  backText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
});
