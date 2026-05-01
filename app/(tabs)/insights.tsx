import { useTranslated } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Card } from '../../components/Card';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { supabase } from "../../lib/supabase";
import { calculateStreak } from "../../services/streaks";

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#FFF',
  backgroundGradientTo: '#FFF',
  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,

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
  const t = useTranslated({
  header: 'Behavior Insights',
  subHeader: 'Weekly trends and patterns',
  weeklyVibe: "This Week's Vibe",
  streakTitle: 'Activity Streak',
  sleepTitle: 'Sleep Pattern',
  screenTitle: 'Screen Time',
  activityTitle: 'Activity Trend',
  sittingTitle: 'Sitting Time',
  keepLogging: 'Keep logging daily to maintain your streak',
  days: 'days',
  healthFlags: 'Health Flags',

  // ADD THESE NEW KEYS:
  loadingProgress: 'Loading your progress...',
  noInsightsTitle: 'No Insights Yet',
  noInsightsMessage: 'Start logging your daily sleep, screen time, activity and sitting habits to unlock personalized health insights.',

  // Humorous Sleep comments
  sleepLow: "Your pillow misses you.",
  sleepComplicated: "You and sleep are in a complicated relationship.",
  sleepStrong: "Sleep game strong this week.",

  // Screen Time comments
  screenHigh: "Your phone knows you better than people do.",
  screenMedium: "Digital detox is sending friend requests.",
  screenLow: "Healthy screen discipline detected.",

  // Steps/Activity comments
  stepsLow: "Your shoes are feeling unemployed.",
  stepsMedium: "Movement exists. Commitment pending.",
  stepsHigh: "Your legs deserve respect.",

  // Sitting comments
  sittingHigh: "Chairperson of the sedentary committee.",
  sittingMedium: "Too much desk diplomacy.",
  sittingLow: "Body says thanks for moving.",

  // Vibe comments
  vibeBalanced: "A balanced week overall.",
  vibeScreenWon: "Your body tried, your screen won.",
  vibeDisciplined: "A surprisingly disciplined week. Respect.",
  vibeSponsored: "This week was sponsored by chairs."
});
  
  const fetchLogs = async () => {
    try {
      console.log("FETCHING FROM SUPABASE...");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id;

      const today = new Date();
      const last7 = new Date();
      last7.setDate(today.getDate() - 7);

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId) // 🔥 FILTER USER
        .gte("date", last7.toISOString().split("T")[0]) // optional (last 7 days)
        .order("date", { ascending: true });

      if (error) {
        console.log("SUPABASE ERROR:", error);
        return;
      }
      if (!data || data.length === 0) {
        console.log("No logs for this user");
        setLogs([]);
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
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>{t.loadingProgress}</Text>
    </View>
  );
}
  if (logs.length === 0) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 30 }}>
      <Ionicons name="analytics-outline" size={70} color="#7C3AED" />
      <Text style={{ fontSize: 22, fontWeight: "700", marginTop: 20, color: "#1F2937" }}>
        {t.noInsightsTitle}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#6B7280",
          textAlign: "center",
          marginTop: 10,
          lineHeight: 22,
        }}
      >
        {t.noInsightsMessage}
      </Text>
    </View>
  );
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
  const avgSleep = (
    sleepData.reduce((a, b) => a + b, 0) / (sleepData.length || 1)
  ).toFixed(1);

  const avgScreen = (
    screenData.reduce((a, b) => a + b, 0) / (screenData.length || 1)
  ).toFixed(1);

  const avgSteps = (
    stepsData.reduce((a, b) => a + b, 0) / (stepsData.length || 1)
  ).toFixed(0);

  const avgSitting = (
    sittingData.reduce((a, b) => a + b, 0) / (sittingData.length || 1)
  ).toFixed(1);
  const sleepComment =
    Number(avgSleep) < 5
      ? t.sleepLow
      : Number(avgSleep) < 7
        ? t.sleepComplicated
        : t.sleepStrong;

  const screenComment =
    Number(avgScreen) > 8
      ? t.screenHigh
      : Number(avgScreen) > 5
        ? t.screenMedium
        : t.screenLow;

  const stepsComment =
    Number(avgSteps) < 3000
      ? t.stepsLow
      : Number(avgSteps) < 7000
        ? t.stepsMedium
        : t.stepsHigh;

  const sittingComment =
    Number(avgSitting) > 10
      ? t.sittingHigh
      : Number(avgSitting) > 6
        ? t.sittingMedium
        : t.sittingLow;
  let weeklyVibe = "A balanced week overall.";

  if (Number(avgSleep) < 5 && Number(avgScreen) > 7) {
    weeklyVibe = "Your body tried, your screen won.";
  } else if (Number(avgSteps) > 7000 && Number(avgSleep) > 7) {
    weeklyVibe = "A surprisingly disciplined week. Respect.";
  } else if (Number(avgSitting) > 10) {
    weeklyVibe = "This week was sponsored by chairs.";
  }
  const warnings = [];

  if (Number(avgSleep) < 5) warnings.push("Poor Sleep");
  if (Number(avgScreen) > 7) warnings.push("High Screen Use");
  if (Number(avgSteps) < 3000) warnings.push("Low Activity");
  if (Number(avgSitting) > 10) warnings.push("High Sitting Time");

  const streak = calculateStreak(logs);

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
              value={`${latest.screen_time || 0} hrs`}
              status="Trend"
              icon="phone-portrait-outline"
              color={theme.colors.danger}
            />

            <MetricCard
              title="Daily Steps"
              value={`${latest.steps || 0}`}
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
      <View
        style={{
          marginHorizontal: 24,
          marginBottom: 20,
          marginTop: -25,
          backgroundColor: "#7C3AED",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "white", marginBottom: 8 }}>
          This Week's Vibe
        </Text>

        <Text style={{ color: "#E9D5FF", fontSize: 14 }}>
          {weeklyVibe}
        </Text>
      </View>

      <View
        style={{
          marginHorizontal: 24,
          marginBottom: 20,
          backgroundColor: "#F59E0B",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
          Activity Streak
        </Text>

        <Text style={{ fontSize: 28, fontWeight: "800", color: "white", marginTop: 6 }}>
          🔥 {streak} days
        </Text>

        <Text style={{ color: "#FEF3C7", marginTop: 6 }}>
          Keep logging daily to maintain your streak
        </Text>
      </View>

      {warnings.length > 0 && (
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
            Health Flags
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {warnings.map((warn, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#7C3AED",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
                  {warn}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CONTENT */}
      <View style={styles.content}>

        {/* SLEEP GRAPH */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Sleep Pattern</Text>
          <Text style={{ color: "#6B7280", marginBottom: 10 }}>{sleepComment}</Text>

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
          <Text style={{ color: "#6B7280", marginBottom: 10 }}>{screenComment}</Text>

          <BarChart
            data={{
              labels: labels,
              datasets: [{ data: screenData }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={{
              ...chartConfig,
              propsForBackgroundLines: { stroke: theme.colors.border,translateX: 55, strokeDasharray: '' },
              color: () => theme.colors.danger
            }}
            yLabelsOffset={20}
            
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        </Card>


        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Activity Trend</Text>
          <Text style={{ color: "#6B7280", marginBottom: 10 }}>{stepsComment}</Text>

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
          <Text style={{ color: "#6B7280", marginBottom: 10 }}>{sittingComment}</Text>

          <BarChart
            data={{
              labels: labels,
              datasets: [{ data: sittingData }]
            }}
            width={screenWidth - 80}
            height={180}
            chartConfig={{...chartConfig,propsForBackgroundLines: { stroke: theme.colors.border,translateX: 55, strokeDasharray: '' },
              }}
            yAxisLabel=""
            yAxisSuffix=""
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
  summaryContainer: { width: '95%', alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderRadius: 16, marginTop: -40 },
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
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
});
