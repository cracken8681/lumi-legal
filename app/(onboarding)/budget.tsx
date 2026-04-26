import { View, Text, TextInput, Pressable, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAppStore } from '@/store/useAppStore'
import { CATEGORIES } from '@/constants/categories'
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

export default function BudgetScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()
  const { currency } = useAppStore()
  const { setBudgetLimits } = useOnboarding()
  const [limits, setLimits] = useState<Record<string, string>>({})

  const categoryKeys = Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]

  const handleContinue = () => {
    const parsed: Record<string, number> = {}
    categoryKeys.forEach((key) => {
      const val = parseFloat(limits[key] ?? '')
      if (val > 0) parsed[key] = val
    })
    setBudgetLimits(parsed)
    router.push('/(onboarding)/ready')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24 }}>
            <View style={{ paddingTop: 16, marginBottom: 24 }}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
                <Ionicons name="chevron-back" size={24} color={c.text} />
              </Pressable>
            </View>

            <ProgressBar step={3} total={4} />
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 8, marginBottom: 36 }}>
              Βήμα 3 από 4
            </Text>

            <Text style={{ fontSize: 26, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 10 }}>
              🎯 Όρισε τον προϋπολογισμό σου
            </Text>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 32 }}>
              Πόσο θέλεις να ξοδεύεις ανά κατηγορία;
            </Text>

            <View style={{ gap: 10, marginBottom: 16 }}>
              {categoryKeys.map((key) => {
                const cat = CATEGORIES[key]
                return (
                  <View key={key} style={{
                    backgroundColor: c.surface, borderRadius: 16, padding: 16,
                    borderWidth: 1, borderColor: c.border,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: cat.color + '20',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: c.text }}>
                      {cat.label}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: c.textMuted }}>{currency}</Text>
                      <TextInput
                        value={limits[key] ?? ''}
                        onChangeText={(v) => setLimits((prev) => ({ ...prev, [key]: v }))}
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
                )
              })}
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
            <TouchableOpacity onPress={() => router.push('/(onboarding)/ready')} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>Παράλειψη</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
