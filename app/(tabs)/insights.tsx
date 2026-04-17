import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { GradientBackground } from '../../components/GradientBackground';
import { Card } from '../../components/Card';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#FFF',
  backgroundGradientTo: '#FFF',
  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  useShadowColorFromDataset: false,
  propsForLabels: { fontSize: 10, fill: theme.colors.textSecondary },
  propsForBackgroundLines: { stroke: theme.colors.border, strokeDasharray: '' }
};

const MetricCard = ({ title, value, status, icon, color }: any) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 8 }} />
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={[styles.metricStatus, { color }]}>{status}</Text>
  </View>
);

export default function InsightsScreen() {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>Behavior Insights</Text>
          <Text style={styles.subtitle}>Weekly trends and patterns</Text>
          
          <View style={styles.metricsGrid}>
            <MetricCard 
              title="Sleep Pattern" value="7.1 hrs" status="Good" 
              icon="moon-outline" color={theme.colors.success} 
            />
            <MetricCard 
              title="Screen Time" value="7.4 hrs" status="High" 
              icon="phone-portrait-outline" color={theme.colors.danger} 
            />
            <MetricCard 
              title="Daily Steps" value="7,264" status="Moderate" 
              icon="pulse-outline" color={theme.colors.warning} 
            />
          </View>
        </GradientBackground>

        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Weekly Summary</Text>
            <View style={styles.summaryItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.summaryText}>Sleep quality improved by 12%</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
              <Text style={styles.summaryText}>Screen time increased by 18%</Text>
            </View>
            <View style={styles.summaryItem}>
              <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.summaryText}>Activity level remains moderate</Text>
            </View>
          </Card>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="moon" size={20} color={theme.colors.primary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.chartTitle}>Sleep Pattern</Text>
                <Text style={styles.chartSub}>Last 7 days</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.badgeText}>This week</Text>
            </View>
          </View>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{ data: [6.5, 7.0, 7.2, 6.8, 7.5, 8.2, 8.0] }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withPointers={false}
          />
        </Card>

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.dangerLight }]}>
                 <Ionicons name="phone-portrait" size={16} color={theme.colors.danger} />
              </View>
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.chartTitle}>Screen Time</Text>
                <Text style={styles.chartSub}>Daily usage hours</Text>
              </View>
            </View>
          </View>
          <BarChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{ data: [5.8, 6.2, 6.0, 7.5, 8.5, 7.2, 6.5] }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={{...chartConfig, color: () => theme.colors.danger }}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </Card>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { position: 'relative', marginBottom: 60 },
  headerGradient: { height: 320, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24 },
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, alignItems: 'center' },
  metricTitle: { ...theme.typography.small, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  metricStatus: { fontSize: 12, fontWeight: '600' },
  summaryContainer: { position: 'absolute', bottom: -50, left: 24, right: 24 },
  summaryCard: { backgroundColor: theme.colors.primary, padding: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  summaryText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
  content: { padding: 24, paddingTop: 10 },
  chartCard: { marginBottom: 24, padding: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  chartTitle: { ...theme.typography.h3, marginBottom: 2 },
  chartSub: { ...theme.typography.small },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  badgeText: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 4 },
  chart: { marginVertical: 8, borderRadius: 16, marginLeft: -16 },
});
