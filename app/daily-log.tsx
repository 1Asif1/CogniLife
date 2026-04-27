import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CustomModal } from '../components/CustomModal';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import {
    AutoCollectedData,
    collectAutoData,
    getTodayLog,
    submitDailyLog,
} from '../services/dailyLogService';
import {
    hasHealthPermissions,
    initializeHealthConnect,
    requestHealthPermissions
} from '../services/healthConnectService';
import { screenTimeService } from '../services/screenTimeService';

const MEAL_OPTIONS = [1, 2, 3, 4, 5, 6];
const CALORIE_PRESETS = [1200, 1500, 1800, 2000, 2500, 3000];
const FOOD_QUALITY_OPTIONS = [
  { value: 0, label: 'Poor', icon: 'sad-outline' as const, color: '#EF4444' },
  { value: 1, label: 'Average', icon: 'remove-circle-outline' as const, color: '#F59E0B' },
  { value: 2, label: 'Good', icon: 'happy-outline' as const, color: '#10B981' },
];

export default function DailyLogScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Auto-collected data
  const [autoData, setAutoData] = useState<AutoCollectedData>({
    screenTime: 0,
    lateNightUsage: 0,
    sleepHours: 0,
    activityLevel: 'low',
    sittingTime: 0,
    inactivityPeriods: 0,
    steps: 0,
  });

  // Manual entry data
  const [mealsPerDay, setMealsPerDay] = useState(1);
  const [calorieIntake, setCalorieIntake] = useState('');
  const [existingCalories, setExistingCalories] = useState(0);
  const [foodQuality, setFoodQuality] = useState(1);

  // Status states
  const [screenTimePermission, setScreenTimePermission] = useState(false);
  const [healthConnectPermission, setHealthConnectPermission] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingLog, setExistingLog] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    showCancel?: boolean;
  }>({ title: '', message: '' });

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Load existing data and auto-collect
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingAuto(true);

    // Check permissions
    const hasScreenTime = await screenTimeService.checkPermission();
    setScreenTimePermission(hasScreenTime);
    
    const hasHealth = hasHealthPermissions();
    setHealthConnectPermission(hasHealth);

    // Load existing log if any
    if (user) {
      const existing = await getTodayLog(user.id);
      if (existing) {
        setExistingLog(true);
        setMealsPerDay(existing.mealsPerDay);
        setExistingCalories(existing.calorieIntake || 0);
        setCalorieIntake('');
        setFoodQuality(existing.foodQuality ?? 1);
        setAutoData({
          screenTime: existing.screenTime,
          lateNightUsage: existing.lateNightUsage,
          sleepHours: existing.sleepHours,
          activityLevel: existing.activityLevel as 'low' | 'moderate' | 'high',
          sittingTime: existing.sittingTime,
          inactivityPeriods: existing.inactivityPeriods,
          steps: existing.steps,
        });
      }
    }

    // Collect fresh auto data
    try {
      const data = await collectAutoData();
      setAutoData(prev => ({
        ...prev,
        screenTime: data.screenTime || prev.screenTime,
        lateNightUsage: data.lateNightUsage || prev.lateNightUsage,
        sleepHours: data.sleepHours || prev.sleepHours,
        activityLevel: data.activityLevel || prev.activityLevel,
        sittingTime: data.sittingTime || prev.sittingTime,
        inactivityPeriods: data.inactivityPeriods || prev.inactivityPeriods,
        steps: data.steps || prev.steps,
      }));
    } catch (error) {
      console.error('Auto collection failed:', error);
    }

    setLoadingAuto(false);
  };

  // Helper that shows a CustomModal and returns a promise resolving to the user's choice
  const showConfirm = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalConfig({
        title: config.title,
        message: config.message,
        confirmText: config.confirmText || 'OK',
        showCancel: true,
        onConfirm: () => {
          setModalVisible(false);
          resolve(true);
        },
        onCancel: () => {
          setModalVisible(false);
          resolve(false);
        },
      });
      setModalVisible(true);
    });
  };

  const handleRequestScreenTime = async () => {
    const granted = await screenTimeService.requestPermission(showConfirm);
    setScreenTimePermission(granted);
    if (granted) {
      const data = await screenTimeService.getScreenTimeData();
      setAutoData(prev => ({
        ...prev,
        screenTime: data.screenTime,
        lateNightUsage: data.lateNightUsage,
      }));
    }
  };

  const handleRequestHealthConnect = async () => {
    await initializeHealthConnect();
    const granted = await requestHealthPermissions(showConfirm);
    setHealthConnectPermission(granted);
    if (granted) {
      const data = await collectAutoData();
      setAutoData(prev => ({
        ...prev,
        sleepHours: data.sleepHours,
        activityLevel: data.activityLevel,
        sittingTime: data.sittingTime,
        inactivityPeriods: data.inactivityPeriods,
        steps: data.steps,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setModalConfig({
        title: 'Error',
        message: 'You must be logged in to save a daily log.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
      return;
    }

    const caloriesToAdd = parseInt(calorieIntake) || 0;
    const totalCalories = existingCalories + caloriesToAdd;

    setSubmitting(true);
    const result = await submitDailyLog(
      user.id,
      autoData,
      { mealsPerDay, calorieIntake: totalCalories, foodQuality }
    );
    setSubmitting(false);

    if (result.success) {
      setModalConfig({
        title: 'Log Saved!',
        message: existingLog
          ? 'Your daily log has been updated successfully.'
          : 'Your daily log has been saved successfully.',
        onConfirm: () => {
          setModalVisible(false);
          router.back();
        },
        confirmText: 'Great!',
        showCancel: false,
      });
      setModalVisible(true);
    } else {
      setModalConfig({
        title: 'Error',
        message: result.error || 'Failed to save daily log.',
        onConfirm: () => setModalVisible(false),
        confirmText: 'OK',
        showCancel: false,
      });
      setModalVisible(true);
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.success;
      case 'moderate': return theme.colors.warning;
      default: return theme.colors.danger;
    }
  };

  const getActivityIcon = (level: string): any => {
    switch (level) {
      case 'high': return 'flash';
      case 'moderate': return 'walk';
      default: return 'bed';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[theme.colors.secondary, theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Daily Log</Text>
                <Text style={styles.headerDate}>{dateString}</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>

          {existingLog && (
            <View style={styles.existingBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              <Text style={styles.existingText}>Updating today's log</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          {/* Auto-Collected Data Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="sync-outline" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Auto-Collected Data</Text>
            {loadingAuto && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />
            )}
          </View>

          {/* Screen Time Card */}
          <Card style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <View style={[styles.dataIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="phone-portrait" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.dataCardInfo}>
                <Text style={styles.dataCardTitle}>Screen Time</Text>
                <Text style={styles.dataCardSubtitle}>
                  {screenTimePermission ? 'Permission granted' : 'Permission required'}
                </Text>
              </View>
              {!screenTimePermission ? (
                <TouchableOpacity style={styles.grantBtn} onPress={handleRequestScreenTime}>
                  <Text style={styles.grantBtnText}>Grant</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusDot}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
              )}
            </View>
            {screenTimePermission && (
              <View style={styles.dataMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{autoData.screenTime.toFixed(1)}h</Text>
                  <Text style={styles.metricLabel}>Today's Screen Time</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metric}>
                  <Text style={[styles.metricValue, { color: autoData.lateNightUsage > 0 ? theme.colors.danger : theme.colors.success }]}>
                    {autoData.lateNightUsage.toFixed(1)}h
                  </Text>
                  <Text style={styles.metricLabel}>Late Night</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Wearable / Health Connect Card */}
          <Card style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <View style={[styles.dataIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="watch" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.dataCardInfo}>
                <Text style={styles.dataCardTitle}>Wearable Data</Text>
                <Text style={styles.dataCardSubtitle}>
                  {healthConnectPermission ? 'Health Connect linked' : 'Connect your device'}
                </Text>
              </View>
              {!healthConnectPermission ? (
                <TouchableOpacity style={[styles.grantBtn, { backgroundColor: '#DBEAFE' }]} onPress={handleRequestHealthConnect}>
                  <Text style={[styles.grantBtnText, { color: theme.colors.secondary }]}>Connect</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusDot}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                </View>
              )}
            </View>
            {healthConnectPermission && (
              <View style={styles.wearableGrid}>
                <View style={styles.wearableItem}>
                  <Ionicons name="moon" size={18} color="#6366F1" />
                  <Text style={styles.wearableValue}>{autoData.sleepHours.toFixed(1)}h</Text>
                  <Text style={styles.wearableLabel}>Sleep</Text>
                </View>
                <View style={styles.wearableItem}>
                  <Ionicons name="footsteps" size={18} color="#3B82F6" />
                  <Text style={[styles.wearableValue, { color: '#3B82F6' }]}>
                    {autoData.steps.toLocaleString()}
                  </Text>
                  <Text style={styles.wearableLabel}>Steps</Text>
                </View>
                <View style={styles.wearableItem}>
                  <Ionicons name={getActivityIcon(autoData.activityLevel)} size={18} color={getActivityColor(autoData.activityLevel)} />
                  <Text style={[styles.wearableValue, { color: getActivityColor(autoData.activityLevel) }]}>
                    {autoData.activityLevel.charAt(0).toUpperCase() + autoData.activityLevel.slice(1)}
                  </Text>
                  <Text style={styles.wearableLabel}>Activity</Text>
                </View>
                <View style={styles.wearableItem}>
                  <Ionicons name="time" size={18} color="#F59E0B" />
                  <Text style={styles.wearableValue}>{autoData.sittingTime.toFixed(1)}h</Text>
                  <Text style={styles.wearableLabel}>Sitting</Text>
                </View>
                <View style={styles.wearableItem}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.wearableValue}>{autoData.inactivityPeriods}</Text>
                  <Text style={styles.wearableLabel}>Inactive</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Manual Entry Section */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="create-outline" size={18} color={theme.colors.warning} />
            </View>
            <Text style={styles.sectionTitle}>Manual Entry</Text>
          </View>

          {/* Meals Per Day */}
          <Card style={styles.dataCard}>
            <Text style={styles.fieldLabel}>
              <Ionicons name="restaurant-outline" size={16} color={theme.colors.text} />
              {'  '}Which Meal of The Day
            </Text>
            <View style={styles.pillRow}>
              {MEAL_OPTIONS.map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.pill, mealsPerDay === num && styles.pillSelected]}
                  onPress={() => setMealsPerDay(num)}
                >
                  <Text style={[styles.pillText, mealsPerDay === num && styles.pillTextSelected]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Calorie Intake */}
          <Card style={styles.dataCard}>
            <View style={styles.calorieHeaderRow}>
              <Text style={styles.fieldLabel}>
                <Ionicons name="flame-outline" size={16} color={theme.colors.text} />
                {'  '}Add Calories
              </Text>
              {existingCalories > 0 && (
                <Text style={styles.existingCaloriesText}>
                  Today's Total : {existingCalories} kcal
                </Text>
              )}
            </View>
            <View style={styles.calorieInputRow}>
              <TextInput
                style={styles.calorieInput}
                value={calorieIntake}
                onChangeText={setCalorieIntake}
                placeholder="Enter calories"
                placeholderTextColor={theme.colors.textSecondary + '80'}
                keyboardType="numeric"
              />
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
            <Text style={styles.presetLabel}>Quick presets:</Text>
            <View style={styles.presetRow}>
              {CALORIE_PRESETS.map(cal => (
                <TouchableOpacity
                  key={cal}
                  style={[
                    styles.presetPill,
                    calorieIntake === cal.toString() && styles.presetPillSelected,
                  ]}
                  onPress={() => setCalorieIntake(cal.toString())}
                >
                  <Text style={[
                    styles.presetPillText,
                    calorieIntake === cal.toString() && styles.presetPillTextSelected,
                  ]}>
                    {cal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Food Quality */}
          <Card style={styles.dataCard}>
            <Text style={styles.fieldLabel}>
              <Ionicons name="leaf-outline" size={16} color={theme.colors.text} />
              {'  '}Food Quality
            </Text>
            <Text style={styles.foodQualityHint}>
              Rate the overall quality of your meals today
            </Text>
            <View style={styles.foodQualityRow}>
              {FOOD_QUALITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.foodQualityOption,
                    foodQuality === opt.value && {
                      borderColor: opt.color,
                      backgroundColor: opt.color + '12',
                    },
                  ]}
                  onPress={() => setFoodQuality(opt.value)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={28}
                    color={foodQuality === opt.value ? opt.color : theme.colors.textSecondary + '80'}
                  />
                  <Text
                    style={[
                      styles.foodQualityLabel,
                      foodQuality === opt.value && { color: opt.color, fontWeight: '700' as const },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Summary & Submit */}
          <View style={styles.submitSection}>
            <View style={styles.summaryRow}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.summaryText}>
                {screenTimePermission && healthConnectPermission
                  ? 'All data sources connected. Ready to save!'
                  : 'Some data sources not connected. You can still save manual entries.'}
              </Text>
            </View>

            {submitting ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <Button
                title={existingLog ? 'Update Daily Log' : 'Save Daily Log'}
                onPress={handleSubmit}
                style={styles.submitBtn}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel || (() => setModalVisible(false))}
        confirmText={modalConfig.confirmText}
        showCancel={modalConfig.showCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  existingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  existingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...theme.typography.h2,
    flex: 1,
  },
  dataCard: {
    marginBottom: 14,
    padding: 18,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dataCardInfo: {
    flex: 1,
  },
  dataCardTitle: {
    ...theme.typography.h3,
    marginBottom: 2,
  },
  dataCardSubtitle: {
    ...theme.typography.small,
  },
  grantBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  grantBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  statusDot: {},
  dataMetrics: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  metricDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  wearableGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    justifyContent: 'space-around',
  },
  wearableItem: {
    alignItems: 'center',
    gap: 4,
  },
  wearableValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  wearableLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  fieldLabel: {
    ...theme.typography.h3,
    marginBottom: 14,
    fontSize: 15,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  pillSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  pillTextSelected: {
    color: '#FFF',
  },
  calorieHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  existingCaloriesText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  calorieInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  calorieInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  calorieUnit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  presetLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetPillSelected: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  presetPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  presetPillTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  submitSection: {
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  summaryText: {
    flex: 1,
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 20,
  },
  foodQualityHint: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 14,
    fontSize: 12,
  },
  foodQualityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  foodQualityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: '#FAFAFA',
    gap: 6,
  },
  foodQualityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
});
