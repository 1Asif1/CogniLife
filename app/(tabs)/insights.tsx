import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { supabase } from "../../lib/supabase";
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
      const [logs, setLogs] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
  const fetchLogs = async () => {
  try {
    console.log("FETCHING FROM SUPABASE...");

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return;
    }

    console.log("SUPABASE DATA:", data);

    setLogs(data || []);
  } catch (err) {
    console.log("ERROR:", err);
  } finally {
    setLoading(false);
  }

  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return <Text>Loading logs...</Text>;
  }

  // 🔥 PROCESS DATA FOR CHARTS
  const labels = logs.map((item) => {
  if (!item.date) return "";
  const [year, month, day] = item.date.split("-");
  return `${day}-${month}`;
});
  const sleepData = logs.map(item => item.sleep_hours || 0);
  const screenData = logs.map((item) => item.screen_time || 0);
  const stepsData = logs.map((item) => item.steps || 0);
  const sittingData = logs.map(item => item.sitting_time || 0);
  // 🔥 LATEST VALUES (for cards)
  const latest = logs[logs.length - 1] || {};

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>Behavior Insights</Text>
          <Text style={styles.subtitle}>Weekly trends and patterns</Text>

          <View style={styles.metricsGrid}>
            <MetricCard
              title="Sleep Pattern"
              value={`${latest.sleep_hours || 0} hrs`}
              status="Trend"
              icon="moon-outline"
              color={theme.colors.primary}
            />

            <MetricCard
              title="Screen_Time"
              value={`${latest.screen_time|| 0} hrs`}
              status="Trend"
              icon="phone-portrait-outline"
              color={theme.colors.danger}
            />

            <MetricCard
              title="Daily Steps"
              value={`${latest.steps|| 0}`}
              status="Trend"
              icon="pulse-outline"
              color={theme.colors.warning}
            />
          </View>
        </GradientBackground>

        {/* SUMMARY (BASED ON DATA, NOT ML) */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Weekly Summary</Text>

            <Text style={styles.summaryText}>
              You have {logs.length} days of activity recorded.
            </Text>

            <Text style={styles.summaryText}>
              Avg Sleep:{" "}
              {(
                sleepData.reduce((a, b) => a + b, 0) /
                (sleepData.length || 1)
              ).toFixed(1)}{" "}
              hrs
            </Text>

            <Text style={styles.summaryText}>
              Avg Screen Time:{" "}
              {(
                screenData.reduce((a, b) => a + b, 0) /
                (screenData.length || 1)
              ).toFixed(1)}{" "}
              hrs
            </Text>
          </Card>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        
        {/* SLEEP GRAPH */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep Pattern</Text>

          <LineChart
            data={{
              labels: labels,
              datasets: [{ data: sleepData }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card>

        {/* SCREEN TIME GRAPH */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Screen Time</Text>

          <BarChart
            data={{
              labels: labels,
              datasets: [{ data: screenData }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={{
              ...chartConfig,
              color: () => theme.colors.danger
            }}
            style={styles.chart}
          />
        </Card>
        <Card style={styles.chartCard}>
  <Text style={styles.chartTitle}>Activity Trend</Text>

  <LineChart
    data={{
      labels: labels,
      datasets: [{ data: stepsData }]
    }}
    width={screenWidth - 80}
    height={180}
    chartConfig={chartConfig}
    bezier
    style={styles.chart}
  />
</Card>
<Card style={styles.chartCard}>
  <Text style={styles.chartTitle}>Sitting Time</Text>

  <BarChart
    data={{
      labels: labels,
      datasets: [{ data: sittingData }]
    }}
    width={screenWidth - 80}
    height={180}
    chartConfig={chartConfig}
    style={styles.chart}
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
  summaryContainer: { bottom: 25, left: 24, right: 24 },
  summaryCard: { backgroundColor: theme.colors.primary, padding: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 16 },
  summaryItem: { flexDirection: 'row', alignItems: 'center' },
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
