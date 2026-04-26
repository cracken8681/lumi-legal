import { View, Text, TextInput, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAppStore } from '@/store/useAppStore'
import { useOnboarding } from './_layout'

const PYF_ROWS = [
  { key: 'investment' as const, label: 'Επένδυση', emoji: '📈' },
  { key: 'savings' as const, label: 'Αποταμίευση', emoji: '🏦' },
  { key: 'goals' as const, label: 'Μελλοντικοί Στόχοι', emoji: '🎯' },
]

function ProgressBar({ step, total }: { step: number; total: number }) {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? c.primary : c.border }} />
      ))}
    </View>
  )
}

export default function PYFScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()
  const { currency } = useAppStore()
  const { setPyfAmounts } = useOnboarding()
  const [amounts, setAmounts] = useState({ investment: '', savings: '', goals: '' })

  const handleContinue = () => {
    setPyfAmounts({
      investment: parseFloat(amounts.investment) || 0,
      savings: parseFloat(amounts.savings) || 0,
      goals: parseFloat(amounts.goals) || 0,
    })
    router.push('/(onboarding)/budget')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <View style={{ paddingTop: 16, marginBottom: 24 }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
                <Ionicons name="chevron-back" size={24} color={c.text} />
              </Pressable>
            </View>

            <ProgressBar step={2} total={4} />
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 8, marginBottom: 36 }}>
              Βήμα 2 από 4
            </Text>

            <Text style={{ fontSize: 26, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 10 }}>
              💰 Πλήρωσε πρώτα τον εαυτό σου
            </Text>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 32 }}>
              Πόσο θέλεις να κρατάς κάθε μήνα;
            </Text>

            <View style={{ gap: 12 }}>
              {PYF_ROWS.map((row) => (
                <View key={row.key} style={{
                  backgroundColor: c.surface, borderRadius: 16, padding: 18,
                  borderWidth: 1, borderColor: c.border,
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                }}>
                  <Text style={{ fontSize: 24 }}>{row.emoji}</Text>
                  <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: c.text }}>
                    {row.label}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: c.textMuted }}>{currency}</Text>
                    <TextInput
                      value={amounts[row.key]}
                      onChangeText={(v) => setAmounts((prev) => ({ ...prev, [row.key]: v }))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={c.border}
                      style={{
                        fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text,
                        textAlign: 'right', minWidth: 72,
                        borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 2,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ padding: 24, paddingBottom: 40, gap: 8 }}>
            <Pressable
              onPress={handleContinue}
              style={{
                backgroundColor: c.primary, borderRadius: 16, padding: 18,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' }}>Συνέχεια</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </Pressable>
            <TouchableOpacity onPress={() => router.push('/(onboarding)/budget')} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>Παράλειψη</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
