import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';

interface NotificationToggle {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultValue: boolean;
}

const notificationSettings: NotificationToggle[] = [
  {
    id: 'daily_reminder',
    title: 'Daily Log Reminder',
    subtitle: 'Get reminded to fill your daily health log',
    icon: 'calendar-outline',
    defaultValue: true,
  },
  {
    id: 'health_insights',
    title: 'Health Insights',
    subtitle: 'Receive new AI-generated health insights',
    icon: 'analytics-outline',
    defaultValue: true,
  },
  {
    id: 'goal_alerts',
    title: 'Goal Alerts',
    subtitle: 'Notifications when you hit or miss your goals',
    icon: 'trophy-outline',
    defaultValue: true,
  },
  {
    id: 'device_sync',
    title: 'Device Sync Updates',
    subtitle: 'Alerts when wearable data syncs or fails',
    icon: 'watch-outline',
    defaultValue: false,
  },
  {
    id: 'weekly_report',
    title: 'Weekly Health Report',
    subtitle: 'Summary of your weekly health trends',
    icon: 'bar-chart-outline',
    defaultValue: true,
  },
  {
    id: 'doctor_messages',
    title: 'Doctor Messages',
    subtitle: 'Notifications for doctor communication',
    icon: 'medkit-outline',
    defaultValue: true,
  },
];

function NotificationToggleItem({
  item,
  value,
  onToggle,
  showBorder = true,
}: {
  item: NotificationToggle;
  value: boolean;
  onToggle: (val: boolean) => void;
  showBorder?: boolean;
}) {
  return (
    <View style={[styles.toggleItem, showBorder && styles.toggleBorder]}>
      <View style={[styles.toggleIconWrap, value && styles.toggleIconActive]}>
        <Ionicons
          name={item.icon}
          size={18}
          color={value ? '#FFF' : theme.colors.primary}
        />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleTitle}>{item.title}</Text>
        <Text style={styles.toggleSubtitle}>{item.subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary + '60' }}
        thumbColor={value ? theme.colors.primary : '#f4f3f4'}
      />
    </View>
  );
}

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    notificationSettings.reduce((acc, item) => {
      acc[item.id] = item.defaultValue;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const enabledCount = Object.values(toggles).filter(Boolean).length;
  const totalCount = notificationSettings.length;

  const handleToggle = (id: string, value: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: value }));
  };

  const handleToggleAll = (value: boolean) => {
    const updated: Record<string, boolean> = {};
    notificationSettings.forEach((item) => {
      updated[item.id] = value;
    });
    setToggles(updated);
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Manage your alert preferences</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Ionicons name="notifications" size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.summaryTitle}>
            {enabledCount} of {totalCount} Active
          </Text>
          <Text style={styles.summarySubtitle}>
            You have {enabledCount} notification {enabledCount === 1 ? 'type' : 'types'} enabled
          </Text>
          <View style={styles.summaryActions}>
            <TouchableOpacity
              style={styles.summaryBtn}
              onPress={() => handleToggleAll(true)}
            >
              <Text style={styles.summaryBtnText}>Enable All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.summaryBtn, styles.summaryBtnOutline]}
              onPress={() => handleToggleAll(false)}
            >
              <Text style={[styles.summaryBtnText, styles.summaryBtnOutlineText]}>
                Disable All
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Notification Toggles */}
        <Card style={styles.settingsCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons
              name="options-outline"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>Notification Types</Text>
          </View>
          {notificationSettings.map((item, index) => (
            <NotificationToggleItem
              key={item.id}
              item={item}
              value={toggles[item.id]}
              onToggle={(val) => handleToggle(item.id, val)}
              showBorder={index < notificationSettings.length - 1}
            />
          ))}
        </Card>

        {/* Info Note */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.infoText}>
              Notification preferences are stored locally on your device. Push notifications require system permissions to be enabled.
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },

  // Summary Card
  summaryCard: { marginBottom: 24, padding: 24, alignItems: 'center' },
  summaryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: { ...theme.typography.h2, marginBottom: 4 },
  summarySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  summaryActions: { flexDirection: 'row', gap: 12 },
  summaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  summaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  summaryBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryBtnOutlineText: { color: theme.colors.textSecondary },

  // Settings Card
  settingsCard: { marginBottom: 24, padding: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { ...theme.typography.h3 },

  // Toggle Items
  toggleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  toggleBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  toggleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toggleIconActive: { backgroundColor: theme.colors.primary },
  toggleContent: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  toggleSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

  // Info Card
  infoCard: { marginBottom: 24, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary },
});
