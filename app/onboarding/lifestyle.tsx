import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { OptionSelect } from '../../components/OptionSelect';
import { theme } from '../../constants/theme';
import { useTranslated } from '../../context/LanguageContext';

export default function LifestyleScreen() {
  const router = useRouter();
  const [activity, setActivity] = useState('moderate');

  // Logic: All UI strings are wrapped here for automatic translation
  const t = useTranslated({
    appTitle: 'CogniLife',
    appSubtitle: 'Your AI Health Intelligence',
    cardTitle: 'Lifestyle Habits',
    cardSubtitle: 'Tell us about your daily routine',
    sleepLabel: 'Average Sleep Hours',
    sleepValue: 'hours',
    activityLabel: 'Activity Level',
    low: 'Low - Mostly sedentary',
    moderate: 'Moderate - Some activity',
    high: 'High - Very active',
    continue: 'Continue >',
    back: 'Back',
  });

  const activityOptions = [
    { label: t.low, value: 'low' },
    { label: t.moderate, value: 'moderate' },
    { label: t.high, value: 'high' }
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="pulse" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>{t.appTitle}</Text>
            <Text style={styles.subtitle}>{t.appSubtitle}</Text>
            
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
            </View>
          </View>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t.cardTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.cardSubtitle}</Text>

            <View style={styles.sleepSection}>
              <Text style={styles.label}>
                <Ionicons name="moon-outline" size={16} /> {t.sleepLabel}
              </Text>
              <View style={styles.mockSliderContainer}>
                <View style={styles.mockSliderTrack}>
                  <View style={styles.mockSliderFill} />
                </View>
                <View style={styles.mockSliderThumb} />
              </View>
              <Text style={styles.sleepText}>7 {t.sleepValue}</Text>
            </View>

            <Text style={styles.label}>{t.activityLabel}</Text>
            <OptionSelect
              options={activityOptions}
              value={activity}
              onChange={setActivity}
            />

            <Button 
              title={t.continue} 
              onPress={() => router.push('/onboarding/connect')} 
              style={styles.button}
            />
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>{t.back}</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
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
  cardTitle: { ...theme.typography.h2, marginBottom: 4 },
  cardSubtitle: { ...theme.typography.small, marginBottom: 24 },
  label: { ...theme.typography.small, color: theme.colors.text, fontWeight: '600', marginBottom: 12 },
  sleepSection: { marginBottom: 24 },
  mockSliderContainer: { height: 24, justifyContent: 'center', position: 'relative', marginBottom: 8 },
  mockSliderTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  mockSliderFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%', backgroundColor: theme.colors.secondary },
  mockSliderThumb: { position: 'absolute', left: '60%', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', marginLeft: -10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  sleepText: { textAlign: 'center', color: theme.colors.secondary, fontSize: 20, fontWeight: '700' },
  button: { marginTop: 24 },
  backButton: { marginTop: 16, alignItems: 'center' },
  backText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' }
});