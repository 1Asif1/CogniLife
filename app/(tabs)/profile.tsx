import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CustomModal } from '../../components/CustomModal';
import { GradientBackground } from '../../components/GradientBackground';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { bluetoothDeviceService } from '../../services/bluetoothDeviceService';
import { getStreakData } from '../../services/dailyLogService';

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
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState<BluetoothDevice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
    showCancel?: boolean;
  } | null>(null);

  // Edit Profile State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const { signOut, userProfile, updateUserProfile } = useAuth();
  const router = useRouter();

  const [streakData, setStreakData] = useState({ currentStreak: 0, bestStreak: 0, totalLogs: 0 });

  useFocusEffect(
    useCallback(() => {
      if (userProfile?.id) {
        getStreakData(userProfile.id).then(setStreakData);
      }
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
      setEditError('Name is required');
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
      title: 'Disconnect Device',
      message: `Are you sure you want to disconnect ${deviceName}?`,
      onConfirm: async () => {
        setModalVisible(false);
        setDevice(null);
        setMessage("Device disconnected successfully ");
      },
      showCancel: true,
    });
    setModalVisible(true);
  };

  const handleAddDevice = async () => {
    setIsScanning(true);
    setFoundDevices([]);

    try {
      await bluetoothDeviceService.startScan(
        (device: BluetoothDevice) => {
          setFoundDevices((prev) => {
            // Avoid duplicates
            if (!prev.find((d) => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        },
        5000 // 5 second scan
      );

      // Check if we found devices after scan completes
      setTimeout(async () => {
        setIsScanning(false);
        
        if (foundDevices.length > 0) {
          // Show devices to user to select
          setModalConfig({
            title: 'Device Found',
            message: `Found ${foundDevices.length} device(s). Connecting to ${foundDevices[0].name}?`,
            onConfirm: async () => {
              setModalVisible(false);
              const connected = await bluetoothDeviceService.connectToDevice(foundDevices[0].id);
              if (connected) {
                setDevice(foundDevices[0].name || 'Unknown Device');
                setMessage("Connected successfully ");
              } else {
                setMessage("Connection failed ");
              }
            },
            showCancel: true,
          });
          setModalVisible(true);
        } else {
          setMessage("No devices found ");
          setModalConfig({
            title: 'No Devices',
            message: 'No compatible health devices found nearby. Make sure Bluetooth is enabled and your device is in pairing mode.',
            showCancel: false,
          });
          setModalVisible(true);
        }
      }, 10000);
    } catch (error) {
      setIsScanning(false);
      setMessage("Scan failed ");
      setModalConfig({
        title: 'Error',
        message: 'Failed to scan for devices. Please check Bluetooth permissions.',
        showCancel: false,
      });
      setModalVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.topSection}>
        <GradientBackground style={styles.headerGradient}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account & settings</Text>
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
                  Member since {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '----'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
                <Text style={styles.editBtnText}>Edit</Text>
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
            <Text style={styles.sectionTitle}>Activity Streak</Text>
          </View>
          <View style={styles.streakStatsRow}>
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="flame" size={24} color="#EA580C" />
              </View>
              <Text style={styles.streakValue}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current{'\n'}Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="trophy" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.streakValue}>{streakData.bestStreak}</Text>
              <Text style={styles.streakLabel}>Best{'\n'}Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakBox}>
              <View style={[styles.streakIconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="calendar" size={24} color="#10B981" />
              </View>
              <Text style={styles.streakValue}>{streakData.totalLogs}</Text>
              <Text style={styles.streakLabel}>Total{'\n'}Logs</Text>
            </View>
          </View>

          <View style={styles.streakBanner}>
            <Text style={styles.streakBannerText}>
              🔥 {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} in a row! Keep it up!
            </Text>
          </View>
        </Card>
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderLine}>
            <Ionicons name="fitness-outline" size={20} color={theme.colors.secondary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Health Overview</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>78</Text>
              <Text style={styles.statLabel}>Health Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>142</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>89%</Text>
              <Text style={styles.statLabel}>Goal Rate</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Connected Devices</Text>
          {device ? (
            <View style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Ionicons name="watch-outline" size={24} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceTitle}>{device}</Text>
                <Text style={styles.deviceSub}>Connected</Text>
                <Text style={styles.deviceSync}>Last sync: Just now</Text>
              </View>
              <TouchableOpacity
                style={styles.disconnectBtn}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectBtnText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.deviceRow}>
              <View style={styles.deviceIcon}>
                <Ionicons name="watch-outline" size={24} color={theme.colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceTitle}>No Device Connected</Text>
                <Text style={styles.deviceSub}>Tap 'Add New Device' to connect</Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={styles.addDeviceBtn} 
            onPress={handleAddDevice}
          >
            <Text style={styles.addDeviceText}>+ Add New Device</Text>
          </TouchableOpacity>
          {message !== "" && (
            <Text style={{ marginTop: 10, textAlign: "center" }}>
              {message}
            </Text>
         )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16, marginTop: 8 }]}>Account</Text>
          <SettingItem icon="notifications-outline" title="Notifications" subtitle="Manage" onPress={() => router.push('/notifications-settings')} />
          <SettingItem icon="lock-closed-outline" title="Privacy & Security" onPress={() => router.push('/privacy-security')} />
          <SettingItem icon="apps-outline" title="App Permissions" subtitle="Review" showBorder={false} onPress={() => router.push('/app-permissions')} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 16, marginTop: 8 }]}>Support</Text>
          <SettingItem icon="help-circle-outline" title="Help Center" onPress={() => router.push('/help-center')} />
          <SettingItem icon="medkit-outline" title="Contact Doctors" showBorder={false} onPress={() => router.push('/contact-doctors')} />
        </Card>

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
           <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
           <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CogniLife v1.0.0</Text>
      </View>

      <CustomModal
        visible={modalVisible}
        title={modalConfig?.title || ''}
        message={modalConfig?.message || ''}
        onConfirm={modalConfig?.onConfirm}
        onCancel={() => setModalVisible(false)}
        showCancel={modalConfig?.showCancel}
      />

      {/* Edit Profile Modal */}
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
                <Text style={styles.editModalTitle}>Edit Profile</Text>
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
                  label="Full Name"
                  placeholder="Enter your name"
                  value={editName}
                  onChangeText={(text) => { setEditName(text); setEditError(''); }}
                />

                <Input
                  label="Height (cm)"
                  placeholder="e.g. 175"
                  keyboardType="numeric"
                  value={editHeight}
                  onChangeText={(text) => { setEditHeight(text); setEditError(''); }}
                />

                <Input
                  label="Weight (kg)"
                  placeholder="e.g. 70"
                  keyboardType="numeric"
                  value={editWeight}
                  onChangeText={(text) => { setEditWeight(text); setEditError(''); }}
                />

                {editLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Saving...</Text>
                  </View>
                ) : (
                  <Button
                    title="Save Changes"
                    onPress={handleSaveProfile}
                    style={styles.saveBtn}
                  />
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
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary },
  statDivider: { width: 1, backgroundColor: theme.colors.border, height: '100%' },
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
  connectedBadge: { flexDirection: 'row', alignItems: 'center' },
  connectedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success, marginRight: 6 },
  connectedText: { fontSize: 12, color: theme.colors.success, fontWeight: '500' },
  addDeviceBtn: { paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, alignItems: 'center' },
  addDeviceText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
  disconnectBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.danger + '15', borderRadius: 8 },
  disconnectBtnText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  settingSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },
  logoutCard: { backgroundColor: theme.colors.danger + '10', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12, marginBottom: 24 },
  logoutText: { color: theme.colors.danger, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12 },
  
  // Edit Modal Styles
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
  loadingText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' }
});
