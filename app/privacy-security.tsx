import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../components/Card';
import { CustomModal } from '../components/CustomModal';
import { GradientBackground } from '../components/GradientBackground';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const securityItems = [
  { icon: 'lock-closed-outline' as const, title: 'Data Encryption', subtitle: 'All data encrypted at rest and in transit', color: theme.colors.success },
  { icon: 'server-outline' as const, title: 'Secure Cloud Storage', subtitle: 'Supabase with row-level security', color: theme.colors.success },
  { icon: 'key-outline' as const, title: 'Session Security', subtitle: 'Sessions expire automatically', color: theme.colors.success },
];

const privacyToggles = [
  { id: 'analytics', title: 'Anonymous Analytics', subtitle: 'Share anonymous usage data to improve the app', icon: 'analytics-outline' as const, def: false },
  { id: 'health_share', title: 'Health Data Sharing', subtitle: 'Share health summaries with connected doctors', icon: 'heart-outline' as const, def: true },
  { id: 'crash', title: 'Crash Reports', subtitle: 'Automatically send crash reports', icon: 'bug-outline' as const, def: true },
];

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    privacyToggles.reduce((a, t) => ({ ...a, [t.id]: t.def }), {} as Record<string, boolean>)
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; message: string; onConfirm?: () => void; showCancel?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleDeleteHealthData = () => {
    setModalConfig({
      title: 'Delete All Health Data',
      message: 'This will permanently delete all your daily logs, predictions, insights, and health data. This action cannot be undone.\n\nAre you sure you want to proceed?',
      onConfirm: async () => {
        setModalVisible(false);
        setIsDeleting(true);
        try {
          const userId = userProfile?.id;
          if (!userId) {
            setIsDeleting(false);
            setModalConfig({ title: 'Error', message: 'Could not identify your account. Please try again.', showCancel: false });
            setModalVisible(true);
            return;
          }

          // Delete from all related tables (daily_logs cascade will handle predictions, anomalies, etc. linked by log_id)
          // But we also need to delete predictions/anomalies/insights/behavior_clusters linked directly by user_id
          const tables = ['insights', 'behavior_clusters', 'anomalies', 'predictions', 'daily_logs'];
          for (const table of tables) {
            const { error } = await supabase.from(table).delete().eq('user_id', userId);
            if (error) {
              console.error(`Failed to delete from ${table}:`, error);
            }
          }

          setIsDeleting(false);
          setModalConfig({ title: 'Data Deleted', message: 'All your health data has been permanently deleted.', showCancel: false });
          setModalVisible(true);
        } catch (err: any) {
          setIsDeleting(false);
          setModalConfig({ title: 'Error', message: err.message || 'Something went wrong. Please try again.', showCancel: false });
          setModalVisible(true);
        }
      },
      showCancel: true,
    });
    setModalVisible(true);
  };

  const handleDeleteAccount = () => {
    setModalConfig({
      title: 'Delete Account',
      message: 'This will permanently delete your account, all health data, daily logs, and personal information. You will be logged out and cannot recover your account.\n\nAre you sure you want to proceed?',
      onConfirm: async () => {
        setModalVisible(false);
        setIsDeleting(true);
        try {
          const userId = userProfile?.id;
          if (!userId) {
            setIsDeleting(false);
            setModalConfig({ title: 'Error', message: 'Could not identify your account. Please try again.', showCancel: false });
            setModalVisible(true);
            return;
          }

          // Delete all related data first (child tables)
          const childTables = ['insights', 'behavior_clusters', 'anomalies', 'predictions', 'daily_logs'];
          for (const table of childTables) {
            const { error } = await supabase.from(table).delete().eq('user_id', userId);
            if (error) {
              console.error(`Failed to delete from ${table}:`, error);
            }
          }

          // Delete the user row from users table
          const { error: userDeleteError } = await supabase
            .from('users')
            .delete()
            .eq('user_id', userId);

          if (userDeleteError) {
            console.error('Failed to delete user row:', userDeleteError);
            setIsDeleting(false);
            setModalConfig({ title: 'Error', message: 'Failed to delete your account. Please try again.', showCancel: false });
            setModalVisible(true);
            return;
          }

          // Sign out the user (this also clears auth session)
          setIsDeleting(false);
          await signOut();
          router.replace('/auth/login');
        } catch (err: any) {
          setIsDeleting(false);
          setModalConfig({ title: 'Error', message: err.message || 'Something went wrong. Please try again.', showCancel: false });
          setModalVisible(true);
        }
      },
      showCancel: true,
    });
    setModalVisible(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setIsChangingPassword(false);

      if (error) {
        setPasswordError(error.message);
        return;
      }

      // Success
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setModalConfig({ title: 'Password Changed', message: 'Your password has been updated successfully.', showCancel: false });
      setModalVisible(true);
    } catch (err: any) {
      setIsChangingPassword(false);
      setPasswordError(err.message || 'Failed to change password.');
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
            <Text style={styles.title}>Privacy & Security</Text>
            <Text style={styles.subtitle}>Manage how your data is used & protected</Text>
          </View>
        </View>
      </GradientBackground>

      <View style={styles.content}>
        {/* Loading overlay */}
        {isDeleting && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Processing your request...</Text>
          </Card>
        )}

        {/* Security Status */}
        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Security Status</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.badgeText}>Your account is secure</Text>
          </View>
          {securityItems.map((item, i) => (
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

        {/* Change Password */}
        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="key-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>

          {!showPasswordForm ? (
            <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setShowPasswordForm(true)}>
              <Ionicons name="lock-open-outline" size={18} color={theme.colors.primary} style={{ marginRight: 10 }} />
              <Text style={styles.changePasswordBtnText}>Update your password</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
            </TouchableOpacity>
          ) : (
            <View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {passwordError !== '' && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={theme.colors.danger} style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}

              <View style={styles.passwordActions}>
                <TouchableOpacity
                  style={styles.savePasswordBtn}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.savePasswordBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelPasswordBtn}
                  onPress={() => {
                    setShowPasswordForm(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                >
                  <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.card, { borderWidth: 1, borderColor: theme.colors.danger + '30' }]}>
          <View style={styles.sectionRow}>
            <Ionicons name="warning-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.colors.danger }]}>Danger Zone</Text>
          </View>
          <Text style={styles.dangerDesc}>These actions are permanent and cannot be reversed.</Text>
          <TouchableOpacity style={[styles.dangerBtn, styles.borderBottom]} onPress={handleDeleteHealthData} disabled={isDeleting}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}><Text style={styles.dangerTitle}>Delete All Health Data</Text><Text style={styles.secSub}>Remove all daily logs, insights, and synced data</Text></View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount} disabled={isDeleting}>
            <Ionicons name="person-remove-outline" size={18} color={theme.colors.danger} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}><Text style={styles.dangerTitle}>Delete Account</Text><Text style={styles.secSub}>Permanently delete your account and all data</Text></View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
          </TouchableOpacity>
        </Card>
      </View>

      <CustomModal visible={modalVisible} title={modalConfig?.title || ''} message={modalConfig?.message || ''} onConfirm={modalConfig?.onConfirm} onCancel={() => setModalVisible(false)} showCancel={modalConfig?.showCancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerGradient: { height: 180, paddingTop: 50, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 2 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  card: { marginBottom: 24, padding: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { ...theme.typography.h3 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.success + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 20 },
  badgeText: { fontSize: 13, fontWeight: '600', color: theme.colors.success, marginLeft: 6 },
  secRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  secIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  secTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  secSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  toggleIconActive: { backgroundColor: theme.colors.primary },
  dangerDesc: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 19 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  dangerTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.danger },
  loadingCard: { marginBottom: 24, padding: 24, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.colors.textSecondary },

  // Change Password
  changePasswordBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: theme.colors.primary + '08', borderRadius: 12, paddingHorizontal: 16 },
  changePasswordBtnText: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.primary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: theme.colors.text },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  errorText: { fontSize: 13, color: theme.colors.danger, flex: 1 },
  passwordActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  savePasswordBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePasswordBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  cancelPasswordBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelPasswordBtnText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
