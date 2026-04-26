import { View, Text, TextInput, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAppStore } from '@/store/useAppStore'
import { useOnboarding } from './_layout'

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

export default function IncomeScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()
  const { currency } = useAppStore()
  const { setMonthlyIncome } = useOnboarding()
  const [income, setIncome] = useState('')

  const handleContinue = () => {
    setMonthlyIncome(parseFloat(income) || 0)
    router.push('/(onboarding)/pyf')
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

            <ProgressBar step={1} total={4} />
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 8, marginBottom: 36 }}>
              Βήμα 1 από 4
            </Text>

            <Text style={{ fontSize: 26, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 10 }}>
              Ποιο είναι το μηνιαίο εισόδημά σου;
            </Text>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 40 }}>
              Θα σε βοηθήσουμε να κατανείμεις σωστά τα χρήματά σου
            </Text>

            <View style={{
              backgroundColor: c.surface, borderRadius: 20, padding: 28,
              borderWidth: 1, borderColor: c.border, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 10 }}>
                Μηνιαίος μισθός
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 32, fontFamily: 'Inter_700Bold', color: c.textMuted }}>{currency}</Text>
                <TextInput
                  value={income}
                  onChangeText={setIncome}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={c.border}
                  style={{
                    fontSize: 48, fontFamily: 'Inter_700Bold', color: c.text,
                    minWidth: 120, textAlign: 'center',
                  }}
                />
              </View>
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
            <TouchableOpacity onPress={() => router.push('/(onboarding)/pyf')} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>Παράλειψη</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
