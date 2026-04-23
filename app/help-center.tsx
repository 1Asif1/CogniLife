import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I track my daily health?',
    answer:
      'Navigate to the Home tab and tap on "Daily Log" to record your daily health metrics including mood, sleep quality, water intake, and more. Your data is automatically synced and used to generate personalized insights.',
    icon: 'heart-outline',
  },
  {
    id: '2',
    question: 'How do I connect a wearable device?',
    answer:
      'Go to Profile → Connected Devices and tap "Add New Device". Make sure your Bluetooth is turned on and your wearable device is in pairing mode. The app supports Google Health Connect compatible devices.',
    icon: 'watch-outline',
  },
  {
    id: '3',
    question: 'How are my health insights generated?',
    answer:
      'CogniLife uses advanced AI models to analyze your daily logs, screen time, activity data, and wearable metrics. These are processed to give you actionable health insights and personalized tips on the Insights tab.',
    icon: 'analytics-outline',
  },
  {
    id: '4',
    question: 'Is my health data secure?',
    answer:
      'Absolutely. All your data is encrypted and stored securely using Supabase with row-level security policies. We never share your personal health data with third parties without your explicit consent.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '5',
    question: 'How do I update my profile information?',
    answer:
      'Go to the Profile tab and tap the "Edit" button next to your name. You can update your personal details, height, weight, and other health-related information from there.',
    icon: 'person-outline',
  },
  {
    id: '6',
    question: 'What does the Health Score mean?',
    answer:
      'Your Health Score is a composite metric (0–100) calculated from your daily activity, sleep patterns, mood trends, and screen time habits. A higher score indicates better overall wellness consistency.',
    icon: 'fitness-outline',
  },
];

function FAQAccordionItem({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={[styles.faqItem, expanded && styles.faqItemExpanded]}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <View style={[styles.faqIconWrap, expanded && styles.faqIconWrapActive]}>
          <Ionicons
            name={item.icon}
            size={18}
            color={expanded ? '#FFF' : theme.colors.primary}
          />
        </View>
        <Text style={[styles.faqQuestion, expanded && styles.faqQuestionExpanded]}>
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={expanded ? theme.colors.primary : theme.colors.textSecondary}
        />
      </View>
      {expanded && (
        <View style={styles.faqAnswerWrap}>
          <View style={styles.faqAnswerDivider} />
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Help Center</Text>
            <Text style={styles.subtitle}>Find answers to common questions</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>

        {/* FAQ Section */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        </View>

        {faqData.map((item) => (
          <FAQAccordionItem key={item.id} item={item} />
        ))}

        {/* Still need help */}
        <Card style={styles.stillNeedHelpCard}>
          <View style={styles.stillNeedHelpIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            Can't find what you're looking for? Reach out to our doctors for personalized assistance.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => router.push('/contact-doctors')}
          >
            <Ionicons name="medkit-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.contactBtnText}>Contact Doctors</Text>
          </TouchableOpacity>
        </Card>

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

  // Quick Actions
  quickActionsCard: { marginBottom: 28, padding: 20 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: { fontSize: 13, fontWeight: '500', color: theme.colors.text },

  // Section
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { ...theme.typography.h3 },

  // FAQ Items
  faqItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  faqItemExpanded: {
    borderColor: theme.colors.primary + '30',
    borderWidth: 1,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqIconWrapActive: {
    backgroundColor: theme.colors.primary,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
  },
  faqQuestionExpanded: {
    color: theme.colors.primary,
  },
  faqAnswerWrap: { marginTop: 12 },
  faqAnswerDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },

  // Still Need Help
  stillNeedHelpCard: { marginTop: 16, marginBottom: 24, padding: 24, alignItems: 'center' },
  stillNeedHelpIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stillNeedHelpTitle: { ...theme.typography.h3, marginBottom: 8 },
  stillNeedHelpText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  contactBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  version: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 },
});
