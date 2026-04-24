import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientBackground } from "../../components/GradientBackground";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8001"
    : "http://localhost:8001";

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
}: any) => (
  <Card style={styles.recCard}>
    <View style={styles.recHeader}>
      <View style={[styles.recIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.recTitleContainer}>
        <View style={styles.recTitleRow}>
          <Text style={styles.recTitle}>{title}</Text>
          <View
            style={[styles.priorityBadge, { backgroundColor: color + "20" }]}
          >
            <Text style={[styles.priorityText, { color }]}>{priority}</Text>
          </View>
        </View>
        <Text style={styles.recDesc}>{desc}</Text>
      </View>
    </View>
    <View style={styles.recImpact}>
      <Ionicons
        name="heart-outline"
        size={14}
        color={theme.colors.danger}
        style={{ marginRight: 6 }}
      />
      <Text style={styles.impactText}>{impact}</Text>
    </View>
    <Button
      title={isLoading ? "Starting..." : "Start This Goal"}
      onPress={onPress}
      disabled={isLoading}
      style={styles.recButton}
    />
  </Card>
);

export default function TipsScreen() {
  const { user, userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingGoal, setStartingGoal] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.id || user?.id) {
      fetchRecommendations();
    }
  }, [userProfile?.id, user?.id]);

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

      const response = await fetch(url);

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
      setError(err.message || "Failed to fetch recommendations");
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

      setSuccessMessage(`✓ "${goalTitle}" added to your goals!`);

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
          <Text style={styles.title}>Sign in first</Text>
        </GradientBackground>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>Recommendations</Text>
          <Text style={styles.subtitle}>
            AI-powered personalized suggestions
          </Text>
        </GradientBackground>

        <View style={styles.actionPlanContainer}>
          <Card style={styles.actionPlanCard}>
            <View style={styles.actionPlanHeader}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={theme.colors.secondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionPlanTitle}>Your Action Plan</Text>
                <Text style={styles.actionPlanDesc}>
                  {loading
                    ? "Loading your personalized plan..."
                    : recommendations.length > 0
                      ? `Based on your health data, we've identified ${recommendations.length} key areas for improvement. Start with high-priority items for maximum impact.`
                      : "Log your health data to get personalized recommendations."}
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
          <FilterTag label="Critical" color={theme.colors.danger} />
          <FilterTag label="High" color={theme.colors.warning} />
          <FilterTag label="Medium" color="#FACC15" />
          <FilterTag label="Low" color={theme.colors.secondary} />
        </ScrollView>

        <View style={styles.recList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                Generating recommendations...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button
                title="Retry"
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
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recommendations yet</Text>
              <Text style={styles.emptySubtext}>
                Log your daily health data to get personalized recommendations
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
  topSection: { position: "relative", marginBottom: 50 },
  headerGradient: { height: 200, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  actionPlanContainer: {
    position: "absolute",
    bottom: -40,
    left: 24,
    right: 24,
  },
  actionPlanCard: {
    padding: 20,
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },
  actionPlanHeader: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { marginRight: 16, marginTop: 2 },
  actionPlanTitle: { ...theme.typography.h3, marginBottom: 8 },
  actionPlanDesc: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  content: { paddingTop: 10, paddingBottom: 24 },
  filtersContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#FFF",
  },
  filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  recList: { paddingHorizontal: 24, gap: 16 },
  recCard: { padding: 20, borderColor: theme.colors.border, borderWidth: 1 },
  recHeader: { flexDirection: "row", marginBottom: 16 },
  recIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  recTitleContainer: { flex: 1 },
  recTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recTitle: { flex: 1, ...theme.typography.h3, paddingRight: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: "700" },
  recDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  recImpact: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  impactText: { color: theme.colors.danger, fontSize: 13, fontWeight: "600" },
  recButton: { paddingVertical: 12 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorText: { fontSize: 14, color: theme.colors.danger, marginBottom: 12 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  successMessage: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
});
