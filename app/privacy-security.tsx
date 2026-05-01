import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Card } from '../components/Card';
import { CustomModal } from '../components/CustomModal';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTranslated } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

// Helper interface for TypeScript
interface SecurityItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}

const privacyToggles = [
  { id: 'analytics', title: 'Anonymous Analytics', subtitle: 'Share anonymous usage data to improve the app', icon: 'analytics-outline' as const, def: false },
  { id: 'health_share', title: 'Health Data Sharing', subtitle: 'Share health summaries with connected doctors', icon: 'heart-outline' as const, def: true },
  { id: 'crash', title: 'Crash Reports', subtitle: 'Automatically send crash reports', icon: 'bug-outline' as const, def: true },
];

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();

  // 1. Centralized Translations[cite: 2, 4]
const t = useTranslated({
    headerTitle: 'Privacy & Security',
    headerSubtitle: 'Manage how your data is used & protected',
    securityStatus: 'Security Status',
    accountSecure: 'Your account is secure',
    dataEncryption: 'Data Encryption',
    dataEncryptionSub: 'All data encrypted at rest and in transit',
    cloudStorage: 'Secure Cloud Storage',
    cloudStorageSub: 'Supabase with row-level security',
    sessionSec: 'Session Security',
    sessionSecSub: 'Sessions expire automatically',
    changePassword: 'Change Password',
    updatePassword: 'Update your password',
    newPasswordPlace: 'New Password',
    confirmPasswordPlace: 'Confirm Password',
    dangerZone: 'Data Management',
    dangerDesc: 'These actions are permanent and cannot be reversed.',
    deleteHealthData: 'Delete All Health Data',
    deleteHealthMsg: 'This will permanently delete all your health data. Are you sure?',
    deleteAccount: 'Delete Account',
    deleteAccountMsg: 'This will permanently delete your account. Are you sure?',
    confirmBtn: 'OK',
    cancelBtn: 'Cancel',
    error: 'Error',
    success: 'Success',
    processing: 'Processing...',
  })

  // 2. Localized Security Items (Fixed scope error)[cite: 1, 4]
  const securityItems: SecurityItem[] = [
    { icon: 'lock-closed-outline', title: t.dataEncryption, subtitle: t.dataEncryptionSub, color: theme.colors.success },
    { icon: 'server-outline', title: t.cloudStorage, subtitle: t.cloudStorageSub, color: theme.colors.success },
    { icon: 'key-outline', title: t.sessionSec, subtitle: t.sessionSecSub, color: theme.colors.success },
  ];

  // UI State[cite: 1]
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    privacyToggles.reduce((a, pt) => ({ ...a, [pt.id]: pt.def }), {} as Record<string, boolean>)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; message: string; onConfirm?: () => void; showCancel?: boolean; confirmText?: string; cancelText?: string; } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Password State[cite: 1]
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 3. Restored Data Deletion Logic[cite: 1]
  const handleDeleteHealthData = () => {
    setModalConfig({
      title: t.deleteHealthData,
      message: t.deleteHealthMsg,
      onConfirm: async () => {
        setModalVisible(false);
        setIsDeleting(true);
        try {
          const userId = userProfile?.id;
          if (!userId) throw new Error('Could not identify your account.');

          const tables = ['insights', 'behavior_clusters', 'anomalies', 'predictions', 'daily_logs'];
          for (const table of tables) {
            await supabase.from(table).delete().eq('user_id', userId);
          }

          setIsDeleting(false);
          setModalConfig({ title: 'Data Deleted', message: 'All your health data has been permanently deleted.', showCancel: false, confirmText: t.confirmBtn });
          setModalVisible(true);
        } catch (err: any) {
          setIsDeleting(false);
          setModalConfig({ title: 'Error', message: err.message, showCancel: false, confirmText: t.confirmBtn });
          setModalVisible(true);
        }
      },
      showCancel: true,
      confirmText: t.confirmBtn, 
      cancelText: t.cancelBtn,
    });
    setModalVisible(true);
  };

  const handleDeleteAccount = () => {
    setModalConfig({
      title: t.deleteAccount,
      message: t.deleteAccountMsg,
      onConfirm: async () => {
        setModalVisible(false);
        setIsDeleting(true);
        try {
          const userId = userProfile?.id;
          if (!userId) throw new Error('User not found.');

          await supabase.from('users').delete().eq('user_id', userId);
          await signOut();
          router.replace('/auth/login');
        } catch (err: any) {
          setIsDeleting(false);
          setModalConfig({ title: 'Error', message: err.message, showCancel: false, confirmText: t.confirmBtn });
          setModalVisible(true);
        }
      },
      showCancel: true,
      confirmText: t.confirmBtn,
      cancelText: t.cancelBtn,
    });
    setModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return setPasswordError('Password too short.');
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match.');
    
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setShowPasswordForm(false);
      setModalConfig({ title: 'Success', message: 'Password updated.', showCancel: false, confirmText: t.confirmBtn });
      setModalVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <GradientBackground style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.headerTitle}</Text>
            <Text style={styles.subtitle}>{t.headerSubtitle}</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>
        {isDeleting && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t.processing}</Text>
          </Card>
        )}

        {/* Security Status Section[cite: 1] */}
        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{t.securityStatus}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.badgeText}>{t.accountSecure}</Text>
          </View>
          {securityItems.map((item: SecurityItem, i: number) => (
            <View key={item.title} style={[styles.secRow, i < securityItems.length - 1 && styles.borderBottom]}>
              <View style={styles.secIcon}><Ionicons name={item.icon} size={18} color={theme.colors.primary} /></View>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.secTitle}>{item.title}</Text>
                <Text style={styles.secSub}>{item.subtitle}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={item.color} />
            </View>
          ))}
        </Card>

        {/* Change Password Section[cite: 1] */}
        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="key-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{t.changePassword}</Text>
          </View>

          {!showPasswordForm ? (
            <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setShowPasswordForm(true)}>
              <Ionicons name="lock-open-outline" size={18} color={theme.colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.changePasswordBtnText}>{t.updatePassword}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
            </TouchableOpacity>
          ) : (
            <View>
              <TextInput
                style={styles.input}
                placeholder={t.newPasswordPlace}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder={t.confirmPasswordPlace}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              <View style={styles.passwordActions}>
                <TouchableOpacity style={styles.savePasswordBtn} onPress={handleChangePassword}>
                  <Text style={styles.savePasswordBtnText}>{t.confirmBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelPasswordBtn} onPress={() => setShowPasswordForm(false)}>
                  <Text style={styles.cancelPasswordBtnText}>{t.cancelBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Danger Zone Section[cite: 1] */}
        <Card style={StyleSheet.flatten([styles.card, { borderWidth: 1, borderColor: theme.colors.danger + '30' }])}>
          <View style={styles.sectionRow}>
            <Ionicons name="warning-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>{t.dangerZone}</Text>
          </View>
          <Text style={styles.dangerDesc}>{t.dangerDesc}</Text>
          <TouchableOpacity style={[styles.dangerBtn, styles.borderBottom]} onPress={handleDeleteHealthData}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>{t.deleteHealthData}</Text>
              <Text style={styles.secSub}>{t.deleteHealthMsg}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>{t.deleteAccount}</Text>
              <Text style={styles.secSub}>{t.deleteAccountMsg}</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </View>

      <CustomModal 
        visible={modalVisible} 
        title={modalConfig?.title || ''} 
        message={modalConfig?.message || ''} 
        onConfirm={modalConfig?.onConfirm} 
        onCancel={() => setModalVisible(false)} 
        showCancel={modalConfig?.showCancel} 
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
      />
    </ScrollView>
  );
}

