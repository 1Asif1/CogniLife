import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { CustomModal } from '../../components/CustomModal';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

// LAN IP for mobile device testing
const LAN_IP = "192.168.29.161";

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8001"
    : `http://${LAN_IP}:8001`;

// Simple mock for a circular progress until react-native-svg is fully handled
const CircularProgressMock = ({ score }: { score: number }) => (
  <View style={styles.circleOuter}>
    <View style={styles.circleInner}>
      <Text style={styles.circleText}>{score}</Text>
    </View>
  </View>
);

const RiskCard = ({ title, percent, trend, icon, color, bgColor, onPress }: any) => (
  <TouchableOpacity
    style={[styles.riskCard, { backgroundColor: bgColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.riskHeader}>
      <View style={[styles.riskIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
    </View>
    <Text style={styles.riskTitle}>{title}</Text>
    <Text style={[styles.riskPercent, { color }]}>{percent}%</Text>
    <Text style={[styles.riskTrend, { color }]}>{trend}</Text>
  </TouchableOpacity>
);

const InsightAlert = ({ text, icon, color, bgColor }: any) => {
  const points = text.includes('; ') ? text.split('; ') : [text];

  return (
    <View style={[styles.insightAlert, { backgroundColor: bgColor, borderColor: color + '20' }]}>
      <View style={[styles.insightIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.insightTextContainer}>
        {points.map((point: string, idx: number) => (
          <Text key={idx} style={[styles.insightText, { color: theme.colors.text }]}>
            {points.length > 1 ? `• ${point}` : point}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [behaviorCluster, setBehaviorCluster] = useState<any>(null);
  const [anomaly, setAnomaly] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  // Fetch ML recommendations whenever the Home tab is focused
  useFocusEffect(
    useCallback(() => {
      if (userProfile?.id || user?.id) {
        fetchDashboardData();
      } else {
        setLoading(false);
      }
    }, [userProfile?.id, user?.id])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = userProfile?.id || user?.id;
      if (!userId) return;

      const actionPlanUrl = `${API_BASE_URL}/api/users/${userId}/action-plan`;
      const dashboardUrl = `${API_BASE_URL}/api/users/${userId}/dashboard`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const [actionPlanRes, dashboardRes] = await Promise.all([
        fetch(actionPlanUrl, { signal: controller.signal }).catch(() => null),
        fetch(dashboardUrl, { signal: controller.signal }).catch(() => null)
      ]);
      clearTimeout(timeoutId);

      if (actionPlanRes && actionPlanRes.ok) {
        const data = await actionPlanRes.json();
        setRecommendations(data.recommendations || []);
      }

      if (dashboardRes && dashboardRes.ok) {
        const dbData = await dashboardRes.json();

        // Extract the latest behavior cluster
        if (dbData.recent_behavior_clusters && dbData.recent_behavior_clusters.length > 0) {
          setBehaviorCluster(dbData.recent_behavior_clusters[0]);
        }

        // Extract recent anomaly if present and it's an actual anomaly
        if (dbData.recent_anomalies && dbData.recent_anomalies.length > 0) {
          const latestAnomaly = dbData.recent_anomalies[0];
          if (latestAnomaly.is_anomaly) {
            setAnomaly(latestAnomaly);
          }
        }
      }
    } catch (err) {
      console.error("[Home] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    else if (hour < 17) return "Good Afternoon";
    else return "Good Evening";
  };

  const getRiskCardProps = (id: string, defaultTitle: string, defaultIcon: string) => {
    const rec = recommendations.find((r: any) => r.id === id);
    if (!rec) {
      return {
        title: defaultTitle,
        percent: 12,
        trend: "↓ Low Risk",
        icon: defaultIcon,
        color: theme.colors.success,
        bgColor: theme.colors.successLight,
        onPress: () => setSelectedRisk({
          visible: true,
          title: defaultTitle,
          message: "Your risk is currently low based on your recent health logs and AI analysis. Keep up the good work!"
        })
      };
    }

    // Format the reason text nicely (replace semicolons with bullets)
    let reasonText = rec.description || "";
    if (reasonText.includes("; ")) {
      const parts = reasonText.split(". ");
      const riskLevel = parts[0];
      const reasons = parts.slice(1).join(". ").replace(/\.$/, "").split("; ");
      reasonText = `${riskLevel}.\n\nWhy?\n` + reasons.map((r: string) => `• ${r}`).join("\n");
    }

    if (rec.priority === "CRITICAL") {
      return {
        title: defaultTitle,
        percent: 85,
        trend: "↑ High Risk",
        icon: rec.icon || defaultIcon,
        color: theme.colors.danger,
        bgColor: theme.colors.dangerLight,
        onPress: () => setSelectedRisk({
          visible: true,
          title: defaultTitle,
          message: reasonText
        })
      };
    }

    return {
      title: defaultTitle,
      percent: 45,
      trend: "→ Medium Risk",
      icon: rec.icon || defaultIcon,
      color: theme.colors.warning,
      bgColor: theme.colors.warningLight,
      onPress: () => setSelectedRisk({
        visible: true,
        title: defaultTitle,
        message: reasonText
      })
    };
  };

  // Calculate an overall health score based on the risks
  const calculateHealthScore = () => {
    let score = 95;
    recommendations.forEach(rec => {
      if (rec.priority === "CRITICAL") score -= 15;
      else if (rec.priority === "HIGH") score -= 8;
    });
    return Math.max(0, Math.min(100, score));
  };

  // Get AI insights from the top recommendations
  const getInsights = () => {
    if (recommendations.length === 0) {
      return [{
        text: "Your health metrics look great! Keep up the good habits.",
        icon: "checkmark-circle",
        color: theme.colors.success,
        bgColor: theme.colors.successLight
      }];
    }

    return recommendations.slice(0, 3).map(rec => ({
      text: rec.impact || rec.description,
      icon: rec.icon,
      color: rec.color,
      bgColor: rec.bgColor
    }));
  };

  const healthScore = calculateHealthScore();
  const insights = getInsights();
  const diabetesProps = getRiskCardProps('diabetesrisk', 'Diabetes Risk', 'water-outline');
  const anemiaProps = getRiskCardProps('anemiarisk', 'Anemia Risk', 'heart-half-outline');
  const pcosProps = getRiskCardProps('pcosrisk', 'PCOS Risk', 'fitness-outline');
  const fatigueProps = getRiskCardProps('fatigue', 'Fatigue Level', 'moon-outline');

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.name}>
                  {userProfile?.name || "User"}
                </Text>
              </View>
              <TouchableOpacity style={styles.logButton} onPress={() => router.push('/daily-log')}>
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
                <Text style={styles.scoreValue}>{healthScore}</Text>
                <Text style={styles.scoreSub}>/100</Text>
              </View>
              <Text style={styles.scoreTrend}>Based on your latest data</Text>
            </View>
            <CircularProgressMock score={healthScore} />
          </Card>
        </View>
      </View>

      <View style={styles.content}>

        {anomaly && (
          <View style={styles.anomalyBanner}>
            <Ionicons name="warning-outline" size={24} color="#FFF" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.anomalyTitle}>Anomaly Detected</Text>
              <Text style={styles.anomalyDesc}>We noticed an unusual pattern: {anomaly.anomaly_type || 'Please review your recent health logs.'}</Text>
            </View>
          </View>
        )}

        {behaviorCluster && (
          <Card style={styles.behaviorCard}>
            <View style={styles.behaviorHeader}>
              <View style={styles.behaviorIcon}>
                <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.behaviorTitle}>Your Behavior Profile</Text>
            </View>
            <Text style={styles.behaviorName}>{behaviorCluster.cluster_name}</Text>
            <Text style={styles.behaviorDesc}>{behaviorCluster.behavior_pattern}</Text>
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="heart-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.sectionTitle}>Health Risks</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridColumn}>
            <RiskCard {...diabetesProps} />
            <RiskCard {...anemiaProps} />
          </View>
          <View style={styles.gridColumn}>
            <RiskCard {...pcosProps} />
            <RiskCard {...fatigueProps} />
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>AI Insights</Text>
          {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {insights.map((insight, index) => (
          <InsightAlert
            key={index}
            text={insight.text}
            icon={insight.icon}
            color={insight.color}
            bgColor={insight.bgColor}
          />
        ))}

      </View>

      <CustomModal
        visible={selectedRisk.visible}
        title={selectedRisk.title}
        message={selectedRisk.message}
        onConfirm={() => setSelectedRisk((prev) => ({ ...prev, visible: false }))}
        showCancel={false}
        confirmText="Got it"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { marginBottom: 10 },
  headerGradient: { height: 260, paddingBottom: 40 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40 },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  name: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  logButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logButtonText: { color: '#FFF', fontWeight: '600' },
  scoreCardContainer: {
    marginTop: -100,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
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
  insightAlert: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  insightIconContainer: {
    padding: 8,
    borderRadius: 12,
    marginRight: 16,
  },
  insightTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 2,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  anomalyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  anomalyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  anomalyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  behaviorCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  behaviorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  behaviorIcon: { marginRight: 8, backgroundColor: theme.colors.primaryLight + '20', padding: 6, borderRadius: 10 },
  behaviorTitle: { ...theme.typography.small, color: theme.colors.textSecondary, fontWeight: '600' },
  behaviorName: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  behaviorDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
});
