import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';

export default function ContactDoctorsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Contact Doctors</Text>
            <Text style={styles.subtitle}>Connect with health professionals</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>
        {/* Empty State */}
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIconOuter}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="medkit-outline" size={48} color={theme.colors.primary} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>No Doctors Available</Text>
          <Text style={styles.emptyMessage}>
            No doctor found at this moment to connect with you
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="time-outline" size={20} color={theme.colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Check Back Soon</Text>
              <Text style={styles.infoText}>
                Our medical professionals are being onboarded. Please check back later for available doctors.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Get Notified</Text>
              <Text style={styles.infoText}>
                We'll notify you as soon as doctors become available for consultations.
              </Text>
            </View>
          </View>
        </Card>

        {/* Emergency Note */}
        <Card style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <View style={styles.emergencyIconWrap}>
              <Ionicons name="warning-outline" size={22} color={theme.colors.danger} />
            </View>
            <Text style={styles.emergencyTitle}>In Case of Emergency</Text>
          </View>
          <Text style={styles.emergencyText}>
            If you are experiencing a medical emergency, please call your local emergency services immediately. This app is not a substitute for professional medical care.
          </Text>
        </Card>

        {/* Back to Help Center */}
        <TouchableOpacity
          style={styles.helpCenterBtn}
          onPress={() => router.push('/help-center')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} style={{ marginRight: 10 }} />
          <Text style={styles.helpCenterBtnText}>Visit Help Center</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>

        <Text style={styles.version}>CogniLife v1.0.0</Text>
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

  // Empty State
  emptyCard: { padding: 32, alignItems: 'center', marginBottom: 24 },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...theme.typography.h2,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },

  // Emergency Card
  emergencyCard: {
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.danger,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyTitle: {
    ...theme.typography.h3,
    color: theme.colors.danger,
  },
  emergencyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Help Center Button
  helpCenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 24,
  },
  helpCenterBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  version: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 },
});
