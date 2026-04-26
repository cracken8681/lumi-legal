import { View, Text, ScrollView, useColorScheme, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { LumiColors, ThemeColors } from '@/constants/LumiColors';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';
import { supabase } from '@/lib/supabase';
import { useBiometrics } from '@/hooks/useBiometrics';

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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: c.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
}

function SwitchRow({ icon, label, subtitle, value, onValueChange, c }: SwitchRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: c.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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

  useEffect(() => {
    const load = async () => {
      const available = await isAvailable();
      setBiometricAvailable(available);
      if (available) {
        const enabled = await isBiometricsEnabled();
        setBiometricEnabledState(enabled);
      }
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
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: c.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text }}>
            Lumi User
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            Free Plan
          </Text>
        </View>

        {/* Settings Group */}
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
            <SettingRow
              icon={<Ionicons name="notifications-outline" size={18} color={c.warning} />}
              label={t.notifications}
              value="On"
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
              />
            )}
          </View>
        </View>

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
