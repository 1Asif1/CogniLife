import { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!gender || !height || !weight) {
      setError('Please fill in all fields');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          gender: gender.trim(),
          height: parseFloat(height),
          weight: parseFloat(weight)
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      
      router.push('/onboarding/lifestyle');
    } catch (e: any) {
      setError(e.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

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

              {error ? (
                <Text style={{ color: theme.colors.danger, marginBottom: 12, fontSize: 13 }}>
                  {error}
                </Text>
              ) : null}
              
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      gender === option && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender(option)}
                  >
                    <Text style={[
                      styles.genderText,
                      gender === option && styles.genderTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input 
                    label="Height (cm)" 
                    placeholder="170" 
                    keyboardType="numeric" 
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input 
                    label="Weight (kg)" 
                    placeholder="70" 
                    keyboardType="numeric" 
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
              ) : (
                <Button 
                  title="Continue >" 
                  onPress={handleContinue} 
                  style={styles.button}
                />
              )}
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
  label: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  genderTextSelected: {
    color: theme.colors.surface,
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
