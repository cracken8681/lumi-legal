import {
  View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';
import { useDeals } from '@/hooks/useDeals';

type Deal = {
  id: string;
  product_name: string;
  original_price: number;
  deal_price: number;
  discount_percent: number;
  emoji?: string;
  supermarket_id: string;
  supermarkets?: { name: string; lat?: number; lng?: number } | { name: string; lat?: number; lng?: number }[];
};

type Supermarket = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
};

function getSupermarketName(s: Deal['supermarkets']): string {
  if (!s) return '';
  if (Array.isArray(s)) return s[0]?.name ?? '';
  return s.name;
}

function DealCard({ deal, distance }: { deal: Deal; distance?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { currency } = useAppStore();

  return (
    <View style={{
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: 52, height: 52, borderRadius: 16,
          backgroundColor: c.surfaceSecondary,
          alignItems: 'center', justifyContent: 'center', marginRight: 14,
        }}>
          <Text style={{ fontSize: 26 }}>{deal.emoji ?? '🏷️'}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>
            {deal.product_name}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            {getSupermarketName(deal.supermarkets)}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.success }}>
              {currency}{Number(deal.deal_price).toFixed(2)}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, textDecorationLine: 'line-through' }}>
              {currency}{Number(deal.original_price).toFixed(2)}
            </Text>
            <View style={{
              backgroundColor: c.success + '20',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
              flexDirection: 'row', alignItems: 'center', gap: 2,
            }}>
              <Ionicons name="pricetag" size={10} color={c.success} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: c.success }}>
                -{deal.discount_percent}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {distance && (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 12, paddingTop: 12,
          borderTopWidth: 1, borderTopColor: c.border, gap: 4,
        }}>
          <Ionicons name="location-outline" size={12} color={c.textMuted} />
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted }}>
            {distance}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function DealsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { language } = useAppStore();
  const t = translations[language];
  const { fetchNearbyDeals, fetchAllDeals } = useDeals();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isNearby, setIsNearby] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const result = await fetchNearbyDeals();
      if (result.supermarkets.length > 0 && result.deals.length > 0) {
        setSupermarkets(result.supermarkets as Supermarket[]);
        setDeals(result.deals as Deal[]);
        setIsNearby(true);
      } else {
        setDeals(result.deals as Deal[]);
        setIsNearby(false);
      }
    } catch (e) {
      console.log('Deals error:', e);
      setDeals([]);
      setIsNearby(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const getDistanceLabel = (deal: Deal): string | undefined => {
    if (!isNearby) return undefined;
    const sm = supermarkets.find(s => s.id === deal.supermarket_id);
    if (!sm) return undefined;
    const m = Math.round(sm.distance * 1000);
    return m < 1000 ? `${m}μ` : `${(sm.distance).toFixed(1)}χλμ`;
  };

  const subtitle = isNearby
    ? `${supermarkets.length} supermarket${supermarkets.length !== 1 ? 's' : ''} κοντά σου`
    : t.nearbyDeals;

  const filteredDeals = deals.filter(d =>
    d.product_name.toLowerCase().includes(search.toLowerCase()) ||
    getSupermarketName(d.supermarkets).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
          {t.deals} 🏷️
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
          {isNearby ? subtitle : t.nearbyDeals}
        </Text>
      </View>

      {/* Search bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.surface, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
        marginHorizontal: 20, marginBottom: 12,
        borderWidth: 1, borderColor: c.border,
      }}>
        <Ionicons name="search-outline" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Αναζήτηση προσφοράς..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: c.text }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
        ) : filteredDeals.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏷️</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
              Δεν υπάρχουν προσφορές
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
              Έλεγξε ξανά αργότερα
            </Text>
          </View>
        ) : (
          <>
            {!isNearby && (
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 12 }}>
                Όλες οι προσφορές
              </Text>
            )}
            {filteredDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} distance={getDistanceLabel(deal)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
