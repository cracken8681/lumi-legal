import {
  View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator,
  TextInput, Modal, KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
  Animated as RNAnimated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';
import { useDeals } from '@/hooks/useDeals';
import { useCoupons, Coupon } from '@/hooks/useCoupons';

// ── Types ──────────────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────────────
function getSupermarketName(s: Deal['supermarkets']): string {
  if (!s) return '';
  if (Array.isArray(s)) return s[0]?.name ?? '';
  return s.name;
}

const toDisplayDate = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const toISODate = (display: string): string => {
  if (!display.trim()) return ''
  const parts = display.trim().split('/')
  if (parts.length !== 3) return ''
  let [d, m, y] = parts
  d = d.padStart(2, '0')
  m = m.padStart(2, '0')
  if (y.length <= 2) y = '20' + y.padStart(2, '0')
  else if (y.length === 3) y = '2' + y
  const iso = `${y}-${m}-${d}`
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  return iso
}

const CATEGORY_EMOJI: Record<string, string> = {
  supermarket: '🛒',
  fuel: '⛽',
  pharmacy: '💊',
  other: '🏪',
};

const CATEGORIES = [
  { key: 'supermarket', emoji: '🛒', label: 'Σούπερ Μάρκετ' },
  { key: 'fuel', emoji: '⛽', label: 'Καύσιμα' },
  { key: 'pharmacy', emoji: '💊', label: 'Φαρμακείο' },
  { key: 'other', emoji: '🏪', label: 'Άλλο' },
];

// ── Swipeable row ──────────────────────────────────────────────
function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(Math.max(dx, THRESHOLD - 8));
      },
      onPanResponderRelease: (_, { dx }) => {
        RNAnimated.spring(translateX, {
          toValue: dx < THRESHOLD / 2 ? THRESHOLD : 0,
          useNativeDriver: true, friction: 2, tension: 40,
        }).start();
      },
    })
  ).current;

  const close = () =>
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 2, tension: 40 }).start();

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        backgroundColor: '#FF4757', borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Pressable onPress={() => { close(); onDelete(); }} style={{ alignItems: 'center' }}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 3 }}>Διαγραφή</Text>
        </Pressable>
      </View>
      <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </RNAnimated.View>
    </View>
  );
}

