import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslated } from '../../context/LanguageContext';
import {
  hasHealthPermissions,
  initializeHealthConnect,
  requestHealthPermissions
} from '../../services/healthConnectService';
import { screenTimeService } from '../../services/screenTimeService';

interface PermissionCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  status: 'idle' | 'granted' | 'denied' | 'loading';
  onPress: () => void;
  buttonLabel: string;
  grantedLabel: string;
}

function PermissionCard({ icon, iconColor, iconBg, title, description, status, onPress, buttonLabel, grantedLabel }: PermissionCardProps) {
  return (
    <View style={styles.permCard}>
      <View style={styles.permCardHeader}>
        <View style={[styles.permIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.permInfo}>
          <Text style={styles.permTitle}>{title}</Text>
          <Text style={styles.permDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.permCardFooter}>
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : status === 'granted' ? (
          <View style={styles.grantedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.grantedText}>{grantedLabel}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={onPress}>
            <Text style={styles.connectBtnText}>{buttonLabel}</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ConnectScreen() {
  const router = useRouter();
  const { user, fetchUserProfile } = useAuth();
  const [screenTimeStatus, setScreenTimeStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');
  const [healthStatus, setHealthStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');

  const tx = useTranslated({
    cardTitle: 'Connect & Permissions',
    cardSubtitle: 'Enable data collection for better insights',
    screenTimeTitle: 'Screen Time',
    screenTimeDesc: 'Track daily phone usage and late-night screen time to identify digital wellness patterns.',
    screenTimeBtn: 'Grant Access',
    healthTitle: 'Health Connect',
    healthDesc: 'Sync sleep, activity, and fitness data from your wearable device via Google Health Connect.',
    healthBtn: 'Connect',
    connected: 'Connected',
    infoText: 'Your data stays private and is only used to generate personalized health insights. You can revoke access anytime.',
    getStarted: 'Get Started >',
    skip: 'Skip for now',
    back: 'Back',
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const hasScreenTime = await screenTimeService.checkPermission();
    setScreenTimeStatus(hasScreenTime ? 'granted' : 'idle');

    const hasHealth = hasHealthPermissions();
    setHealthStatus(hasHealth ? 'granted' : 'idle');
  };

  const handleScreenTimePermission = async () => {
    setScreenTimeStatus('loading');
    const granted = await screenTimeService.requestPermission();
    setScreenTimeStatus(granted ? 'granted' : 'idle');
  };

  const handleHealthConnect = async () => {
    setHealthStatus('loading');
    await initializeHealthConnect();
    const granted = await requestHealthPermissions();
    setHealthStatus(granted ? 'granted' : 'idle');
  };

  const handleGetStarted = async () => {
    if (user) {
      await fetchUserProfile(user.email ?? '', user.id);
    }
    router.replace('/(tabs)');
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
            <Text style={styles.cardTitle}>{tx.cardTitle}</Text>
            <Text style={styles.cardSubtitle}>{tx.cardSubtitle}</Text>

            <PermissionCard
              icon="phone-portrait-outline"
              iconColor={theme.colors.primary}
              iconBg="#EDE9FE"
              title={tx.screenTimeTitle}
              description={tx.screenTimeDesc}
              status={screenTimeStatus}
              onPress={handleScreenTimePermission}
              buttonLabel={tx.screenTimeBtn}
              grantedLabel={tx.connected}
            />

            <PermissionCard
              icon="watch-outline"
              iconColor={theme.colors.secondary}
              iconBg="#DBEAFE"
              title={tx.healthTitle}
              description={tx.healthDesc}
              status={healthStatus}
              onPress={handleHealthConnect}
              buttonLabel={tx.healthBtn}
              grantedLabel={tx.connected}
            />

            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} style={{ marginRight: 10 }} />
              <Text style={styles.infoText}>{tx.infoText}</Text>
            </View>

            <Button
              title={tx.getStarted}
              onPress={handleGetStarted}
              style={styles.button}
            />

            <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton}>
              <Text style={styles.skipText}>{tx.skip}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>{tx.back}</Text>
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
  cardTitle: { ...theme.typography.h2, marginBottom: 4 },
  cardSubtitle: { ...theme.typography.small, marginBottom: 20 },
  permCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#FAFBFC',
  },
  permCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  permIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  permInfo: {
    flex: 1,
  },
  permTitle: {
    ...theme.typography.h3,
    marginBottom: 4,
  },
  permDescription: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontSize: 12,
  },
  permCardFooter: {
    alignItems: 'flex-end',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  connectBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  grantedText: {
    color: theme.colors.success,
    fontWeight: '600',
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, color: '#166534', fontSize: 12, lineHeight: 18 },
  button: { marginTop: 4 },
  skipButton: { marginTop: 12, alignItems: 'center' },
  skipText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  backButton: { marginTop: 12, alignItems: 'center' },
  backText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
});