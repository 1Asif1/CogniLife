import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { Input } from '../../components/Input';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslated } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // ✅ Moved inside the component (was incorrectly outside before)
  const tx = useTranslated({
    cardTitle: 'Basic Information',
    cardSubtitle: 'Help us understand you better',
    labelGender: 'Gender',
    optionMale: 'Male',
    optionFemale: 'Female',
    optionOther: 'Other',
    labelHeight: 'Height (cm)',
    labelWeight: 'Weight (kg)',
    placeholderHeight: '170',
    placeholderWeight: '70',
    continueBtn: 'Continue >',
    errorFields: 'Please fill in all fields',
    errorLogin: 'You must be logged in',
    errorUpdate: 'Error updating profile',
  });

  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!gender || !height || !weight) {
      setError(tx.errorFields);
      return;
    }

    if (!user) {
      setError(tx.errorLogin);
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

      router.push('/onboarding/connect');
    } catch (e: any) {
      setError(e.message || tx.errorUpdate);
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
              <Text style={styles.cardTitle}>{tx.cardTitle}</Text>
              <Text style={styles.cardSubtitle}>{tx.cardSubtitle}</Text>

              {error ? (
                <Text style={{ color: theme.colors.danger, marginBottom: 12, fontSize: 13 }}>
                  {error}
                </Text>
              ) : null}

              <Text style={styles.label}>{tx.labelGender}</Text>
              <View style={styles.genderRow}>
                {[tx.optionMale, tx.optionFemale, tx.optionOther].map((option, index) => {
                  const rawValues = ['Male', 'Female', 'Other'];
                  return (
                    <TouchableOpacity
                      key={rawValues[index]}
                      style={[
                        styles.genderOption,
                        gender === rawValues[index] && styles.genderOptionSelected
                      ]}
                      onPress={() => setGender(rawValues[index])}
                    >
                      <Text style={[
                        styles.genderText,
                        gender === rawValues[index] && styles.genderTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label={tx.labelHeight}
                    placeholder={tx.placeholderHeight}
                    keyboardType="numeric"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input
                    label={tx.labelWeight}
                    placeholder={tx.placeholderWeight}
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
                  title={tx.continueBtn}
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