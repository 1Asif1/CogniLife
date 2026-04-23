import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';

interface Permission {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  status: 'granted' | 'denied' | 'upcoming';
  statusLabel: string;
}

const permissions: Permission[] = [
  {
    icon: 'bluetooth-outline',
    title: 'Bluetooth',
    description: 'Required to connect and sync with wearable health devices like smartwatches and fitness bands.',
    status: 'granted',
    statusLabel: 'Granted',
  },
  {
    icon: 'wifi-outline',
    title: 'Internet Access',
    description: 'Used to sync your health data with the cloud, fetch AI-powered insights, and communicate with doctors.',
    status: 'granted',
    statusLabel: 'Granted',
  },
  {
    icon: 'notifications-outline',
    title: 'Notifications',
    description: 'Sends you daily log reminders, health insight alerts, goal updates, and doctor messages.',
    status: 'granted',
    statusLabel: 'Granted',
  },
  {
    icon: 'fitness-outline',
    title: 'Health Connect (Google)',
    description: 'Reads step count, sleep data, and activity metrics from Google Health Connect to provide comprehensive health insights.',
    status: 'granted',
    statusLabel: 'Granted',
  },
  {
    icon: 'camera-outline',
    title: 'Camera',
    description: 'May be used in the future for profile photos or document scanning for health records.',
    status: 'denied',
    statusLabel: 'Not Requested',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Screen Time & App Usage',
    description: 'Will track daily screen time and app usage patterns to correlate digital habits with mental health and well-being scores.',
    status: 'upcoming',
    statusLabel: 'Coming Soon',
  },
  {
    icon: 'location-outline',
    title: 'Location',
    description: 'Not currently used. May be used in the future for location-based health recommendations.',
    status: 'denied',
    statusLabel: 'Not Requested',
  },
];

function getStatusStyle(status: Permission['status']) {
  switch (status) {
    case 'granted':
      return { bg: theme.colors.success + '15', color: theme.colors.success, icon: 'checkmark-circle' as const };
    case 'denied':
      return { bg: theme.colors.border + '80', color: theme.colors.textSecondary, icon: 'close-circle' as const };
    case 'upcoming':
      return { bg: theme.colors.warning + '20', color: theme.colors.warning, icon: 'time-outline' as const };
  }
}

export default function AppPermissionsScreen() {
  const router = useRouter();

  const grantedCount = permissions.filter(p => p.status === 'granted').length;

  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>App Permissions</Text>
            <Text style={styles.subtitle}>Review what CogniLife can access</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="shield-checkmark" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.summaryTitle}>{grantedCount} Permissions Active</Text>
          <Text style={styles.summarySubtitle}>
            CogniLife only requests permissions essential for your health tracking experience.
          </Text>
        </Card>

        {/* Permission List */}
        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="list-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>All Permissions</Text>
          </View>
          {permissions.map((perm, i) => {
            const s = getStatusStyle(perm.status);
            return (
              <View key={perm.title} style={[styles.permRow, i < permissions.length - 1 && styles.borderBottom]}>
                <View style={[styles.permIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={perm.icon} size={20} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.permTitleRow}>
                    <Text style={styles.permTitle}>{perm.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Ionicons name={s.icon} size={12} color={s.color} />
                      <Text style={[styles.statusText, { color: s.color }]}>{perm.statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.permDesc}>{perm.description}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Info */}
        <Card style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={styles.infoText}>
              You can manage system-level permissions from your device's Settings app. CogniLife will prompt you before requesting any new permission.
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerGradient: { height: 180, paddingTop: 50, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 2 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  summaryCard: { marginBottom: 24, padding: 24, alignItems: 'center' },
  summaryIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primary + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  summaryTitle: { ...theme.typography.h2, marginBottom: 4 },
  summarySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { marginBottom: 24, padding: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { ...theme.typography.h3 },
  permRow: { flexDirection: 'row', paddingVertical: 16, alignItems: 'flex-start' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  permIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  permTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  permTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  permDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
  infoCard: { marginBottom: 24, padding: 16 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary },
});
