import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientBackground } from "../../components/GradientBackground";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useTranslated } from '../../context/LanguageContext';
// Your machine's LAN IP — the backend must be running on 0.0.0.0:8001
// so it's reachable from both emulators and physical devices via this IP.
const LAN_IP = "192.168.29.161";

const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8001"
    : `http://${LAN_IP}:8001`;

const FilterTag = ({ label, color }: { label: string; color: string }) => (
  <View style={[styles.filterTag, { borderColor: color }]}>
    <View style={[styles.filterDot, { backgroundColor: color }]} />
    <Text style={[styles.filterLabel, { color }]}>{label}</Text>
  </View>
);

const RecommendationCard = ({
  title,
  desc,
  impact,
  priority,
  icon,
  color,
  bgColor,
  onPress,
  isLoading,
}: any) => {
  // Parse description: "Risk level: High. Reason 1; Reason 2."
  const descParts = desc.split(". ");
  const riskLevelText = descParts[0];
  const reasonsText = descParts.slice(1).join(". ").replace(/\.$/, "");
  const reasons = reasonsText ? reasonsText.split("; ") : [];

  // Parse impact: "Action 1; Action 2"
  const impacts = impact ? impact.split("; ") : [];

  return (
    <Card style={styles.recCard}>
      <View style={styles.recHeader}>
        <View style={[styles.recIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <View style={styles.recTitleContainer}>
          <View style={styles.recTitleRow}>
            <Text style={styles.recTitle}>{title}</Text>
            <View
              style={[styles.priorityBadge, { backgroundColor: color + "15" }]}
            >
              <Text style={[styles.priorityText, { color }]}>{priority}</Text>
            </View>
          </View>
          
          {reasons.length > 0 ? (
            <View style={styles.reasonsList}>
              {reasons.map((reason: string, idx: number) => (
                <View key={idx} style={styles.reasonItem}>
                  <View style={[styles.reasonDot, { backgroundColor: color }]} />
                  <Text style={styles.recDesc}>{reason}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.recDesc}>{desc}</Text>
          )}
        </View>
      </View>
      
      {impacts.length > 0 && (
        <View style={styles.recImpact}>
          <View style={styles.impactIconContainer}>
            <Ionicons
              name="sparkles"
              size={16}
              color={theme.colors.danger}
            />
          </View>
          <View style={styles.impactList}>
            {impacts.map((imp: string, idx: number) => (
              <Text key={idx} style={styles.impactText}>
                {imp}
              </Text>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
};

export default function TipsScreen() {
  const { user, userProfile } = useAuth();

  const t = useTranslated({
    header: 'Recommendations',
    subHeader: 'AI-powered personalized suggestions',
    planTitle: 'Your Action Plan',
    loadingPlan: 'Loading your personalized plan...',
    identifiedAreas: "Based on your health data, we've identified {count} key areas for improvement.",
    logDataHint: 'Log your health data to get personalized recommendations.',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    noRecs: 'No recommendations yet',
    retry: 'Retry',
    signInFirst: 'Sign in first',
    generatingRecs: 'Generating recommendations...',
    noRecsMessage: 'Complete your daily logs to get AI-powered health recommendations tailored to your lifestyle.',
    goalAdded: '✓ "{title}" added to your goals!',
    startGoal: 'Start Goal'
  });

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingGoal, setStartingGoal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
   
  
  // Re-fetch every time the Tips tab is focused (tapped)
  useFocusEffect(
    useCallback(() => {
      if (userProfile?.id || user?.id) {
        fetchRecommendations();
      }
    }, [userProfile?.id, user?.id])
  );

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = userProfile?.id || user?.id;
      if (!userId) {
        console.log("[Tips] No user ID available");
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/api/users/${userId}/action-plan`;
      console.log("[Tips] Fetching from:", url);

      // Add a timeout for mobile networks to avoid hanging indefinitely
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      console.log("[Tips] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Tips] Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("[Tips] Received data:", data);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error("[Tips] Fetch error:", err);
      const msg =
        err.name === "AbortError"
          ? `Request timed out. Make sure the backend is running and reachable at ${API_BASE_URL}`
          : err.message || "Failed to fetch recommendations";
      setError(msg);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGoal = async (goalId: string, goalTitle: string) => {
    if (!user?.id) {
      setError("Please sign in first");
      return;
    }

    try {
      setStartingGoal(goalId);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/users/${user.id}/goals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendation_id: goalId,
            title: goalTitle,
            status: "active",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to start goal");
      }

      setSuccessMessage(t.goalAdded.replace('{title}', goalTitle));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error starting goal:", err);
      setError(err.message);
    } finally {
      setStartingGoal(null);
    }
  };

  if (!user) {
  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <Text style={styles.title}>{t.signInFirst}</Text>
      </GradientBackground>
    </ScrollView>
  );
}

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>{t.header}</Text>
          <Text style={styles.subtitle}>{t.subHeader}</Text>
        </GradientBackground>

        <View style={styles.actionPlanContainer}>
          <Card style={styles.actionPlanCard}>
            <View style={styles.actionPlanHeader}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="bulb-outline"
                  size={24}
                  color={theme.colors.primary}/>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionPlanTitle}>{t.planTitle}</Text>
                <Text style={styles.actionPlanDesc}>
                  {loading
                    ? t.loadingPlan
                    : recommendations.length > 0
                      ? t.identifiedAreas.replace('{count}', recommendations.length.toString())
                      : t.logDataHint}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={{ paddingHorizontal: 24 }}
        >
          <FilterTag label={t.critical} color={theme.colors.danger} />
          <FilterTag label={t.high} color={theme.colors.warning} />
          <FilterTag label={t.medium} color="#FACC15" />
          <FilterTag label={t.low} color={theme.colors.secondary} />
        </ScrollView>

        <View style={styles.recList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {t.generatingRecs}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title={t.retry}
                onPress={fetchRecommendations}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : recommendations.length > 0 ? (
            <>
              {successMessage && (
                <View style={styles.successMessage}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  title={rec.title}
                  desc={rec.description}
                  impact={rec.impact}
                  priority={rec.priority}
                  icon={rec.icon}
                  color={rec.color}
                  bgColor={rec.bgColor}
                  onPress={() => handleStartGoal(rec.id, rec.title)}
                  isLoading={startingGoal === rec.id}
                />
              ))}
            </>
          ) :(
             <View style={styles.emptyContainer}>
              < Text style={styles.emptyText}>{t.noRecs}</Text>
              <Text style={styles.emptyDesc}>
               {t.noRecsMessage}
            </Text>
          </View>
        )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { marginBottom: 17 },
  headerGradient: { height: 220, paddingTop: 60, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  title: { fontSize: 32, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  actionPlanContainer: {
    marginTop: -60,
    marginHorizontal: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  actionPlanCard: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 0,
  },
  actionPlanHeader: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { 
    marginRight: 16, 
    marginTop: 2, 
    backgroundColor: theme.colors.primaryLight + "20", 
    padding: 10, 
    borderRadius: 14 
  },
  actionPlanTitle: { ...theme.typography.h2, marginBottom: 6 },
  actionPlanDesc: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  content: { paddingTop: 20, paddingBottom: 40 },
  filtersContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: theme.colors.surface,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  filterLabel: { fontSize: 14, fontWeight: "600" },
  recList: { paddingHorizontal: 24, gap: 16 },
  recCard: { 
    padding: 20, 
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recHeader: { flexDirection: "row", marginBottom: 16 },
  recIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recTitleContainer: { flex: 1, justifyContent: "center" },
  recTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  recTitle: { flex: 1, ...theme.typography.h3, fontSize: 17, paddingRight: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  recDesc: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  reasonsList: { marginTop: 4, gap: 6 },
  reasonItem: { flexDirection: "row", alignItems: "flex-start", paddingRight: 8 },
  reasonDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, marginRight: 8, opacity: 0.6 },
  recImpact: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginBottom: 20,
    backgroundColor: theme.colors.dangerLight + "40",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  impactIconContainer: { marginRight: 10, marginTop: 2 },
  impactList: { flex: 1, gap: 4 },
  impactText: { color: theme.colors.danger, fontSize: 13.5, fontWeight: "600", lineHeight: 20 },
  recButton: { paddingVertical: 14, borderRadius: 14 },
  disabledButton: {
    backgroundColor: theme.colors.border,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  disabledButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorText: { fontSize: 15, color: theme.colors.danger, marginBottom: 16, textAlign: "center" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center',
  marginTop: 8,
  lineHeight: 20,
  paddingHorizontal: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  successMessage: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.successLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  successText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",


  },
});
