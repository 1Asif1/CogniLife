import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CustomModal } from '../../components/CustomModal';
import { GradientBackground } from '../../components/GradientBackground';
import { Input } from '../../components/Input';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, useTranslated } from '../../context/LanguageContext';
import { bluetoothDeviceService } from '../../services/bluetoothDeviceService';
import { getStreakData } from '../../services/dailyLogService';
import { getHealthConnectStatus, openHealthConnectSettings } from '../../services/healthConnectService';

interface BluetoothDevice {
  id: string;
  name: string | null;
}

const InfoRow = ({ icon, text }: { icon: any; text: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color={theme.colors.textSecondary} style={{ marginRight: 12, width: 20 }} />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const SettingItem = ({ icon, title, subtitle, showBorder = true, onPress }: any) => (
  <TouchableOpacity style={[styles.settingItem, showBorder && styles.settingBorder]} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={20} color={theme.colors.textSecondary} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const [device, setDevice] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<BluetoothDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  } | null>(null);

  // Health Connect state
  const [healthConnectStatus, setHealthConnectStatus] = useState<{
    available: boolean;
    installed: boolean;
    hasPermission: boolean;
    deviceName: string;
    lastSync: string | null;
  } | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const { signOut, userProfile, updateUserProfile } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const t = useTranslated({
    profileTitle: 'Profile',
    profileSubtitle: 'Manage your account & settings',
    memberSince: 'Member since',
    edit: 'Edit',
    streakTitle: 'Activity Streak',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    totalLogs: 'Total Logs',
    streakKeepUp: 'Keep it up!',
    deviceTitle: 'Connected Devices',
    noDevice: 'No Device Connected',
    addDevice: '+ Add New Device',
    disconnect: 'Disconnect',
    langTitle: 'Language',
    langHint: 'Choose the language for the app interface',
    account: 'Account',
    notifications: 'Notifications',
    privacy: 'Privacy & Security',
    permissions: 'App Permissions',
    support: 'Support',
    helpCenter: 'Help Center',
    contactDoc: 'Contact Doctors',
    logout: 'Log Out',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    fullName: 'Full Name',
    heightLabel: 'Height',
    weightLabel: 'Weight',
    deviceConnected: 'Connected',
    deviceLastSync: 'Last sync: Just now',
    deviceNoConnectHint: "Tap 'Add New Device' to connect",
    namePlaceholder: 'Enter your name',
    heightPlaceholder: 'e.g. 175',
    weightPlaceholder: 'e.g. 70',
    nameRequired: 'Name is required',
    modalDisconnectMsg: 'Are you sure you want to disconnect',
    modalDeviceFoundTitle: 'Device Found',
    modalDeviceFoundMsg: 'device(s). Connecting to',
    modalFound: 'Found',
    modalNoDevicesTitle: 'No Devices',
    modalNoDevicesMsg: 'No compatible health devices found nearby. Make sure Bluetooth is enabled and your device is in pairing mode.',
    modalScanErrorTitle: 'Error',
    modalScanErrorMsg: 'Failed to scan for devices. Please check Bluetooth permissions.',
    appVersion: 'CogniLife v1.0.0',
  });

  const [streakData, setStreakData] = useState({ currentStreak: 0, bestStreak: 0, totalLogs: 0 });

  useFocusEffect(
    useCallback(() => {
      if (userProfile?.id) {
        getStreakData(userProfile.id).then(setStreakData);
      }
      // Fetch Health Connect status
      getHealthConnectStatus().then(setHealthConnectStatus);
    }, [userProfile?.id])
  );

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const openEditModal = () => {
    if (userProfile) {
      setEditName(userProfile.name || '');
      setEditHeight(userProfile.height ? String(userProfile.height) : '');
      setEditWeight(userProfile.weight ? String(userProfile.weight) : '');
    }
    setEditError('');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError(t.nameRequired);
      return;
    }
    setEditLoading(true);
    setEditError('');
    const updates = {
      name: editName.trim(),
      height: editHeight ? parseFloat(editHeight) : null,
      weight: editWeight ? parseFloat(editWeight) : null,
    };
    const { error: updateError } = await updateUserProfile(updates);
    if (updateError) {
      setEditError(updateError.message || 'Failed to update profile');
      setEditLoading(false);
    } else {
      setEditLoading(false);
      setEditModalVisible(false);
    }
  };

  const handleDisconnect = async () => {
    const deviceName = device || 'Apple Watch';
    setModalConfig({
      title: t.disconnect,
      message: `${t.modalDisconnectMsg} ${deviceName}?`,
      onConfirm: async () => {
        setModalVisible(false);
        setDevice(null);
        setMessage('Device disconnected successfully');
      },
      showCancel: true,
    });
    setModalVisible(true);
  };

  const handleAddDevice = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    try {
      await bluetoothDeviceService.startScan((device: BluetoothDevice) => {
        setFoundDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) return [...prev, device];
          return prev;
        });
      }, 5000);

      setTimeout(async () => {
        setIsScanning(false);
        if (foundDevices.length > 0) {
          setModalConfig({
            title: t.modalDeviceFoundTitle,
            message: `${t.modalFound} ${foundDevices.length} ${t.modalDeviceFoundMsg} ${foundDevices[0].name}?`,
            onConfirm: async () => {
              setModalVisible(false);
              const connected = await bluetoothDeviceService.connectToDevice(foundDevices[0].id);
              if (connected) {
                setDevice(foundDevices[0].name || 'Unknown Device');
                setMessage('Connected successfully');
              } else {
                setMessage('Connection failed');
              }
            },
            showCancel: true,
          });
          setModalVisible(true);
        } else {
          setMessage('No devices found');
          setModalConfig({
            title: t.modalNoDevicesTitle,
            message: t.modalNoDevicesMsg,
            showCancel: false,
          });
          setModalVisible(true);
        }
      }, 10000);
    } catch (error) {
      setIsScanning(false);
      setMessage('Scan failed');
      setModalConfig({
        title: t.modalScanErrorTitle,
        message: t.modalScanErrorMsg,
        showCancel: false,
      });
      setModalVisible(true);
    }
  };

  const handleOpenHealthConnect = async () => {
    const opened = await openHealthConnectSettings();
    if (!opened) {
      setModalConfig({
        title: 'Error',
        message: 'Could not open Health Connect. Please ensure it is installed on your device.',
        showCancel: false,
      });
      setModalVisible(true);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      bounces={false}
      key={language}
    >
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>{t.profileTitle}</Text>
          <Text style={styles.subtitle}>{t.profileSubtitle}</Text>
        </GradientBackground>

        <View style={styles.profileContainer}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userProfile?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
                <Text style={styles.profileMember}>
                  {t.memberSince}{' '}
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                    : '----'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
                <Text style={styles.editBtnText}>{t.edit}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <InfoRow icon="mail-outline" text={userProfile?.email || 'user@example.com'} />
            <InfoRow icon="body-outline" text={`${userProfile?.height || '--'}cm • ${userProfile?.weight || '--'}kg`} />
          </Card>
        </View>
      </View>

      <View style={styles.content}>
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderLine}>
            <Ionicons name="flame" size={20} color="#EA580C" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{t.streakTitle}</Text>
          </View>
          <View style={styles.streakStatsRow}>
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="flame" size={24} color="#EA580C" />
              </View>
              <Text style={styles.streakValue}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>{t.currentStreak}</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="trophy" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.streakValue}>{streakData.bestStreak}</Text>
              <Text style={styles.streakLabel}>{t.bestStreak}</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calendar" size={24} color="#10B981" />
              </View>
              <Text style={styles.streakValue}>{streakData.totalLogs}</Text>
              <Text style={styles.streakLabel}>{t.totalLogs}</Text>
            </View>
          </View>
          <View style={styles.streakBanner}>
            <Text style={styles.streakBannerText}>
              🔥 {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} {t.streakKeepUp}
            </Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{t.deviceTitle}</Text>

          {/* Bluetooth Device */}
          {device ? (
            <View style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Ionicons name="watch-outline" size={24} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceTitle}>{device}</Text>
                <Text style={styles.deviceSub}>{t.deviceConnected}</Text>
                <Text style={styles.deviceSync}>{t.deviceLastSync}</Text>
              </View>
              <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
                <Text style={styles.disconnectBtnText}>{t.disconnect}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Ionicons name="watch-outline" size={24} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceTitle}>{t.noDevice}</Text>
                <Text style={styles.deviceSub}>{t.deviceNoConnectHint}</Text>
              </View>
            </View>
          )}

          {/* Health Connect Device */}
          {healthConnectStatus && (
            <View style={[styles.deviceRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 16 }]}>
              <View style={[styles.deviceIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceTitle}>{healthConnectStatus.deviceName}</Text>
                <Text style={styles.deviceSub}>
                  {healthConnectStatus.installed
                    ? (healthConnectStatus.hasPermission ? t.deviceConnected : 'Not authorized')
                    : 'Not installed'
                  }
                </Text>
                {healthConnectStatus.lastSync && (
                  <Text style={styles.deviceSync}>
                    Last sync: {new Date(healthConnectStatus.lastSync).toLocaleTimeString()}
                  </Text>
                )}
              </View>
              {healthConnectStatus.installed && (
                <TouchableOpacity
                  style={[styles.disconnectBtn, { backgroundColor: theme.colors.primary + '15' }]}
                  onPress={handleOpenHealthConnect}
                >
                  <Text style={[styles.disconnectBtnText, { color: theme.colors.primary }]}>Open</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.addDeviceBtn} onPress={handleAddDevice}>
            <Text style={styles.addDeviceText}>{t.addDevice}</Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.langCardHeader}>
            <View style={styles.langIconBg}>
              <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{t.langTitle}</Text>
          </View>
          <Text style={styles.langHint}>{t.langHint}</Text>
          <LanguageSwitcher userId={userProfile?.id} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16, marginTop: 8 }]}>{t.account}</Text>
          <SettingItem icon="notifications-outline" title={t.notifications} subtitle="Manage" onPress={() => router.push('/notifications-settings')} />
          <SettingItem icon="lock-closed-outline" title={t.privacy} onPress={() => router.push('/privacy-security')} />
          <SettingItem icon="apps-outline" title={t.permissions} subtitle="Review" showBorder={false} onPress={() => router.push('/app-permissions')} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16, marginTop: 8 }]}>{t.support}</Text>
          <SettingItem icon="help-circle-outline" title={t.helpCenter} onPress={() => router.push('/help-center')} />
          <SettingItem icon="medkit-outline" title={t.contactDoc} showBorder={false} onPress={() => router.push('/contact-doctors')} />
        </Card>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t.appVersion}</Text>
      </View>

      <CustomModal
        visible={modalVisible}
        title={modalConfig?.title || ''}
        message={modalConfig?.message || ''}
        onConfirm={modalConfig?.onConfirm}
        onCancel={() => setModalVisible(false)}
        showCancel={modalConfig?.showCancel}
      />

      {/* Edit Profile modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.editModalOverlay}>
          <KeyboardAvoidingView
            style={styles.editModalKeyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>{t.edit}</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {editError ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
                    <Text style={styles.errorText}>{editError}</Text>
                  </View>
                ) : null}

                <Input
                  label={t.fullName}
                  placeholder={t.namePlaceholder}
                  value={editName}
                  onChangeText={(text) => { setEditName(text); setEditError(''); }}
                />
                <Input
                  label={t.heightLabel}
                  placeholder={t.heightPlaceholder}
                  keyboardType="numeric"
                  value={editHeight}
                  onChangeText={(text) => { setEditHeight(text); setEditError(''); }}
                />
                <Input
                  label={t.weightLabel}
                  placeholder={t.weightPlaceholder}
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={(text) => { setEditWeight(text); setEditError(''); }}
                />

                {editLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>{t.saving}</Text>
                  </View>
                ) : (
                  <Button title={t.saveChanges} onPress={handleSaveProfile} style={styles.saveBtn} />
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topSection: { position: 'relative', marginBottom: 150 },
  headerGradient: { height: 220, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  profileContainer: { position: 'absolute', top: 130, left: 24, right: 24 },
  profileCard: { padding: 24 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  profileInfo: { flex: 1 },
  profileName: { ...theme.typography.h2, marginBottom: 4 },
  profileMember: { fontSize: 13, color: theme.colors.textSecondary },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.primary + '15', borderRadius: 20 },
  editBtnText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 14, color: theme.colors.textSecondary },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionCard: { marginBottom: 24, padding: 20 },
  sectionHeaderLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { ...theme.typography.h3 },
  streakStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  streakBox: { alignItems: 'center', flex: 1 },
  streakIconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  streakValue: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  streakLabel: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },
  streakDivider: { width: 1, backgroundColor: theme.colors.border, height: 60, alignSelf: 'center' },
  streakBanner: { backgroundColor: '#FFF7ED', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  streakBannerText: { color: '#EA580C', fontWeight: '600', fontSize: 14 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  deviceIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  deviceTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  deviceSub: { fontSize: 13, color: theme.colors.text, marginBottom: 2 },
  deviceSync: { fontSize: 12, color: theme.colors.textSecondary },
  addDeviceBtn: { paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, alignItems: 'center' },
  addDeviceText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
  disconnectBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.danger + '15', borderRadius: 8 },
  disconnectBtnText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
  langCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  langIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  langHint: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 12 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  settingSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  logoutCard: { backgroundColor: theme.colors.danger + '10', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 24 },
  logoutText: { color: theme.colors.danger, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12 },
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  editModalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editModalTitle: { ...theme.typography.h2, color: theme.colors.text },
  closeBtn: { padding: 4 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.dangerLight, borderRadius: 10, padding: 12, marginBottom: 16, gap: 8 },
  errorText: { color: theme.colors.danger, fontSize: 13, flex: 1 },
  saveBtn: { marginTop: 8, marginBottom: 20 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 8, marginBottom: 20, gap: 8 },
  loadingText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
});
