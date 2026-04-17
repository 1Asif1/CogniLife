import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ConnectScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
            <Text style={styles.cardTitle}>Connect Devices</Text>
            <Text style={styles.cardSubtitle}>Enhance insights with wearable data</Text>

            <View style={styles.wearableCard}>
              <View style={styles.wearableIcon}>
                <Ionicons name="watch-outline" size={24} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.wearableInfo}>
                <Text style={styles.wearableTitle}>Fitness Tracker</Text>
                <Text style={styles.wearableStatus}>Not connected</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Connect your wearable for more accurate health predictions and personalized insights.
              </Text>
            </View>

            <Button 
              title="Get Started >" 
              onPress={() => router.replace('/(tabs)')} 
              style={styles.button}
            />
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
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
  wearableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    marginBottom: 24,
  },
  wearableIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  wearableTitle: { ...theme.typography.h3 },
  wearableStatus: { ...theme.typography.small },
  infoBox: {
    backgroundColor: '#F3F8FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: { color: '#4B5563', fontSize: 13, lineHeight: 20 },
  button: { marginTop: 8 },
  backButton: { marginTop: 16, alignItems: 'center' },
  backText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' }
});
