import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BasicInfoScreen() {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="pulse" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>CogniLife</Text>
              <Text style={styles.subtitle}>Your AI Health Intelligence</Text>
              
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Basic Information</Text>
              <Text style={styles.cardSubtitle}>Help us understand you better</Text>

              <Input 
                label="Age" 
                placeholder="Enter your age" 
                keyboardType="numeric" 
              />
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input 
                    label="Height (cm)" 
                    placeholder="170" 
                    keyboardType="numeric" 
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input 
                    label="Weight (kg)" 
                    placeholder="70" 
                    keyboardType="numeric" 
                  />
                </View>
              </View>

              <Button 
                title="Continue >" 
                onPress={() => router.push('/onboarding/lifestyle')} 
                style={styles.button}
              />
            </Card>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 24 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FFF',
  },
  card: {
    padding: 24,
  },
  cardTitle: {
    ...theme.typography.h2,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...theme.typography.small,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  button: {
    marginTop: 16,
  }
});
