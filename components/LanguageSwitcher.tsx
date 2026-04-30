/**
 * LanguageSwitcher.tsx
 * ────────────────────
 * Drop-in language picker modal.
 * Can be placed on any screen — typically the Profile tab.
 *
 * NEW FILE — zero changes to existing code.
 *
 * Usage:
 *   import { LanguageSwitcher } from '../../components/LanguageSwitcher';
 *   <LanguageSwitcher userId={userProfile?.id} />
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../services/translationService';

interface Props {
  /** Pass the Supabase user_id so the choice is saved to the DB */
  userId?: string;
}

export function LanguageSwitcher({ userId }: Props) {
  const { language, languageInfo, supportedLanguages, setLanguage, isChangingLanguage } =
    useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = async (code: string) => {
    setModalVisible(false);
    await setLanguage(code, userId);
  };

  return (
    <>
      {/* ── Trigger button ── */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
        disabled={isChangingLanguage}
      >
        <Text style={styles.flag}>{languageInfo.flag}</Text>
        <View style={styles.triggerText}>
          <Text style={styles.triggerLabel}>{languageInfo.nativeLabel}</Text>
          <Text style={styles.triggerSub}>{languageInfo.label}</Text>
        </View>
        {isChangingLanguage ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
        )}
      </TouchableOpacity>

      {/* ── Picker modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent          // ← ADD THIS
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Select Language</Text>
          <Text style={styles.sheetSub}>भाषा चुनें · భాష ఎంచుకోండి · ভাষা বেছে নিন</Text>

          <FlatList
            data={supportedLanguages}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: { item: SupportedLanguage }) => {
              const isActive = item.code === language;
              return (
                <TouchableOpacity
                  style={[styles.langRow, isActive && styles.langRowActive]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <View style={styles.langText}>
                    <Text style={[styles.langNative, isActive && styles.langNativeActive]}>
                      {item.nativeLabel}
                    </Text>
                    <Text style={styles.langEnglish}>{item.label}</Text>
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  flag: {
    fontSize: 26,
  },
  triggerText: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  triggerSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },

  // Language row
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 14,
  },
  langRowActive: {
    backgroundColor: theme.colors.primary + '12',
  },
  langFlag: {
    fontSize: 24,
  },
  langText: {
    flex: 1,
  },
  langNative: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  langNativeActive: {
    color: theme.colors.primary,
  },
  langEnglish: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
});