import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';
import { useTranslated } from '../context/LanguageContext';

export default function ContactDoctorsScreen() {
  const router = useRouter();

  const t = useTranslated({
    header: 'Contact Doctors',
    subHeader: 'Connect with health professionals',
    emptyTitle: 'No Doctors Available',
    emptyDesc: 'You haven\'t added any doctors to your network yet.',
    addBtn: 'Add New Doctor',
  });

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
        <Card style={styles.emptyCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="medkit-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
          <Text style={styles.emptyDesc}>{t.emptyDesc}</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>{t.addBtn}</Text>
          </TouchableOpacity>
        </Card>
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
  emptyCard: { padding: 32, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 16 }
});