import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Simple mock for a circular progress until react-native-svg is fully handled
const CircularProgressMock = ({ score }: { score: number }) => (
  <View style={styles.circleOuter}>
    <View style={styles.circleInner}>
      <Text style={styles.circleText}>{score}</Text>
    </View>
  </View>
);

const RiskCard = ({ title, percent, trend, icon, color, bgColor }: any) => (
  <View style={[styles.riskCard, { backgroundColor: bgColor }]}>
    <View style={styles.riskHeader}>
      <View style={[styles.riskIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
    </View>
    <Text style={styles.riskTitle}>{title}</Text>
    <Text style={[styles.riskPercent, { color }]}>{percent}%</Text>
    <Text style={[styles.riskTrend, { color }]}>{trend}</Text>
  </View>
);

const InsightAlert = ({ text, icon, color, bgColor }: any) => (
  <View style={[styles.insightAlert, { backgroundColor: bgColor, borderColor: color + '30' }]}>
    <Ionicons name={icon} size={20} color={color} style={{ marginRight: 12 }} />
    <Text style={styles.insightText}>{text}</Text>
  </View>
);

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>Good Morning</Text>
                <Text style={styles.name}>Asif</Text>
              </View>
              <TouchableOpacity style={styles.logButton}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.logButtonText}>Log Today</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </GradientBackground>

        <View style={styles.scoreCardContainer}>
          <Card style={styles.scoreCard}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Overall Health Score</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>78</Text>
                <Text style={styles.scoreSub}>/100</Text>
              </View>
              <Text style={styles.scoreTrend}>📈 +5 from last week</Text>
            </View>
            <CircularProgressMock score={78} />
          </Card>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.sectionTitle}>Health Risks</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <RiskCard 
              title="Diabetes Risk" percent={23} trend="↓ Decreasing" 
              icon="water-outline" color={theme.colors.success} bgColor={theme.colors.successLight} />
            <RiskCard 
              title="Anemia Risk" percent={15} trend="→ Stable" 
              icon="heart-half-outline" color={theme.colors.success} bgColor={theme.colors.successLight} />
          </View>
          <View style={styles.gridColumn}>
            <RiskCard 
              title="PCOS Risk" percent={42} trend="↑ Increasing" 
              icon="fitness-outline" color={theme.colors.warning} bgColor={theme.colors.warningLight} />
            <RiskCard 
              title="Digital Addiction" percent={68} trend="↑ Increasing" 
              icon="phone-portrait-outline" color={theme.colors.danger} bgColor={theme.colors.dangerLight} />
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </View>

        <InsightAlert 
          text="Late-night screen usage affecting your sleep quality"
          icon="phone-portrait-outline" color={theme.colors.danger} bgColor={theme.colors.dangerLight} />
        <InsightAlert 
          text="Great progress! 20% increase in daily activity this week"
          icon="trending-up-outline" color={theme.colors.success} bgColor={theme.colors.successLight} />
        <InsightAlert 
          text="High dopamine activities detected - consider balance"
          icon="brain-outline" color={theme.colors.secondary} bgColor="#EFF6FF" />

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { position: 'relative', marginBottom: 60 },
  headerGradient: { height: 260, paddingBottom: 40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40 },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  name: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  logButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logButtonText: { color: '#FFF', fontWeight: '600' },
  scoreCardContainer: { position: 'absolute', bottom: -50, left: 24, right: 24 },
  scoreCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreInfo: { flex: 1 },
  scoreLabel: { ...theme.typography.small, color: theme.colors.textSecondary, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '700', color: theme.colors.text },
  scoreSub: { fontSize: 16, color: theme.colors.textSecondary, marginLeft: 4 },
  scoreTrend: { color: theme.colors.success, fontSize: 14, fontWeight: '600' },
  circleOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  circleInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  circleText: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },
  content: { padding: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { ...theme.typography.h2, marginLeft: 8 },
  grid: { flexDirection: 'row', gap: 16 },
  gridColumn: { flex: 1, gap: 16 },
  riskCard: { padding: 16, borderRadius: 16 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  riskIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  riskTitle: { ...theme.typography.small, fontWeight: '600', marginBottom: 4 },
  riskPercent: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  riskTrend: { fontSize: 12, fontWeight: '600' },
  insightAlert: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  insightText: { flex: 1, fontSize: 14, color: theme.colors.text, lineHeight: 20 },
});
