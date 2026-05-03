import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import { CustomModal } from '../../components/CustomModal';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslated } from '../../context/LanguageContext';

// LAN IP for mobile device testing
const LAN_IP = "192.168.29.161";

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8001"
    : `http://${LAN_IP}:8001`;

// Circular progress component using react-native-svg
const CircularProgress = ({ score, size = 95, strokeWidth = 9 }: { score: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.circleText}>{score}</Text>
      </View>
    </View>
  );
};

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
      {/* FIXED: Changed <div> to <View> here */}
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
  const [anomalyModalVisible, setAnomalyModalVisible] = useState(false);
  const shownAnomalyId = useRef<string | null>(null);

  const t = useTranslated({
    morning: "Good Morning",
    afternoon: "Good Afternoon",
    evening: "Good Evening",
    logToday: "Log Today",
    healthScore: "Overall Health Score",
    scoreTrend: "Based on your latest data",
    anomalyTitle: "Anomaly Detected",
    behaviorTitle: "Your Behavior Profile",
    emptyBehavior: "Log your daily health data to see your behavior profile",
    logNow: "Log Now",
    risksTitle: "Health Risks",
    aiInsights: "AI Insights",
    gotIt: "Got it",
    lowRisk: "↓ Low Risk",
    medRisk: "→ Medium Risk",
    highRisk: "↑ High Risk",
    diabetes: "Diabetes Risk",
    anemia: "Anemia Risk",
    pcos: "PCOS Risk",
    fatigue: "Fatigue Level"
  });

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
        if (dbData.recent_behavior_clusters && dbData.recent_behavior_clusters.length > 0) {
          setBehaviorCluster(dbData.recent_behavior_clusters[0]);
        }
        if (dbData.recent_anomalies && dbData.recent_anomalies.length > 0) {
          const latestAnomaly = dbData.recent_anomalies[0];
          if (latestAnomaly.is_anomaly) {
            setAnomaly(latestAnomaly);
            if (shownAnomalyId.current !== latestAnomaly.id) {
              setAnomalyModalVisible(true);
              shownAnomalyId.current = latestAnomaly.id;
            }
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
    if (hour < 12) return t.morning;
    else if (hour < 17) return t.afternoon;
    else return t.evening;
  };

  const getRiskCardProps = (id: string, defaultTitle: string, defaultIcon: string) => {
    const rec = recommendations.find((r: any) => r.id === id);
    if (!rec) {
      return {
        title: defaultTitle,
        percent: 12,
        trend: t.lowRisk,
        icon: defaultIcon,
        color: theme.colors.success,
        bgColor: theme.colors.successLight,
        onPress: () => setSelectedRisk({
          visible: true,
          title: defaultTitle,
          message: "Your risk is currently low. Keep up the good work!"
        })
      };
    }

    if (rec.priority === "CRITICAL") {
      return {
        title: defaultTitle,
        percent: 85,
        trend: t.highRisk,
        icon: rec.icon || defaultIcon,
        color: theme.colors.danger,
        bgColor: theme.colors.dangerLight,
        onPress: () => setSelectedRisk({
          visible: true,
          title: defaultTitle,
          message: rec.description
        })
      };
    }

    return {
      title: defaultTitle,
      percent: 45,
      trend: t.medRisk,
      icon: rec.icon || defaultIcon,
      color: theme.colors.warning,
      bgColor: theme.colors.warningLight,
      onPress: () => setSelectedRisk({
        visible: true,
        title: defaultTitle,
        message: rec.description
      })
    };
  };

  const shownAnomalies = useRef<Set<string>>(new Set());
const [showAnomaly, setShowAnomaly] = useState(false);

useEffect(() => {
  if (anomaly) {
    const key = anomaly.anomaly_type; // or use id if available

    if (!shownAnomalies.current.has(key)) {
      shownAnomalies.current.add(key);
      setShowAnomaly(true);

      const timer = setTimeout(() => {
        setShowAnomaly(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }
}, [anomaly]);

  const healthScore = 95 - (recommendations.filter(r => r.priority === "CRITICAL").length * 15);
  const diabetesProps = getRiskCardProps('diabetesrisk', t.diabetes, 'water-outline');
  const anemiaProps = getRiskCardProps('anemiarisk', t.anemia, 'heart-half-outline');
  const pcosProps = getRiskCardProps('pcosrisk', t.pcos, 'fitness-outline');
  const fatigueProps = getRiskCardProps('fatigue', t.fatigue, 'moon-outline');

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.name}>{userProfile?.name || "User"}</Text>
              </View>
              <TouchableOpacity style={styles.logButton} onPress={() => router.push('/daily-log')}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.logButtonText}>{t.logToday}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </GradientBackground>

        <View style={styles.scoreCardContainer}>
          <Card style={styles.scoreCard}>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>{t.healthScore}</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValue}>{healthScore}</Text>
                <Text style={styles.scoreSub}>/100</Text>
              </View>
              <Text style={styles.scoreTrend}>{t.scoreTrend}</Text>
            </View>
            <CircularProgress score={healthScore} />
          </Card>
        </View>
      </View>

      <View style={styles.content}>
      {anomaly && showAnomaly && (
        <View style={styles.anomalyBanner}>
          <Ionicons 
            name="warning-outline" 
            size={24} 
            color="#FFF" 
            style={{ marginRight: 12 }} 
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.anomalyTitle}>{t.anomalyTitle}</Text>
            <Text style={styles.anomalyDesc}>{anomaly.anomaly_type}</Text>
          </View>
        </View>
      )}

        <Card style={styles.behaviorCard}>
          <View style={styles.behaviorHeader}>
            <View style={styles.behaviorIcon}>
              <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.behaviorTitle}>{t.behaviorTitle}</Text>
          </View>
          {behaviorCluster ? (
            <>
              <Text style={styles.behaviorName}>{behaviorCluster.cluster_label}</Text>
              <Text style={styles.behaviorDesc}>{behaviorCluster.behavior_pattern}</Text>
            </>
          ) : (
            <View style={styles.emptyBehavior}>
              <Text style={styles.emptyBehaviorText}>{t.emptyBehavior}</Text>
              <TouchableOpacity onPress={() => router.push('/daily-log')} style={styles.logNowBtn}>
                <Text style={styles.logNowBtnText}>{t.logNow}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        <View style={styles.sectionHeader}>
          <Ionicons name="heart-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.sectionTitle}>{t.risksTitle}</Text>
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
          <Text style={styles.sectionTitle}>{t.aiInsights}</Text>
          {loading && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {recommendations.slice(0, 3).map((rec, index) => (
          <InsightAlert
            key={index}
            text={rec.impact || rec.description}
            icon={rec.icon}
            color={rec.color}
            bgColor={rec.bgColor}
          />
        ))}
      </View>

      <CustomModal
        visible={selectedRisk.visible}
        title={selectedRisk.title}
        message={selectedRisk.message}
        onConfirm={() => setSelectedRisk((prev) => ({ ...prev, visible: false }))}
        showCancel={false}
        confirmText={t.gotIt}
      />

      <CustomModal
        visible={anomalyModalVisible}
        title={t.anomalyTitle}
        message={anomaly?.anomaly_type || "Unusual Behavior Pattern Detected"}
        onConfirm={() => setAnomalyModalVisible(false)}
        showCancel={false}
        confirmText={t.gotIt}
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
  scoreCardContainer: { marginTop: -100, marginHorizontal: 24, elevation: 5, zIndex: 10 },
  scoreCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreInfo: { flex: 1 },
  scoreLabel: { ...theme.typography.small, color: theme.colors.textSecondary, marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '700', color: theme.colors.text },
  scoreSub: { fontSize: 16, color: theme.colors.textSecondary, marginLeft: 4 },
  scoreTrend: { color: theme.colors.success, fontSize: 14, fontWeight: '600' },
  circleText: { fontSize: 24, fontWeight: '700', color: theme.colors.primary },
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
  insightAlert: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  insightIconContainer: { padding: 8, borderRadius: 12, marginRight: 16 },
  insightTextContainer: { flex: 1, justifyContent: 'center' },
  insightText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  anomalyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.danger, padding: 16, borderRadius: 16, marginBottom: 20 },
  anomalyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  anomalyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  behaviorCard: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
  behaviorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  behaviorIcon: { marginRight: 8, backgroundColor: theme.colors.primaryLight + '20', padding: 6, borderRadius: 10 },
  behaviorTitle: { ...theme.typography.small, color: theme.colors.textSecondary, fontWeight: '600' },
  behaviorName: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  behaviorDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  emptyBehavior: { alignItems: 'center', paddingVertical: 16 },
  emptyBehaviorText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 },
  logNowBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: theme.colors.primary, borderRadius: 20 },
  logNowBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});