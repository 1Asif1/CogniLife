import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';
import { useTranslated } from '../context/LanguageContext';

export default function AppPermissionsScreen() {
  const router = useRouter();

  const t = useTranslated({
    header: 'App Permissions',
    subHeader: 'Manage system access for CogniLife features',
    bluetoothTitle: 'Bluetooth',
    bluetoothDesc: 'Required to connect and sync with wearable health devices.',
    internetTitle: 'Internet Access',
    internetDesc: 'Used to sync data with the cloud and fetch AI insights.',
    notifTitle: 'Notifications',
    notifDesc: 'Sends daily reminders and health insight alerts.',
    statusGranted: 'Granted',
  });

  const permissions = [
    { icon: 'bluetooth-outline', title: t.bluetoothTitle, desc: t.bluetoothDesc },
    { icon: 'wifi-outline', title: t.internetTitle, desc: t.internetDesc },
    { icon: 'notifications-outline', title: t.notifTitle, desc: t.notifDesc },
  ];

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
        {permissions.map((perm, index) => (
          <Card key={index} style={styles.permCard}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name={perm.icon as any} size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.permTitle}>{perm.title}</Text>
                  <View style={styles.badge}><Text style={styles.badgeText}>{t.statusGranted}</Text></View>
                </View>
                <Text style={styles.permDesc}>{perm.desc}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 16 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 20 },
  permCard: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row' },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  permTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  badge: { backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 11, color: theme.colors.success, fontWeight: '600' },
  permDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 }
});