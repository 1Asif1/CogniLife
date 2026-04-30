import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';
import { useTranslated } from '../context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = useTranslated({
    header: 'Help Center',
    subHeader: 'Find answers to common questions',
    q1: 'How do I track my daily health?',
    a1: 'Navigate to the Home tab and tap "Daily Log" to record mood, sleep, and water intake.',
    q2: 'How do I connect a wearable device?',
    a2: 'Go to Profile → Connected Devices and tap "Add New Device" with Bluetooth enabled.',
    supportTitle: 'Still need help?',
    supportBtn: 'Contact Support',
  });

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

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
        <FAQItem id="1" question={t.q1} answer={t.a1} expanded={expandedId === "1"} onToggle={() => toggleExpand("1")} />
        <FAQItem id="2" question={t.q2} answer={t.a2} expanded={expandedId === "2"} onToggle={() => toggleExpand("2")} />

        <Card style={styles.supportCard}>
          <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.supportTitle}>{t.supportTitle}</Text>
          <TouchableOpacity style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>{t.supportBtn}</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
}

const FAQItem = ({ question, answer, expanded, onToggle }: any) => (
  <Card style={styles.faqCard}>
    <TouchableOpacity onPress={onToggle} style={styles.faqHeader}>
      <Text style={styles.question}>{question}</Text>
      <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
    {expanded && <Text style={styles.answer}>{answer}</Text>}
  </Card>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 16 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 20 },
  faqCard: { padding: 16, marginBottom: 12 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 15, fontWeight: '600', color: theme.colors.text, flex: 1, marginRight: 8 },
  answer: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, lineHeight: 20 },
  supportCard: { padding: 24, alignItems: 'center', marginTop: 20 },
  supportTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 16 },
  supportBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  supportBtnText: { color: '#FFF', fontWeight: '600' }
});