// ── Deal Card ──────────────────────────────────────────────────
function DealCard({ deal, distance }: { deal: Deal; distance?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { currency } = useAppStore();

  return (
    <View style={{
      backgroundColor: c.surface, borderRadius: 20, padding: 18,
      marginBottom: 12, borderWidth: 1, borderColor: c.border,
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

// ── Coupon Card ────────────────────────────────────────────────
function CouponCard({
  coupon, onMarkUsed,
}: {
  coupon: Coupon;
  onMarkUsed: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];

  const emoji = CATEGORY_EMOJI[coupon.store_category] ?? '🏪';
  const valueColor = coupon.is_used ? c.textMuted : c.success;

  return (
    <Pressable
      onLongPress={() => Alert.alert(
        coupon.store_name,
        'Τι θέλεις να κάνεις;',
        [
          { text: 'Ακύρωση', style: 'cancel' },
          { text: 'Χρησιμοποιήθηκε', onPress: onMarkUsed },
        ]
      )}
      style={{
        backgroundColor: coupon.is_used ? c.surfaceSecondary : c.surface,
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: c.border,
        flexDirection: 'row', alignItems: 'center',
        opacity: coupon.is_used ? 0.6 : 1,
      }}
    >
      <View style={{
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: c.surfaceSecondary,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
      }}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>
          {coupon.store_name}
          {coupon.is_used && (
            <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textMuted }}> · Χρησιμοποιήθηκε</Text>
          )}
        </Text>
        {coupon.description ? (
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            {coupon.description}
          </Text>
        ) : null}
        {coupon.expires_at ? (
          <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            Λήξη: {toDisplayDate(coupon.expires_at)}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: valueColor }}>
        €{Number(coupon.value).toFixed(0)}
      </Text>
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────────────
export default function DealsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { language, currency } = useAppStore();
  const t = translations[language];
  const { fetchNearbyDeals } = useDeals();
  const { fetchAll: fetchCoupons, add: addCoupon, markUsed, remove: removeCoupon } = useCoupons();

  const [activeTab, setActiveTab] = useState<'deals' | 'coupons'>('deals');

  // Deals state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isNearby, setIsNearby] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealsRefreshing, setDealsRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Coupons state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponsRefreshing, setCouponsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStore, setNewStore] = useState('');
  const [newCategory, setNewCategory] = useState('supermarket');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  // Load deals
  const loadDeals = async () => {
    try {
      setDealsLoading(true);
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
      setDealsLoading(false);
    }
  };

  // Load coupons
  const loadCoupons = async () => {
    setCouponsLoading(true);
    const all = await fetchCoupons();
    const today = new Date().toISOString().slice(0, 10);
    const active = all.filter(c => !c.expires_at || c.expires_at >= today);
    setCoupons(active);
    setCouponsLoading(false);
  };

  useFocusEffect(useCallback(() => {
    loadDeals();
    loadCoupons();
  }, []));

  const getDistanceLabel = (deal: Deal): string | undefined => {
    if (!isNearby) return undefined;
    const sm = supermarkets.find(s => s.id === deal.supermarket_id);
    if (!sm) return undefined;
    const m = Math.round(sm.distance * 1000);
    return m < 1000 ? `${m}μ` : `${sm.distance.toFixed(1)}χλμ`;
  };

  const filteredDeals = deals.filter(d =>
    d.product_name.toLowerCase().includes(search.toLowerCase()) ||
    getSupermarketName(d.supermarkets).toLowerCase().includes(search.toLowerCase())
  );

  const resetModal = () => {
    setNewStore('');
    setNewCategory('supermarket');
    setNewValue('');
    setNewDesc('');
    setNewExpiry('');
    setModalVisible(false);
  };

  const saveCoupon = async (expiresAt?: string) => {
    await addCoupon({
      store_name: newStore.trim(),
      store_category: newCategory,
      value: parseFloat(newValue),
      description: newDesc.trim() || undefined,
      expires_at: expiresAt || undefined,
    });
    resetModal();
    loadCoupons();
  };

  const handleSaveCoupon = async () => {
    if (!newStore.trim()) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπλήρωσε το όνομα καταστήματος.')
      return
    }
    if (!newValue.trim() || isNaN(Number(newValue)) || Number(newValue) <= 0) {
      Alert.alert('Σφάλμα', 'Παρακαλώ συμπλήρωσε έγκυρη αξία κουπονιού.')
      return
    }
    if (!newExpiry.trim()) {
      Alert.alert(
        'Χωρίς ημερομηνία λήξης',
        'Δεν έχεις συμπληρώσει ημερομηνία λήξης. Θέλεις να καταχωρίσεις το κουπόνι χωρίς;',
        [
          { text: 'Ακύρωση', style: 'cancel' },
          { text: 'Καταχώριση', onPress: async () => { await saveCoupon(undefined) } },
        ]
      )
      return
    }

    const expiresAt = toISODate(newExpiry.trim())
    if (!expiresAt) {
      Alert.alert('Σφάλμα', 'Η ημερομηνία δεν είναι έγκυρη.\nΧρησιμοποίησε τη μορφή ΗΗ/ΜΜ/ΕΕΕΕ\nπ.χ. 25/12/2025')
      return
    }

    const expDate = new Date(expiresAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expDate < today) {
      Alert.alert(
        'Ημερομηνία λήξης στο παρελθόν',
        `Το κουπόνι έχει λήξει στις ${newExpiry}. Θέλεις να το καταχωρίσεις ούτως ή άλλως;`,
        [
          { text: 'Ακύρωση', style: 'cancel' },
          { text: 'Καταχώριση', onPress: () => saveCoupon(expiresAt) },
        ]
      )
      return
    }

    await saveCoupon(expiresAt)
  };

  const handleMarkUsed = async (id: string) => {
    await markUsed(id);
    loadCoupons();
  };

  const handleDeleteCoupon = async (id: string) => {
    Alert.alert(
      'Διαγραφή κουπονιού',
      'Θέλεις σίγουρα να διαγράψεις αυτό το κουπόνι;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            const success = await removeCoupon(id)
            if (success) {
              setCoupons(prev => prev.filter(c => c.id !== id))
            }
          },
        },
      ]
    )
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
          {t.deals} 🏷️
        </Text>
      </View>

      {/* Sub-tab switcher */}
      <View style={{
        flexDirection: 'row', backgroundColor: c.surface,
        borderRadius: 14, padding: 4, marginHorizontal: 20, marginBottom: 12,
        borderWidth: 1, borderColor: c.border,
      }}>
        {([
          { key: 'deals', label: 'Προσφορές' },
          { key: 'coupons', label: 'Κουπόνια μου' },
        ] as const).map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1, paddingVertical: 8, paddingHorizontal: 16,
              borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === tab.key ? c.primary : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 13, fontFamily: 'Inter_600SemiBold',
              color: activeTab === tab.key ? '#FFF' : c.textMuted,
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── DEALS TAB ── */}
      {activeTab === 'deals' && (
        <>
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
              <RefreshControl
                refreshing={dealsRefreshing}
                onRefresh={async () => { setDealsRefreshing(true); await loadDeals(); setDealsRefreshing(false); }}
                tintColor={c.primary} colors={[c.primary]}
              />
            }
          >
            {dealsLoading ? (
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
                {filteredDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} distance={getDistanceLabel(deal)} />
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}

      {/* ── COUPONS TAB ── */}
      {activeTab === 'coupons' && (
        <>
          {/* Coupons header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, marginBottom: 12,
          }}>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: c.textMuted }}>
              {coupons.filter(c => !c.is_used).length} ενεργά κουπόνια
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="add-circle-outline" size={20} color={c.primary} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.primary }}>
                Νέο
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={couponsRefreshing}
                onRefresh={async () => { setCouponsRefreshing(true); await loadCoupons(); setCouponsRefreshing(false); }}
                tintColor={c.primary} colors={[c.primary]}
              />
            }
          >
            {couponsLoading ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
            ) : coupons.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🎫</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                  Δεν έχεις κουπόνια ακόμα
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
                  Πρόσθεσε το πρώτο σου!
                </Text>
              </View>
            ) : (
              coupons.map(coupon => (
                <SwipeableRow
                  key={coupon.id}
                  onDelete={() => Alert.alert(
                    'Διαγραφή κουπονιού',
                    'Θέλεις σίγουρα να διαγράψεις αυτό το κουπόνι;',
                    [
                      { text: 'Άκυρο', style: 'cancel' },
                      {
                        text: 'Διαγραφή', style: 'destructive',
                        onPress: async () => {
                          await removeCoupon(coupon.id)
                          setCoupons(prev => prev.filter(c => c.id !== coupon.id))
                        },
                      },
                    ]
                  )}
                >
                  <CouponCard
                    coupon={coupon}
                    onMarkUsed={() => handleMarkUsed(coupon.id)}
                  />
                </SwipeableRow>
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* ── Add Coupon Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: c.background }}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: c.border,
          }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.text }}>
              Νέο Κουπόνι
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {/* Store name */}
            <TextInput
              placeholder="Κατάστημα (π.χ. Lidl)"
              placeholderTextColor={c.textMuted}
              value={newStore}
              onChangeText={setNewStore}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 16, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            {/* Category */}
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted }}>
              Κατηγορία
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.key}
                  onPress={() => setNewCategory(cat.key)}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: 10,
                    borderRadius: 12, borderWidth: 1.5,
                    borderColor: newCategory === cat.key ? c.primary : c.border,
                    backgroundColor: newCategory === cat.key ? c.primary + '15' : c.surface,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color: newCategory === cat.key ? c.primary : c.textMuted, marginTop: 2 }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Value */}
            <TextInput
              placeholder={`Αξία (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={newValue}
              onChangeText={setNewValue}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            {/* Description */}
            <TextInput
              placeholder="Περιγραφή (προαιρετικό)"
              placeholderTextColor={c.textMuted}
              value={newDesc}
              onChangeText={setNewDesc}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            {/* Expiry */}
            <TextInput
              placeholder="ΗΗ/ΜΜ/ΕΕΕΕ (προαιρετικό)"
              placeholderTextColor={c.textMuted}
              value={newExpiry}
              onChangeText={setNewExpiry}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            <TouchableOpacity
              onPress={handleSaveCoupon}
              style={{
                backgroundColor: c.primary, borderRadius: 14, padding: 16,
                alignItems: 'center', marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                Αποθήκευση
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
