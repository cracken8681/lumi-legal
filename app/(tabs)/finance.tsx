import {
  View, Text, ScrollView, Pressable, TextInput,
  Modal, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Switch,
  Animated as RNAnimated, PanResponder, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import ReAnimated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { LumiColors, ThemeColors } from '@/constants/LumiColors';
import { useAppStore, Category, Transaction, Budget, formatAmount } from '@/store/useAppStore';
import { CATEGORIES } from '@/constants/categories';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringExpenses, RecurringExpense } from '@/hooks/useRecurringExpenses';
import { translations } from '@/constants/translations';

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
        }).start();
      },
    })
  ).current;

  const close = () =>
    RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        backgroundColor: '#FF4757', borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
      }}>
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

// ── Category picker ────────────────────────────────────────────
function CategoryPicker({
  selected, onSelect, budgets, c,
}: {
  selected: string;
  onSelect: (cat: string) => void;
  budgets: Budget[];
  c: ThemeColors;
}) {
  const customCategories = budgets.filter(b => !(b.category in CATEGORIES));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
        const info = CATEGORIES[cat];
        const isSelected = selected === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
              backgroundColor: isSelected ? c.primary : c.surface,
              borderWidth: 1, borderColor: isSelected ? c.primary : c.border,
            }}
          >
            <Text style={{ fontSize: 15, marginRight: 5 }}>{info.emoji}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: isSelected ? '#FFF' : c.text }}>
              {info.label}
            </Text>
          </Pressable>
        );
      })}
      {customCategories.map((b: Budget) => {
        const isSelected = selected === b.category;
        return (
          <Pressable
            key={b.category}
            onPress={() => onSelect(b.category)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
              backgroundColor: isSelected ? c.primary : c.surface,
              borderWidth: 1, borderColor: isSelected ? c.primary : c.border,
            }}
          >
            <Text style={{ fontSize: 15, marginRight: 5 }}>{b.emoji ?? '📦'}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: isSelected ? '#FFF' : c.text }}>
              {b.custom_name ?? b.category}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function FinanceScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = LumiColors[scheme];
  const router = useRouter();
  const { transactions, budgets, currency, language } = useAppStore();
  const t = translations[language];
  const { fetchAll: fetchTransactions, add, update, remove } = useTransactions();
  const {
    fetchAll: fetchRecurring, add: addRecurring, update: updateRecurring,
    markPaid, remove: removeRecurring, checkAndResetMonth,
  } = useRecurringExpenses();

  // ── tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'recurring'>('transactions');

  // ── transactions
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('food');
  const customCategories = budgets.filter(b => !(b.category in CATEGORIES));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // ── recurring list
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringRefreshing, setRecurringRefreshing] = useState(false);

  // ── recurring add/edit modal
  const [recurringModal, setRecurringModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [rName, setRName] = useState('');
  const [rRfCode, setRRfCode] = useState('');
  const [rAmount, setRAmount] = useState('');
  const [rDueDay, setRDueDay] = useState('');
  const [rCategory, setRCategory] = useState('bills');
  const [rNotes, setRNotes] = useState('');
  const [rNotifyDays, setRNotifyDays] = useState('3');

  // ── pay modal (replaces Alert + category picker)
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payModalExp, setPayModalExp] = useState<RecurringExpense | null>(null);
  const [payModalAmount, setPayModalAmount] = useState('');
  const [payModalCategory, setPayModalCategory] = useState('bills');
  const [payModalAddToExpenses, setPayModalAddToExpenses] = useState(true);

  // ── transactions
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTransactions();
      setLoading(false);
    };
    init();
  }, []);

  // ── recurring
  const loadRecurring = useCallback(async () => {
    setRecurringLoading(true);
    const data = await fetchRecurring();
    await checkAndResetMonth(data);
    const refreshed = await fetchRecurring();
    setRecurring(refreshed);
    setRecurringLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    if (activeTab === 'recurring') loadRecurring();
  }, [activeTab, loadRecurring]));

  useEffect(() => {
    if (activeTab === 'recurring') loadRecurring();
  }, [activeTab]);

  const openAddRecurring = () => {
    setEditingRecurring(null);
    setRName(''); setRRfCode(''); setRAmount(''); setRDueDay('');
    setRCategory('bills'); setRNotes(''); setRNotifyDays('3');
    setRecurringModal(true);
  };

  const openEditRecurring = (exp: RecurringExpense) => {
    setEditingRecurring(exp);
    setRName(exp.name);
    setRRfCode(exp.rf_code ?? '');
    setRAmount(exp.amount != null ? String(exp.amount) : '');
    setRDueDay(exp.due_day != null ? String(exp.due_day) : '');
    setRCategory(exp.category);
    setRNotes(exp.notes ?? '');
    setRNotifyDays(String(exp.notify_days ?? 3));
    setRecurringModal(true);
  };

  const handleSaveRecurring = async () => {
    if (!rName.trim()) return;
    const payload = {
      name: rName.trim(),
      rf_code: rRfCode.trim() || undefined,
      amount: rAmount ? parseFloat(rAmount) : undefined,
      due_day: rDueDay ? parseInt(rDueDay) : undefined,
      category: rCategory,
      is_paid: editingRecurring?.is_paid ?? false,
      paid_month: editingRecurring?.paid_month,
      paid_amount: editingRecurring?.paid_amount ?? 0,
      notify_days: parseInt(rNotifyDays) || 3,
      notes: rNotes.trim() || undefined,
    };
    if (editingRecurring) {
      await updateRecurring(editingRecurring.id, payload);
    } else {
      await addRecurring(payload);
    }
    setRecurringModal(false);
    await loadRecurring();
  };

  const handleDeleteRecurring = async (id: string) => {
    Alert.alert(t.delete, t.deleteRecurring, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete, style: 'destructive',
        onPress: async () => {
          setRecurringModal(false);
          await removeRecurring(id);
          await loadRecurring();
        },
      },
    ]);
  };

  const handleCheckboxTap = (exp: RecurringExpense) => {
    if (exp.is_paid) return;
    setPayModalExp(exp);
    setPayModalAmount(exp.amount != null ? String(exp.amount) : '');
    setPayModalCategory(exp.category || 'bills');
    setPayModalAddToExpenses(true);
    setPayModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!payModalExp) return;
    const paidAmt = parseFloat(payModalAmount) || 0;
    const fullAmt = payModalExp.amount ?? 0;
    setPayModalVisible(false);
    await markPaid(payModalExp.id, payModalAddToExpenses, payModalCategory, paidAmt, fullAmt);
    await loadRecurring();
    setPayModalExp(null);
  };

  // ── transactions
  const openAdd = () => {
    setEditingTransaction(null);
    setAmount(''); setNote(''); setSelectedCategory('food');
    setModalVisible(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(String(tx.amount));
    setNote(tx.note);
    setSelectedCategory(tx.category);
    setModalVisible(true);
  };

  const getCatLabel = (cat: string) =>
    CATEGORIES[cat as Category]?.label ??
    budgets.find(b => b.category === cat)?.custom_name ??
    cat;

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    if (editingTransaction) {
      await update(editingTransaction.id, {
        amount: parsed,
        category: selectedCategory as Category,
        note: note || getCatLabel(selectedCategory),
      });
    } else {
      await add({
        amount: parsed,
        category: selectedCategory as Category,
        note: note || getCatLabel(selectedCategory),
        date: new Date().toISOString(),
      });
    }
    setModalVisible(false);
  };

  const filtered = transactions.filter(tx =>
    tx.note.toLowerCase().includes(search.toLowerCase()) ||
    tx.category.toLowerCase().includes(search.toLowerCase())
  );

  // ── recurring summary
  const totalRecurring = recurring.reduce((s, e) => s + (e.amount ?? 0), 0);
  const paidAmountTotal = recurring.reduce((s, e) => s + (e.paid_amount ?? 0), 0);
  const pendingRecurring = totalRecurring - paidAmountTotal;
  const todayDay = new Date().getDate();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <Text style={{ fontSize: 32, fontFamily: 'Inter_700Bold', color: c.text, letterSpacing: -0.5 }}>
          {language === 'el' ? 'Έξοδα' : 'Expenses'}
        </Text>
        <Pressable
          onPress={activeTab === 'transactions' ? openAdd : openAddRecurring}
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Sub-tab switcher */}
      <View style={{
        flexDirection: 'row', backgroundColor: c.surface,
        borderRadius: 14, padding: 4, marginHorizontal: 20, marginBottom: 12,
        borderWidth: 1, borderColor: c.border,
      }}>
        {([
          { key: 'transactions', label: t.transactions },
          { key: 'recurring', label: t.recurringExpenses },
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

      {/* ── TAB 1: TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: c.surface, borderRadius: 12,
            paddingHorizontal: 12, paddingVertical: 10,
            marginHorizontal: 20, marginBottom: 12,
            borderWidth: 1, borderColor: c.border,
          }}>
            <Ionicons name="search-outline" size={16} color={c.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder={t.searchExpenses}
              placeholderTextColor={c.textMuted}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: c.text }}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
            }
          >
            {loading ? (
              <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
            ) : transactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.noExpenses}</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>{t.tapToAddExpense}</Text>
              </View>
            ) : (
              filtered.map((tx, index) => {
                const cat = CATEGORIES[tx.category as Category];
                return (
                  <ReAnimated.View key={tx.id} entering={FadeInRight.delay(index * 40).duration(300)}>
                    <SwipeableRow onDelete={() => remove(tx.id)}>
                      <Pressable
                        onPress={() => openEdit(tx)}
                        style={{
                          backgroundColor: c.surface, borderRadius: 16, padding: 16,
                          borderWidth: 1, borderColor: c.border,
                          flexDirection: 'row', alignItems: 'center',
                        }}
                      >
                        <View style={{
                          width: 44, height: 44, borderRadius: 22,
                          backgroundColor: (cat?.color ?? '#8B8FA8') + '20',
                          alignItems: 'center', justifyContent: 'center', marginRight: 14,
                        }}>
                          <Text style={{ fontSize: 20 }}>{cat?.emoji ?? '📦'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.text }}>{tx.note}</Text>
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                            {cat?.label ?? tx.category} · {new Date(tx.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.text }}>
                          -{currency}{formatAmount(Number(tx.amount))}
                        </Text>
                      </Pressable>
                    </SwipeableRow>
                  </ReAnimated.View>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* ── TAB 2: RECURRING EXPENSES ── */}
      {activeTab === 'recurring' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={recurringRefreshing}
              onRefresh={async () => { setRecurringRefreshing(true); await loadRecurring(); setRecurringRefreshing(false); }}
              tintColor={c.primary} colors={[c.primary]}
            />
          }
        >
          {recurringLoading ? (
            <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
          ) : recurring.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💳</Text>
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                {t.noRecurring}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4, textAlign: 'center' }}>
                {t.noRecurringSub}
              </Text>
            </View>
          ) : (
            <>
              {/* Summary card */}
              <View style={{
                backgroundColor: c.surface, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: c.border, marginBottom: 16,
              }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 10 }}>
                  {t.totalRecurring}: {currency}{formatAmount(totalRecurring)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1, backgroundColor: c.danger + '15', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: c.danger, marginBottom: 2 }}>{t.pending}</Text>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.danger }}>
                      {currency}{formatAmount(pendingRecurring)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: c.success + '15', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: c.success, marginBottom: 2 }}>{t.paid}</Text>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.success }}>
                      {currency}{formatAmount(paidAmountTotal)}
                    </Text>
                  </View>
                </View>
              </View>

              {recurring.map((exp) => {
                const isPartial = !exp.is_paid && (exp.paid_amount ?? 0) > 0;
                const isDue = !exp.is_paid && !isPartial && exp.due_day != null && exp.due_day - todayDay <= 3 && exp.due_day - todayDay >= 0;
                const cardBorderColor = exp.is_paid ? c.success : isPartial ? c.warning : isDue ? c.danger : c.border;
                const cat = CATEGORIES[exp.category as Category];
                const remaining = (exp.amount ?? 0) - (exp.paid_amount ?? 0);

                return (
                  <SwipeableRow key={exp.id} onDelete={() => handleDeleteRecurring(exp.id)}>
                    <Pressable
                      onPress={() => openEditRecurring(exp)}
                      style={{
                        backgroundColor: c.surface, borderRadius: 16, padding: 14,
                        borderWidth: 1.5, borderColor: cardBorderColor,
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                      }}
                    >
                      {/* Checkbox */}
                      <Pressable
                        onPress={() => handleCheckboxTap(exp)}
                        hitSlop={8}
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          borderWidth: 2,
                          borderColor: exp.is_paid ? c.success : isPartial ? c.warning : c.border,
                          backgroundColor: exp.is_paid ? c.success : isPartial ? c.warning + '30' : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {exp.is_paid && <Ionicons name="checkmark" size={16} color="#FFF" />}
                        {isPartial && <Text style={{ fontSize: 10, color: c.warning, fontFamily: 'Inter_700Bold' }}>~</Text>}
                      </Pressable>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14, fontFamily: 'Inter_600SemiBold',
                          color: exp.is_paid ? c.textMuted : c.text,
                          textDecorationLine: exp.is_paid ? 'line-through' : 'none',
                        }}>
                          {exp.name}
                        </Text>
                        {exp.rf_code ? (
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 1 }}>
                            RF: {exp.rf_code}
                          </Text>
                        ) : null}
                        {exp.notes ? (
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 1 }}>
                            {exp.notes}
                          </Text>
                        ) : null}
                        {isPartial && (
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: c.warning, marginTop: 2 }}>
                            Πληρώθηκε {currency}{formatAmount(exp.paid_amount ?? 0)} από {currency}{formatAmount(exp.amount ?? 0)}
                          </Text>
                        )}
                        <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                          {cat?.emoji ?? '📦'} {cat?.label ?? exp.category}
                        </Text>
                      </View>

                      {/* Amount + due */}
                      <View style={{ alignItems: 'flex-end' }}>
                        {exp.amount != null && (
                          <Text style={{
                            fontSize: 15, fontFamily: 'Inter_700Bold',
                            color: exp.is_paid ? c.success : isPartial ? c.warning : c.text,
                            textDecorationLine: exp.is_paid ? 'line-through' : 'none',
                          }}>
                            {currency}{formatAmount(exp.amount)}
                          </Text>
                        )}
                        {isPartial && (
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: c.danger, marginTop: 2 }}>
                            Υπολείπεται {currency}{formatAmount(remaining)}
                          </Text>
                        )}
                        {exp.due_day != null && (
                          <Text style={{
                            fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2,
                            color: isDue && !exp.is_paid ? c.danger : c.textMuted,
                          }}>
                            {exp.due_day}η κάθε μήνα
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  </SwipeableRow>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Add/Edit Transaction Modal ── */}
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
              {editingTransaction ? t.editExpense : t.addExpense}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>ΠΟΣΟ (€)</Text>
              <TextInput
                placeholder="π.χ. 25.00"
                placeholderTextColor={c.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>ΠΕΡΙΓΡΑΦΗ</Text>
              <TextInput
                placeholder={`${t.note} ${t.optional}`}
                placeholderTextColor={c.textMuted}
                value={note}
                onChangeText={setNote}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginTop: 4 }}>
              {t.category}
            </Text>
            <CategoryPicker selected={selectedCategory} onSelect={setSelectedCategory} budgets={budgets} c={c} />
            <TouchableOpacity
              onPress={handleSave}
              style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>{t.save}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add/Edit Recurring Modal ── */}
      <Modal
        visible={recurringModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRecurringModal(false)}
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
              {editingRecurring ? t.editRecurring : t.newRecurring}
            </Text>
            <TouchableOpacity onPress={() => setRecurringModal(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>{t.obligationName}</Text>
              <TextInput
                placeholder="π.χ. ΔΕΗ, Cosmote..."
                placeholderTextColor={c.textMuted}
                value={rName}
                onChangeText={setRName}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 16, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>{t.rfCode}</Text>
              <TextInput
                placeholder="π.χ. RF123456789 (προαιρετικό)"
                placeholderTextColor={c.textMuted}
                value={rRfCode}
                onChangeText={setRRfCode}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>ΠΟΣΟ (€)</Text>
              <TextInput
                placeholder="π.χ. 50.00"
                placeholderTextColor={c.textMuted}
                keyboardType="decimal-pad"
                value={rAmount}
                onChangeText={setRAmount}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 22, fontFamily: 'Inter_600SemiBold', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>{t.paymentDay}</Text>
              <TextInput
                placeholder="π.χ. 15"
                placeholderTextColor={c.textMuted}
                keyboardType="number-pad"
                value={rDueDay}
                onChangeText={setRDueDay}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted }}>
              {t.defaultExpenseCat}
            </Text>
            <CategoryPicker selected={rCategory} onSelect={setRCategory} budgets={budgets} c={c} />
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>ΣΗΜΕΙΩΣΕΙΣ</Text>
              <TextInput
                placeholder="π.χ. Τιμολόγιο Φεβρουαρίου (προαιρετικό)"
                placeholderTextColor={c.textMuted}
                value={rNotes}
                onChangeText={setRNotes}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 4, marginLeft: 4 }}>{t.notifyDaysBefore}</Text>
              <TextInput
                placeholder="π.χ. 3"
                placeholderTextColor={c.textMuted}
                keyboardType="number-pad"
                value={rNotifyDays}
                onChangeText={setRNotifyDays}
                style={{
                  backgroundColor: c.surface, borderRadius: 14, padding: 16,
                  fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                  borderWidth: 1, borderColor: c.border,
                }}
              />
            </View>
            <TouchableOpacity
              onPress={handleSaveRecurring}
              style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>{t.save}</Text>
            </TouchableOpacity>
            {editingRecurring && (
              <TouchableOpacity
                onPress={() => handleDeleteRecurring(editingRecurring.id)}
                style={{ borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: c.danger }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.danger }}>{t.delete}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Pay Modal ── */}
      <Modal
        visible={payModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPayModalVisible(false)}
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
                {t.markAsPaid}
              </Text>
              {payModalExp && (
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                  {payModalExp.name} · Πλήρες: {currency}{formatAmount(payModalExp.amount ?? 0)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setPayModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* Amount input */}
            <TextInput
              placeholder={`Ποσό (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={payModalAmount}
              onChangeText={setPayModalAmount}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 28, fontFamily: 'Inter_700Bold', color: c.primary,
                borderWidth: 1.5, borderColor: c.primary, textAlign: 'center',
              }}
            />

            {/* Add to expenses toggle */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: c.surface, borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: c.border,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                  {t.addToExpenses}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                  {t.addToTransactions}
                </Text>
              </View>
              <Switch
                value={payModalAddToExpenses}
                onValueChange={setPayModalAddToExpenses}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#FFF"
              />
            </View>

            {/* Category picker (shown when add to expenses is on) */}
            {payModalAddToExpenses && (
              <>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted }}>
                  {t.category}
                </Text>
                <CategoryPicker selected={payModalCategory} onSelect={setPayModalCategory} budgets={budgets} c={c} />
              </>
            )}

            <TouchableOpacity
              onPress={handleConfirmPayment}
              style={{ backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                {t.confirmPayment}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
