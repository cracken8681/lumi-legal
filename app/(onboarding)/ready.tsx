import { View, Text, Pressable, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import { useAppStore } from '@/store/useAppStore'
import { useOnboarding } from './_layout'
import { useProfile } from '@/hooks/useProfile'
import { usePayYourselfFirst } from '@/hooks/usePayYourselfFirst'
import { useBudgets } from '@/hooks/useBudgets'

export default function ReadyScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()
  const { currency } = useAppStore()
  const { monthlyIncome, pyfAmounts, budgetLimits } = useOnboarding()
  const { completeOnboarding } = useProfile()
  const { upsert: upsertPYF } = usePayYourselfFirst()
  const { upsert: upsertBudget } = useBudgets()
  const [saving, setSaving] = useState(false)

  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 60,
    }).start()
  }, [])

  const pyfTotal = pyfAmounts.investment + pyfAmounts.savings + pyfAmounts.goals
  const budgetTotal = Object.values(budgetLimits).reduce((sum, v) => sum + v, 0)
  const isEmpty = monthlyIncome === 0 && pyfTotal === 0 && budgetTotal === 0

  const handleFinish = async () => {
    setSaving(true)
    await completeOnboarding(monthlyIncome)
    if (pyfAmounts.investment > 0) await upsertPYF('investment', pyfAmounts.investment)
    if (pyfAmounts.savings > 0) await upsertPYF('savings', pyfAmounts.savings)
    if (pyfAmounts.goals > 0) await upsertPYF('goals', pyfAmounts.goals)
    for (const [category, limit] of Object.entries(budgetLimits)) {
      if (limit > 0) await upsertBudget(category, limit)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale }], marginBottom: 32 }}>
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            backgroundColor: c.success + '20',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="checkmark-circle" size={64} color={c.success} />
          </View>
        </Animated.View>

        <Text style={{
          fontSize: 32, fontFamily: 'Inter_700Bold', color: c.text,
          textAlign: 'center', marginBottom: 12,
        }}>
          Είσαι έτοιμος!
        </Text>
        <Text style={{
          fontSize: 16, fontFamily: 'Inter_400Regular', color: c.textMuted,
          textAlign: 'center', marginBottom: 48,
        }}>
          Το Lumi είναι έτοιμο να σε βοηθήσει
        </Text>

        <View style={{
          width: '100%', backgroundColor: c.surface, borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: c.border, gap: 16,
        }}>
          {isEmpty ? (
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: c.textMuted, textAlign: 'center' }}>
              Μπορείς να ρυθμίσεις τα πάντα από την εφαρμογή.
            </Text>
          ) : (
            <>
              {monthlyIncome > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>💵 Μηνιαίο εισόδημα</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.text }}>{currency}{monthlyIncome.toFixed(0)}</Text>
                </View>
              )}
              {pyfTotal > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>💰 Pay Yourself First</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.success }}>{currency}{pyfTotal.toFixed(0)}/μήνα</Text>
                </View>
              )}
              {budgetTotal > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.textMuted }}>🎯 Συνολικός Προϋπολογισμός</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.primary }}>{currency}{budgetTotal.toFixed(0)}/μήνα</Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Pressable
          onPress={handleFinish}
          disabled={saving}
          style={{
            backgroundColor: saving ? c.textMuted : c.primary,
            borderRadius: 16, padding: 18,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFF' }}>
            {saving ? 'Αποθήκευση...' : 'Πάμε! 🚀'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
