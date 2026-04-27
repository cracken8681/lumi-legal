import {
  View, Text, ScrollView, Pressable, TextInput,
  Modal, KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
  Animated as RNAnimated, PanResponder, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore, formatAmount } from '@/store/useAppStore';
import { useInvestments } from '@/hooks/useInvestments';
import { translations } from '@/constants/translations';
import { AssetsChart } from '@/components/AssetsChart';

type Investment = {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  investment_returns: { id: string; investment_id: string; amount: number; note: string; created_at: string }[];
};

// ── Swipeable row ──────────────────────────────────────────────
function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const { language } = useAppStore();
  const t = translations[language];
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
          useNativeDriver: true,
          friction: 2,
          tension: 40,
        }).start();
      },
    })
  ).current;

  const close = () =>
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 2, tension: 40 }).start();

  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          backgroundColor: '#FF4757', borderRadius: 16,
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Pressable onPress={() => { close(); onDelete(); }} style={{ alignItems: 'center' }}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 3 }}>{t.delete}</Text>
        </Pressable>
      </View>
      <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </RNAnimated.View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function AssetsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { currency, language } = useAppStore();
  const t = translations[language];
  const { fetchAll, add, addReturn, updateReturn, remove, removeReturn } = useInvestments();

  const [investments, setInvestments] = useState<Investment[]>([]);

  // Add Investment modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [investName, setInvestName] = useState('');
  const [investAmount, setInvestAmount] = useState('');

  // Add Return modal
  const [returnModalTarget, setReturnModalTarget] = useState<Investment | null>(null);
  const [returnAmount, setReturnAmount] = useState('');
  const [returnNote, setReturnNote] = useState('');

  // Edit Return modal
  const [editingReturn, setEditingReturn] = useState<{ id: string; investment_id: string; amount: string; note: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await fetchAll();
    setInvestments(data as Investment[]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const cardScale = useSharedValue(0.95);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  }, []);

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalReturns = investments.reduce(
    (sum, inv) => sum + (inv.investment_returns?.reduce((s, r) => s + Number(r.amount), 0) ?? 0),
    0
  );
  const total = totalInvested + totalReturns;
  const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : '0.0';
  const roiPositive = totalReturns >= 0;

  const handleAddInvestment = async () => {
    const parsed = parseFloat(investAmount);
    if (!investName.trim() || !parsed || parsed <= 0) return;
    await add(investName.trim(), parsed);
    setInvestName('');
    setInvestAmount('');
    setAddModalVisible(false);
    load();
  };

  const handleAddReturn = async () => {
    if (!returnModalTarget) return;
    const parsed = parseFloat(returnAmount);
    if (isNaN(parsed)) return;
    await addReturn(returnModalTarget.id, parsed, returnNote.trim());
    setReturnAmount('');
    setReturnNote('');
    setReturnModalTarget(null);
    load();
  };

  const handleSaveEditReturn = async () => {
    if (!editingReturn) return;
    const parsed = parseFloat(editingReturn.amount);
    if (isNaN(parsed)) return;
    if (parsed === 0) {
      const returnId = editingReturn.id
      setEditingReturn(null)
      Alert.alert(
        'Μηδενική τιμή',
        'Θέλεις να διαγράψεις αυτή την κίνηση;',
        [
          { text: 'Άκυρο', style: 'cancel' },
          {
            text: 'Διαγραφή',
            style: 'destructive',
            onPress: async () => {
              const success = await removeReturn(returnId)
              if (success) {
                const updated = await fetchAll()
                setInvestments(updated as Investment[])
              }
            },
          },
        ]
      )
      return
    }
    await updateReturn(editingReturn.id, parsed, editingReturn.note.trim());
    setEditingReturn(null);
    load();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
            {t.assets}
          </Text>
          <Ionicons name="trending-up" size={22} color={c.success} />
        </View>
        <Pressable
          onPress={() => setAddModalVisible(true)}
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20, paddingTop: 4 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        {/* Summary card */}
        <ReAnimated.View style={[cardStyle, { marginBottom: 20 }]}>
        <View style={{
          backgroundColor: c.primary, borderRadius: 24, padding: 24,
          shadowColor: c.primary, shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Left: Total Invested + ROI */}
            <View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                {t.totalInvested}
              </Text>
              <Text style={{ fontSize: 28, fontFamily: 'Inter_700Bold', color: '#FFF' }}>
                {currency}{formatAmount(totalInvested)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Ionicons
                  name={roiPositive ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={roiPositive ? c.success : c.danger}
                />
                <Text style={{
                  fontSize: 13, fontFamily: 'Inter_600SemiBold',
                  color: roiPositive ? c.success : c.danger,
                }}>
                  {roiPositive ? '+' : ''}{roi}% ROI
                </Text>
              </View>
            </View>

            {/* Right: Total (invested + returns) */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                Total
              </Text>
              <Text style={{
                fontSize: 28, fontFamily: 'Inter_700Bold',
                color: total > totalInvested ? c.success : '#FFF',
              }}>
                {currency}{formatAmount(total)}
              </Text>
            </View>
          </View>
        </View>
        </ReAnimated.View>

        {/* Chart */}
        {investments.length > 0 && (
          <AssetsChart investments={investments} />
        )}

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: c.surface, borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 10,
          marginBottom: 12,
          borderWidth: 1, borderColor: c.border,
        }}>
          <Ionicons name="search-outline" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Αναζήτηση επενδύσεων..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: c.text }}
          />
        </View>

        {/* Investment list */}
        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
        ) : investments.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="trending-up" size={48} color={c.textMuted} style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
              {t.noAssets}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
              {t.tapToAddInvestment}
            </Text>
          </View>
        ) : investments.filter(inv =>
            inv.name.toLowerCase().includes(search.toLowerCase())
          ).map((inv) => {
            const invReturns = inv.investment_returns.reduce((s, r) => s + Number(r.amount), 0);
            const invRoi = inv.amount > 0 ? ((invReturns / Number(inv.amount)) * 100).toFixed(1) : '0.0';
            const positive = invReturns >= 0;

            return (
              <SwipeableRow key={inv.id} onDelete={() => {
                Alert.alert(
                  'Διαγραφή',
                  'Θέλεις σίγουρα να διαγράψεις αυτή την κίνηση;',
                  [
                    { text: 'Άκυρο', style: 'cancel' },
                    { text: 'Διαγραφή', style: 'destructive', onPress: () => { remove(inv.id); load(); } },
                  ]
                );
              }}>
                <View style={{
                  backgroundColor: c.surface, borderRadius: 16,
                  borderWidth: 1, borderColor: c.border, overflow: 'hidden',
                }}>
                  {/* Main row */}
                  <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: c.success + '20',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    }}>
                      <Ionicons name="trending-up" size={20} color={c.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                        {inv.name}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                        {t.totalInvested}: {currency}{formatAmount(Number(inv.amount))}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{
                        fontSize: 15, fontFamily: 'Inter_700Bold',
                        color: positive ? c.success : c.danger,
                      }}>
                        {positive ? '+' : ''}{currency}{formatAmount(invReturns)}
                      </Text>
                      <Text style={{
                        fontSize: 11, fontFamily: 'Inter_500Medium',
                        color: positive ? c.success : c.danger, marginTop: 2,
                      }}>
                        {positive ? '+' : ''}{invRoi}%
                      </Text>
                    </View>
                  </View>

                  {/* Returns list */}
                  {inv.investment_returns.length > 0 && (
                    <View style={{
                      borderTopWidth: 1, borderTopColor: c.border,
                      paddingHorizontal: 16, paddingVertical: 8,
                    }}>
                      {inv.investment_returns.map((r) => (
                        <View key={r.id} style={{
                          flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'space-between', paddingVertical: 4,
                        }}>
                          <Text style={{ flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted }}>
                            {r.note || 'Return'} · {new Date(r.created_at).toLocaleDateString()}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: Number(r.amount) >= 0 ? c.success : c.danger }}>
                              {Number(r.amount) >= 0 ? '+' : ''}{currency}{formatAmount(Number(r.amount))}
                            </Text>
                            <Pressable
                              onPress={() => setEditingReturn({ id: r.id, investment_id: r.investment_id, amount: String(r.amount), note: r.note })}
                              hitSlop={8}
                            >
                              <Ionicons name="pencil-outline" size={13} color={c.textMuted} />
                            </Pressable>
                            <Pressable
                              onPress={() => Alert.alert(
                                'Διαγραφή',
                                'Θέλεις σίγουρα να διαγράψεις αυτή την κίνηση;',
                                [
                                  { text: 'Άκυρο', style: 'cancel' },
                                  {
                                    text: 'Διαγραφή', style: 'destructive',
                                    onPress: async () => {
                                      const success = await removeReturn(r.id)
                                      if (success) {
                                        const updated = await fetchAll()
                                        setInvestments(updated as Investment[])
                                      }
                                    },
                                  },
                                ]
                              )}
                              hitSlop={8}
                            >
                              <Ionicons name="trash-outline" size={13} color={c.danger} />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Add return button */}
                  <Pressable
                    onPress={() => {
                      setReturnModalTarget(inv);
                      setReturnAmount('');
                      setReturnNote('');
                    }}
                    style={{
                      borderTopWidth: 1, borderTopColor: c.border,
                      paddingVertical: 10, alignItems: 'center', flexDirection: 'row',
                      justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={c.primary} />
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.primary }}>
                      {t.addReturn}
                    </Text>
                  </Pressable>
                </View>
              </SwipeableRow>
            );
          })}
      </ScrollView>

      {/* Add Investment Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
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
              {t.addInvestment}
            </Text>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20, gap: 12 }}>
            <TextInput
              placeholder={t.investmentName}
              placeholderTextColor={c.textMuted}
              value={investName}
              onChangeText={setInvestName}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 16, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <TextInput
              placeholder={`${t.amount} (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={investAmount}
              onChangeText={setInvestAmount}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <TouchableOpacity
              onPress={handleAddInvestment}
              style={{
                backgroundColor: c.primary, borderRadius: 14, padding: 16,
                alignItems: 'center', marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Return Modal */}
      <Modal
        visible={returnModalTarget !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReturnModalTarget(null)}
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
            <View>
              <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.text }}>
                {t.addReturn}
              </Text>
              {returnModalTarget && (
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                  {returnModalTarget.name}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setReturnModalTarget(null)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20, gap: 12 }}>
            <TextInput
              placeholder={`${t.amount} (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={returnAmount}
              onChangeText={setReturnAmount}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <TextInput
              placeholder={t.returnNote}
              placeholderTextColor={c.textMuted}
              value={returnNote}
              onChangeText={setReturnNote}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <TouchableOpacity
              onPress={handleAddReturn}
              style={{
                backgroundColor: c.primary, borderRadius: 14, padding: 16,
                alignItems: 'center', marginTop: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                {t.save}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Return Modal */}
      <Modal
        visible={editingReturn !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingReturn(null)}
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
              Edit Return
            </Text>
            <TouchableOpacity onPress={() => setEditingReturn(null)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20, gap: 12 }}>
            <TextInput
              placeholder={`${t.amount} (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={editingReturn?.amount ?? ''}
              onChangeText={(v) => setEditingReturn((prev) => prev ? { ...prev, amount: v } : null)}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <TextInput
              placeholder={t.returnNote}
              placeholderTextColor={c.textMuted}
              value={editingReturn?.note ?? ''}
              onChangeText={(v) => setEditingReturn((prev) => prev ? { ...prev, note: v } : null)}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setEditingReturn(null)}
                style={{
                  flex: 1, padding: 16, borderRadius: 14,
                  borderWidth: 1, borderColor: c.border, alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.textMuted }}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveEditReturn}
                style={{
                  flex: 1, backgroundColor: c.primary, borderRadius: 14,
                  padding: 16, alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                  {t.save}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
