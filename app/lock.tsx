import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import { useBiometrics } from '@/hooks/useBiometrics'
import { supabase } from '@/lib/supabase'

export default function LockScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()
  const { authenticate } = useBiometrics()

  const handleAuth = async () => {
    const success = await authenticate()
    if (success) {
      router.replace('/(tabs)')
    }
  }

  useEffect(() => {
    const timer = setTimeout(handleAuth, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{
          fontSize: 40, fontFamily: 'Inter_700Bold', color: c.primary,
          marginBottom: 8,
        }}>
          Lumi
        </Text>

        <Text style={{
          fontSize: 22, fontFamily: 'Inter_600SemiBold', color: c.text,
          marginBottom: 48, textAlign: 'center',
        }}>
          Καλώς ήρθες πίσω 👋
        </Text>

        <Pressable
          onPress={handleAuth}
          style={{ alignItems: 'center', gap: 16 }}
        >
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: c.primary + '15',
            borderWidth: 2, borderColor: c.primary + '40',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="scan-outline" size={64} color={c.primary} />
          </View>
          <Text style={{
            fontSize: 16, fontFamily: 'Inter_500Medium', color: c.textMuted,
          }}>
            Άγγιξε για Face ID
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingBottom: 40, alignItems: 'center' }}>
        <Pressable
          onPress={async () => { await supabase.auth.signOut() }}
          style={{ paddingVertical: 12, paddingHorizontal: 24 }}
        >
          <Text style={{
            fontSize: 14, fontFamily: 'Inter_400Regular', color: c.danger,
          }}>
            Αποσύνδεση
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
