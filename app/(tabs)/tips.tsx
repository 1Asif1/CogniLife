import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const FilterTag = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.filterTag, { borderColor: color }]}>
    <View style={[styles.filterDot, { backgroundColor: color }]} />
    <Text style={[styles.filterLabel, { color }]}>{label}</Text>
  </View>
);

const RecommendationCard = ({ title, desc, impact, priority, icon, color, bgColor }: any) => (
  <Card style={styles.recCard}>
    <View style={styles.recHeader}>
      <View style={[styles.recIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.recTitleContainer}>
        <View style={styles.recTitleRow}>
           <Text style={styles.recTitle}>{title}</Text>
           <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
             <Text style={[styles.priorityText, { color }]}>{priority}</Text>
           </View>
        </View>
        <Text style={styles.recDesc}>{desc}</Text>
      </View>
    </View>
    <View style={styles.recImpact}>
      <Ionicons name="heart-outline" size={14} color={theme.colors.danger} style={{ marginRight: 6 }} />
      <Text style={styles.impactText}>{impact}</Text>
    </View>
    <Button title="Start This Goal" onPress={() => {}} style={styles.recButton} />
  </Card>
);

export default function TipsScreen() {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>Recommendations</Text>
          <Text style={styles.subtitle}>AI-powered personalized suggestions</Text>
        </GradientBackground>

        <View style={styles.actionPlanContainer}>
          <Card style={styles.actionPlanCard}>
            <View style={styles.actionPlanHeader}>
              <View style={styles.infoIcon}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionPlanTitle}>Your Action Plan</Text>
                <Text style={styles.actionPlanDesc}>
                  Based on your health data, we've identified 6 key areas for improvement. Start with high-priority items for maximum impact.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={{ paddingHorizontal: 24 }}>
           <FilterTag label="Critical" color={theme.colors.danger} />
           <FilterTag label="High" color={theme.colors.warning} />
           <FilterTag label="Medium" color="#FACC15" />
           <FilterTag label="Low" color={theme.colors.secondary} />
        </ScrollView>

        <View style={styles.recList}>
           <RecommendationCard 
             title="Reduce screen time after 11 PM"
             desc="Your screen usage before bed is affecting sleep quality. Try reading or meditation instead."
             impact="Improve sleep by 25%"
             priority="HIGH"
             icon="moon-outline" 
             color={theme.colors.primary}
             bgColor={theme.colors.primaryLight + '20'}
           />
           <RecommendationCard 
             title="Increase daily steps to 10,000"
             desc="You're currently averaging 7,264 steps. Small increases can significantly reduce diabetes risk."
             impact="Reduce risk by 15%"
             priority="HIGH"
             icon="walk-outline" 
             color={theme.colors.success}
             bgColor={theme.colors.successLight}
           />
           <RecommendationCard 
             title="Set app time limits"
             desc="Social media usage is 3.2 hours daily. Consider setting 2-hour daily limits."
             impact="Lower addiction by 30%"
             priority="CRITICAL"
             icon="phone-portrait-outline" 
             color={theme.colors.danger}
             bgColor={theme.colors.dangerLight}
           />
           <RecommendationCard 
             title="Practice 10-minute daily meditation"
             desc="Meditation can help balance dopamine levels and reduce stress responses."
             impact="Improve focus by 20%"
             priority="MEDIUM"
             icon="pulse-outline" 
             color={theme.colors.secondary}
             bgColor="#EFF6FF"
           />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { position: 'relative', marginBottom: 50 },
  headerGradient: { height: 200, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  actionPlanContainer: { position: 'absolute', bottom: -40, left: 24, right: 24 },
  actionPlanCard: { padding: 20, borderColor: theme.colors.warning, borderWidth: 1 },
  actionPlanHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  infoIcon: { marginRight: 16, marginTop: 2 },
  actionPlanTitle: { ...theme.typography.h3, marginBottom: 8 },
  actionPlanDesc: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  content: { paddingTop: 10, paddingBottom: 24 },
  filtersContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  filterTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: '#FFF' },
  filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  recList: { paddingHorizontal: 24, gap: 16 },
  recCard: { padding: 20, borderColor: theme.colors.border, borderWidth: 1 },
  recHeader: { flexDirection: 'row', marginBottom: 16 },
  recIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  recTitleContainer: { flex: 1 },
  recTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  recTitle: { flex: 1, ...theme.typography.h3, paddingRight: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  recDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  recImpact: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  impactText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
  recButton: { paddingVertical: 12 },
});
