import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { screenTimeService } from '../../services/screenTimeService';
import {
  initializeHealthConnect,
  requestHealthPermissions,
  isHealthConnectAvailable,
  hasHealthPermissions,
} from '../../services/healthConnectService';

interface PermissionCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  status: 'idle' | 'granted' | 'denied' | 'loading';
  onPress: () => void;
  buttonLabel: string;
}

function PermissionCard({ icon, iconColor, iconBg, title, description, status, onPress, buttonLabel }: PermissionCardProps) {
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
            <Text style={styles.grantedText}>Connected</Text>
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
  const [screenTimeStatus, setScreenTimeStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');
  const [healthStatus, setHealthStatus] = useState<'idle' | 'granted' | 'denied' | 'loading'>('idle');

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
            <Text style={styles.cardTitle}>Connect & Permissions</Text>
            <Text style={styles.cardSubtitle}>Enable data collection for better insights</Text>

            {/* Screen Time Permission */}
            <PermissionCard
              icon="phone-portrait-outline"
              iconColor={theme.colors.primary}
              iconBg="#EDE9FE"
              title="Screen Time"
              description="Track daily phone usage and late-night screen time to identify digital wellness patterns."
              status={screenTimeStatus}
              onPress={handleScreenTimePermission}
              buttonLabel="Grant Access"
            />

            {/* Health Connect / Wearable */}
            <PermissionCard
              icon="watch-outline"
              iconColor={theme.colors.secondary}
              iconBg="#DBEAFE"
              title="Health Connect"
              description="Sync sleep, activity, and fitness data from your wearable device via Google Health Connect."
              status={healthStatus}
              onPress={handleHealthConnect}
              buttonLabel="Connect"
            />

            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} style={{ marginRight: 10 }} />
              <Text style={styles.infoText}>
                Your data stays private and is only used to generate personalized health insights. You can revoke access anytime.
              </Text>
            </View>

            <Button 
              title="Get Started >" 
              onPress={() => router.replace('/(tabs)')} 
              style={styles.button}
            />
            
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
  cardTitle: { ...theme.typography.h2, marginBottom: 4 },
  cardSubtitle: { ...theme.typography.small, marginBottom: 20 },
  
  // Permission Card styles
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
