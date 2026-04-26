import { View, Text, ScrollView, useColorScheme, Pressable, Switch, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { LumiColors, ThemeColors } from '@/constants/LumiColors';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';
import { supabase } from '@/lib/supabase';
import { useBiometrics } from '@/hooks/useBiometrics';
import { useNotificationSettings, NotificationSettings } from '@/hooks/useNotificationSettings';

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  c: ThemeColors;
}

function SettingRow({ icon, label, value, onPress, c }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: c.border, gap: 14,
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: c.surfaceSecondary,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
        {label}
      </Text>
      {value && (
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginRight: 4 }}>
          {value}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </Pressable>
  );
}

interface SwitchRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  c: ThemeColors;
  noBorder?: boolean;
}

function SwitchRow({ icon, label, subtitle, value, onValueChange, c, noBorder }: SwitchRowProps) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 16, paddingHorizontal: 16,
      borderBottomWidth: noBorder ? 0 : 1, borderBottomColor: c.border, gap: 14,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: c.surfaceSecondary,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: c.border, true: c.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { language, setLanguage } = useAppStore();
  const t = translations[language];

  const { isAvailable, authenticate, setBiometricsEnabled, isBiometricsEnabled } = useBiometrics();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);

  const { fetch: fetchSettings, save: saveSettings } = useNotificationSettings();
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    global_enabled: true,
    morning_time: '07:30',
    afternoon_time: '16:30',
    max_per_day: 2,
    store_exceptions: {},
  });
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const load = async () => {
      const available = await isAvailable();
      setBiometricAvailable(available);
      if (available) {
        const enabled = await isBiometricsEnabled();
        setBiometricEnabledState(enabled);
      }
      const settings = await fetchSettings();
      setNotifSettings(settings);
      const { data } = await supabase.from('supermarkets').select('id, name');
      setStores(data ?? []);
    };
    load();
  }, []);

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      const success = await authenticate();
      if (!success) return;
    }
    await setBiometricsEnabled(val);
    setBiometricEnabledState(val);
  };

  const handleSaveNotifSettings = async () => {
    setSavingNotif(true);
    await saveSettings(notifSettings);
    setSavingNotif(false);
  };

  const updateStoreException = (name: string, val: boolean) => {
    setNotifSettings(prev => ({
      ...prev,
      store_exceptions: { ...prev.store_exceptions, [name]: val },
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
          <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
            {t.profile}
          </Text>
        </View>

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: c.primary + '20',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text }}>
            Lumi User
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            Free Plan
          </Text>
        </View>

        {/* Preferences */}
        <View style={{ marginHorizontal: 20 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Preferences
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
            <SettingRow
              icon={<Ionicons name="globe-outline" size={18} color={c.primary} />}
              label={t.language}
              value={language === 'el' ? t.greek : t.english}
              onPress={() => setLanguage(language === 'el' ? 'en' : 'el')}
              c={c}
            />
            {biometricAvailable && (
              <SwitchRow
                icon={<Ionicons name="scan-outline" size={18} color={c.primary} />}
                label="Κλείδωμα με Face ID"
                subtitle="Απαιτεί Face ID για να ανοίξει το app"
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                c={c}
                noBorder
              />
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Ειδοποιήσεις Κουπονιών
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
            {/* Global toggle */}
            <SwitchRow
              icon={<Ionicons name="notifications-outline" size={18} color={c.warning} />}
              label="Ειδοποιήσεις"
              value={notifSettings.global_enabled}
              onValueChange={val => setNotifSettings(prev => ({ ...prev, global_enabled: val }))}
              c={c}
            />

            {/* Morning time */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: c.border, gap: 14,
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sunny-outline" size={18} color={c.warning} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
                Πρωινό παράθυρο
              </Text>
              <TextInput
                value={notifSettings.morning_time}
                onChangeText={v => setNotifSettings(prev => ({ ...prev, morning_time: v }))}
                placeholder="07:30"
                placeholderTextColor={c.textMuted}
                style={{
                  fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.primary,
                  backgroundColor: c.surfaceSecondary, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, textAlign: 'center',
                }}
              />
            </View>

            {/* Afternoon time */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12, paddingHorizontal: 16,
              borderBottomWidth: 1, borderBottomColor: c.border, gap: 14,
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="partly-sunny-outline" size={18} color={c.warning} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
                Απογευματινό παράθυρο
              </Text>
              <TextInput
                value={notifSettings.afternoon_time}
                onChangeText={v => setNotifSettings(prev => ({ ...prev, afternoon_time: v }))}
                placeholder="16:30"
                placeholderTextColor={c.textMuted}
                style={{
                  fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.primary,
                  backgroundColor: c.surfaceSecondary, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, textAlign: 'center',
                }}
              />
            </View>

            {/* Max per day */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12, paddingHorizontal: 16,
              borderBottomWidth: stores.length > 0 ? 1 : 0, borderBottomColor: c.border, gap: 14,
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="repeat-outline" size={18} color={c.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
                Max ειδοποιήσεις/ημέρα
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable
                  onPress={() => setNotifSettings(prev => ({ ...prev, max_per_day: Math.max(1, prev.max_per_day - 1) }))}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 18, color: c.primary, fontFamily: 'Inter_600SemiBold' }}>−</Text>
                </Pressable>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.text, minWidth: 20, textAlign: 'center' }}>
                  {notifSettings.max_per_day}
                </Text>
                <Pressable
                  onPress={() => setNotifSettings(prev => ({ ...prev, max_per_day: Math.min(5, prev.max_per_day + 1) }))}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 18, color: c.primary, fontFamily: 'Inter_600SemiBold' }}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Store exceptions */}
            {stores.map((store, index) => (
              <SwitchRow
                key={store.id}
                icon={<Text style={{ fontSize: 18 }}>🏪</Text>}
                label={store.name}
                value={notifSettings.store_exceptions[store.name] !== false}
                onValueChange={val => updateStoreException(store.name, val)}
                c={c}
                noBorder={index === stores.length - 1}
              />
            ))}
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSaveNotifSettings}
            style={{
              backgroundColor: c.primary, borderRadius: 14, padding: 14,
              alignItems: 'center', marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
              {savingNotif ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Account
          </Text>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
            <SettingRow
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={c.success} />}
              label={t.privacy}
              c={c}
            />
            <SettingRow
              icon={<Ionicons name="log-out-outline" size={18} color={c.danger} />}
              label={t.signOut}
              onPress={async () => { await supabase.auth.signOut() }}
              c={c}
            />
          </View>
        </View>

        <Text style={{ textAlign: 'center', marginTop: 32, fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted }}>
          Lumi v1.0.0 · Made with 💡
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
