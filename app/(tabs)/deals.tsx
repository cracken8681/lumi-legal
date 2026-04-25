import { View, Text, ScrollView, useColorScheme, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LumiColors } from '@/constants/LumiColors';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';

const SAMPLE_DEALS = [
  { id: '1', store: 'Σκλαβενίτης', product: 'Γάλα 1L x6', original: 5.90, deal: 3.99, discount: 32, category: 'food', emoji: '🥛', distance: '320m' },
  { id: '2', store: 'AB Βασιλόπουλος', product: 'Ελαιόλαδο 1L', original: 8.50, deal: 5.99, discount: 29, category: 'food', emoji: '🫒', distance: '480m' },
  { id: '3', store: 'Lidl', product: 'Ψωμί Τοστ', original: 1.89, deal: 0.99, discount: 47, category: 'food', emoji: '🍞', distance: '150m' },
  { id: '4', store: 'My Market', product: 'Κοτόπουλο 1kg', original: 5.20, deal: 3.49, discount: 33, category: 'food', emoji: '🍗', distance: '700m' },
  { id: '5', store: 'Masoutis', product: 'Τυρί Φέτα 400g', original: 4.10, deal: 2.79, discount: 32, category: 'food', emoji: '🧀', distance: '900m' },
];

export default function DealsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { language } = useAppStore();
  const t = translations[language];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
          {t.deals} 🏷️
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
          Best offers near you today
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {SAMPLE_DEALS.map((deal) => (
          <Pressable
            key={deal.id}
            style={{
              backgroundColor: c.surface,
              borderRadius: 20,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: c.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Text style={{ fontSize: 26 }}>{deal.emoji}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                  {deal.product}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                  {deal.store}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                  <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.success }}>
                    €{deal.deal}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, textDecorationLine: 'line-through' }}>
                    €{deal.original}
                  </Text>
                  <View
                    style={{
                      backgroundColor: c.success + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Ionicons name="pricetag" size={10} color={c.success} />
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: c.success }}>
                      -{deal.discount}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: c.border,
                gap: 4,
              }}
            >
              <Ionicons name="location-outline" size={12} color={c.textMuted} />
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted }}>
                {deal.distance} away
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
