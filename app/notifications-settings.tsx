import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { useTranslated } from '../context/LanguageContext';

export default function NotificationsSettingsScreen() {
  const router = useRouter();

  const t = useTranslated({
    header: 'Notifications',
    subHeader: 'Choose what you want to be notified about',
    daily_reminder_title: 'Daily Log Reminder',
    daily_reminder_sub: 'Get reminded to fill your daily health log',
    health_insights_title: 'Health Insights',
    health_insights_sub: 'Receive new AI-generated health insights',
    goal_alerts_title: 'Goal Alerts',
    goal_alerts_sub: 'Notifications when you hit or miss your goals',
    device_sync_title: 'Device Sync',
    device_sync_sub: 'Alerts when your wearable devices sync data',
    sectionTitle: 'Notification Preferences',
  });

  // Memoize the settings list so it only rebuilds when the translated object
  // has fully settled. Without this, intermediate async renders of useTranslated
  // can produce a mix of old + new strings that appear "appended" in the UI.
  const notificationSettings = useMemo(
    () => [
      {
        id: 'daily_reminder',
        title: t.daily_reminder_title,
        subtitle: t.daily_reminder_sub,
        icon: 'calendar-outline' as const,
      },
      {
        id: 'health_insights',
        title: t.health_insights_title,
        subtitle: t.health_insights_sub,
        icon: 'analytics-outline' as const,
      },
      {
        id: 'goal_alerts',
        title: t.goal_alerts_title,
        subtitle: t.goal_alerts_sub,
        icon: 'trophy-outline' as const,
      },
      {
        id: 'device_sync',
        title: t.device_sync_title,
        subtitle: t.device_sync_sub,
        icon: 'sync-outline' as const,
      },
    ],
    // Depend on every translated string individually so the list rebuilds
    // atomically once all keys have been translated (not piecemeal).
    [
      t.daily_reminder_title,
      t.daily_reminder_sub,
      t.health_insights_title,
      t.health_insights_sub,
      t.goal_alerts_title,
      t.goal_alerts_sub,
      t.device_sync_title,
      t.device_sync_sub,
    ]
  );

  return (
    <ScrollView style={styles.container}>
      <GradientBackground style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t.header}</Text>
        <Text style={styles.subtitle}>{t.subHeader}</Text>
      </GradientBackground>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t.sectionTitle}</Text>
        <Card style={styles.card}>
          {notificationSettings.map((item, index) => (
            <NotificationToggle
              key={item.id}
              item={item}
              isLast={index === notificationSettings.length - 1}
            />
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const NotificationToggle = ({ item, isLast }: any) => {
  const [enabled, setEnabled] = useState(true);
  return (
    <View style={[styles.toggleItem, !isLast && styles.borderBottom]}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.toggleTitle}>{item.title}</Text>
        <Text style={styles.toggleSub}>{item.subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ true: theme.colors.primary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 16 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  card: { padding: 16 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  toggleSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});