// Restored Original Styles[cite: 1]
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerGradient: { height: 180, paddingTop: 50, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 24 },
  card: { marginBottom: 24, padding: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  badge: { flexDirection: 'row', padding: 8, borderRadius: 20, backgroundColor: theme.colors.success + '15', marginBottom: 20 },
  badgeText: { color: theme.colors.success, fontSize: 13, marginLeft: 6 },
  secRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  secIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  secTitle: { fontSize: 15, fontWeight: '500' },
  secSub: { fontSize: 12, color: theme.colors.textSecondary },
  input: { borderBottomWidth: 1, borderColor: theme.colors.border, marginBottom: 16, height: 45 },
  changePasswordBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: theme.colors.primary + '08', borderRadius: 12 },
  changePasswordBtnText: { flex: 1, color: theme.colors.primary, fontWeight: '500' },
  passwordActions: { flexDirection: 'row', gap: 12 },
  savePasswordBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8 },
  savePasswordBtnText: { color: '#FFF', textAlign: 'center', fontWeight: '600' },
  cancelPasswordBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 8 },
  cancelPasswordBtnText: { color: theme.colors.textSecondary, textAlign: 'center' },
  dangerBtn: { paddingVertical: 14 },
  dangerTitle: { color: theme.colors.danger, fontWeight: '500' },
  dangerDesc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16 },
  errorText: { color: theme.colors.danger, marginBottom: 12 },
  loadingCard: { alignItems: 'center', marginBottom: 24 },
  loadingText: { marginTop: 12, color: theme.colors.textSecondary }
});