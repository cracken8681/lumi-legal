import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'

const BULLETS = [
  'Παρακολούθησε τα έξοδά σου',
  'Επένδυσε στον εαυτό σου πρώτα',
  'Πέτυχε τους οικονομικούς σου στόχους',
]

export default function WelcomeScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.primary }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 80, marginBottom: 24 }}>💡</Text>
        <Text style={{
          fontSize: 32, fontFamily: 'Inter_700Bold', color: '#FFF',
          textAlign: 'center', marginBottom: 12,
        }}>
          Καλώς ήρθες στο Lumi
        </Text>
        <Text style={{
          fontSize: 16, fontFamily: 'Inter_400Regular',
          color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 56,
        }}>
          Το προσωπικό σου χρηματοοικονομικό βοηθό
        </Text>

        <View style={{ width: '100%', gap: 20, marginBottom: 0 }}>
          {BULLETS.map((bullet, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </View>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: '#FFF', flex: 1 }}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Pressable
          onPress={() => router.push('/(onboarding)/income')}
          style={{
            backgroundColor: '#FFF', borderRadius: 16, padding: 18,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: c.primary }}>
            Ξεκινάμε
          </Text>
          <Ionicons name="arrow-forward" size={20} color={c.primary} />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
