import { View, Text, ScrollView, Pressable, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore, formatAmount } from '@/store/useAppStore';
import { CATEGORIES } from '@/constants/categories';
import { Category } from '@/store/useAppStore';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { usePayYourselfFirst, PYFType } from '@/hooks/usePayYourselfFirst';
import { useRecurringExpenses, RecurringExpense } from '@/hooks/useRecurringExpenses';
import { translations } from '@/constants/translations';
import { supabase } from '@/lib/supabase';

const PYF_ROWS: { type: PYFType; emoji: string }[] = [
  { type: 'investment', emoji: '📈' },
  { type: 'savings', emoji: '🏦' },
  { type: 'goals', emoji: '🎯' },
];

const EMOJI_OPTIONS = ['📈','💰','🏠','🚗','✈️','🎓','💊','🛒','🎮','🍕','☕','💪','🐶','👶','🎁','💡'];

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = LumiColors[scheme];
  const router = useRouter();
  const { budgets, currency, language } = useAppStore();
  const t = translations[language];
  const { fetchAll: fetchBudgets, upsert, deleteCustomCategory } = useBudgets();
  const { fetchAll: fetchTransactions } = useTransactions();
  const { fetchAll: fetchPYF, upsert: upsertPYF } = usePayYourselfFirst();
  const { fetchAll: fetchRecurring } = useRecurringExpenses();

  const pyfLabel: Record<PYFType, string> = {
    investment: t.investment,
    savings: t.savings,
    goals: t.goals,
  };

  const [editingBudget, setEditingBudget] = useState<{ category: string; label: string; emoji: string; limit: number } | null>(null);
  const [newLimit, setNewLimit] = useState('');
  const [editCustomName, setEditCustomName] = useState('');
  const [editCustomEmoji, setEditCustomEmoji] = useState('📦');

  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');

  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [pyfData, setPyfData] = useState<{ type: string; amount: number }[]>([]);
  const [editingPYF, setEditingPYF] = useState<{ type: PYFType; label: string; emoji: string; amount: number } | null>(null);
  const [pyfAmount, setPyfAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [budgetEditModalVisible, setBudgetEditModalVisible] = useState(false);
  const [budgetEditAmount, setBudgetEditAmount] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchBudgets(),
      fetchPYF().then(setPyfData),
      fetchRecurring().then(setRecurring),
    ]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        await Promise.all([fetchTransactions(), fetchBudgets()]);
        const [pyfResult, recurringResult] = await Promise.all([fetchPYF(), fetchRecurring()]);
        setPyfData(pyfResult);
        setRecurring(recurringResult);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('monthly_income').eq('id', user.id).single();
          if (data?.monthly_income != null) setMonthlyIncome(Number(data.monthly_income));
        }
        setLoading(false);
      };
      load();
    }, [])
  );

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const pyfTotal = pyfData.reduce((sum, p) => sum + Number(p.amount), 0);
  const recurringTotal = recurring.reduce((s, e) => s + (e.amount ?? 0), 0);
  const recurringPaid = recurring.reduce((s, e) => s + (e.paid_amount ?? 0), 0);
  const pendingRecurring = recurringTotal - recurringPaid;
  const pendingItems = recurring.filter(e => !e.is_paid).sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99));
  const effectiveBudget = monthlyIncome ?? totalLimit;
  const totalRemaining = effectiveBudget - totalSpent - pyfTotal;
  const spentPercent = effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;
  const lumiScore = Math.max(0, Math.round(100 - spentPercent));
  const scoreColor = lumiScore >= 70 ? c.success : lumiScore >= 40 ? c.warning : c.danger;

  const handleSaveNewCategory = async () => {
    if (!newCatName.trim() || !newCatLimit) return;
    const key = newCatName.toLowerCase().trim().replace(/\s+/g, '_');
    await upsert(key, Number(newCatLimit), newCatEmoji, newCatName.trim());
    await fetchBudgets();
    setNewCatModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 28, fontFamily: 'Inter_700Bold', color: c.text, letterSpacing: -1 }}>Lumi</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 3, letterSpacing: 0.5 }}>
              {new Date().toLocaleDateString(language === 'el' ? 'el-GR' : 'en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={17} color={c.textMuted} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
        ) : <>

        {/* Budget card */}
        <Animated.View entering={FadeInUp.delay(0).duration(600)} style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <Pressable
            onPress={() => {
              setBudgetEditAmount(monthlyIncome != null ? String(monthlyIncome) : '');
              setBudgetEditModalVisible(true);
            }}
            style={{
              backgroundColor: scheme === 'dark' ? '#0F1928' : '#1A3A6B',
              borderRadius: 24, padding: 28,
              borderWidth: 1,
              borderColor: scheme === 'dark' ? 'rgba(201,135,42,0.3)' : 'rgba(201,135,42,0.4)',
              shadowColor: '#C9872A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t.totalBudget}</Text>
              <Ionicons name="pencil-outline" size={14} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={{ fontSize: 52, fontFamily: 'Inter_700Bold', color: '#F0B429', marginBottom: 20, letterSpacing: -1 }}>{currency}{totalRemaining.toFixed(0)}</Text>
            <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 12 }}>
              <View style={{ height: 3, width: `${Math.min(spentPercent, 100)}%`, backgroundColor: '#F0B429', borderRadius: 2 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter_400Regular' }}>{t.spent}  {currency}{totalSpent.toFixed(0)}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter_400Regular' }}>{t.remaining}  {currency}{effectiveBudget.toFixed(0)}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Pay Yourself First */}
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <View style={{
            backgroundColor: c.surface, borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: c.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.gold + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ fontSize: 16 }}>💰</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.text }}>
                  {t.payYourselfFirst}
                </Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                  {t.payYourselfFirstSubtitle}
                </Text>
              </View>
            </View>
            {PYF_ROWS.map((row, index) => {
              const entry = pyfData.find((p) => p.type === row.type);
              const amount = entry ? Number(entry.amount) : 0;
              return (
                <View key={row.type}>
                  {index > 0 && (
                    <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
                  )}
                  <Pressable
                    onPress={() => {
                      setEditingPYF({ type: row.type, label: pyfLabel[row.type], emoji: row.emoji, amount });
                      setPyfAmount(amount > 0 ? String(amount) : '');
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.text }}>
                      {row.emoji} {pyfLabel[row.type]}
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.gold }}>
                      {currency}{formatAmount(amount)}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Recurring Expenses */}
        {recurring.length > 0 && (
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.danger + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Ionicons name="calendar-outline" size={18} color={c.danger} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.recurringExpenses}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.primary }}>{t.viewAll}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: pendingItems.length > 0 ? 14 : 0 }}>
              <View style={{ flex: 1, backgroundColor: c.danger + '15', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: c.danger, fontFamily: 'Inter_500Medium', marginBottom: 2 }}>{t.pending}</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.danger }}>{currency}{pendingRecurring.toFixed(2)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: c.success + '15', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: c.success, fontFamily: 'Inter_500Medium', marginBottom: 2 }}>{t.paid}</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.success }}>{currency}{recurringPaid.toFixed(2)}</Text>
              </View>
            </View>

            {pendingItems.slice(0, 3).map((exp) => (
              <View key={exp.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: c.border }}>
                <Ionicons name="alert-circle-outline" size={14} color={c.danger} style={{ marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: c.text }}>{exp.name}</Text>
                {exp.due_day != null && (
                  <Text style={{ fontSize: 12, color: c.textMuted, marginRight: 8 }}>στις {exp.due_day}</Text>
                )}
                <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: c.danger }}>{currency}{(exp.amount ?? 0).toFixed(2)}</Text>
              </View>
            ))}

            {pendingItems.length === 0 && (
              <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: c.success, fontFamily: 'Inter_500Medium' }}>{t.allPaid}</Text>
              </View>
            )}
          </View>
        </Animated.View>
        )}

        {/* Lumi Score */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: scoreColor + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: scoreColor }}>{lumiScore}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.lumiScore}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                {lumiScore >= 70 ? t.lumiScoreOnTrack : lumiScore >= 40 ? t.lumiScoreWatch : t.lumiScoreBudget}
              </Text>
            </View>
            <Ionicons name="trending-up" size={20} color={scoreColor} />
          </View>
        </Animated.View>

        {/* Budget Categories */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 12 }}>{t.category}</Text>
          {budgets.map((budget) => {
            const knownCat = (CATEGORIES as Record<string, { label: string; emoji: string; color: string } | undefined>)[budget.category];
            const displayEmoji = knownCat?.emoji ?? budget.emoji ?? '📦';
            const displayLabel = knownCat?.label ?? budget.custom_name ?? budget.category;
            const displayColor = knownCat?.color ?? '#8B8FA8';
            const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
            const barColor = pct >= 90 ? c.danger : pct >= 70 ? c.warning : c.success;
            const isCustom = !knownCat;
            return (
              <Pressable
                key={budget.category}
                onPress={() => {
                  setEditingBudget({ category: budget.category, label: displayLabel, emoji: displayEmoji, limit: budget.limit });
                  setNewLimit(String(budget.limit));
                  if (isCustom) {
                    setEditCustomName(displayLabel);
                    setEditCustomEmoji(displayEmoji);
                  }
                }}
                style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: c.border }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: displayColor + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ fontSize: 16 }}>{displayEmoji}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: c.text }}>{displayLabel}</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: c.text, marginRight: 8 }}>{currency}{budget.spent} / {currency}{budget.limit}</Text>
                  <Ionicons name="pencil-outline" size={14} color={c.textMuted} />
                  {isCustom && (
                    <Pressable
                      hitSlop={8}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          t.deleteCategory,
                          t.deleteCategoryConfirm,
                          [
                            { text: t.cancel, style: 'cancel' },
                            {
                              text: t.delete,
                              style: 'destructive',
                              onPress: async () => {
                                await deleteCustomCategory(budget.category);
                                await fetchBudgets();
                              },
                            },
                          ]
                        );
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={c.danger} />
                    </Pressable>
                  )}
                </View>
                <View style={{ height: 5, backgroundColor: c.border, borderRadius: 3 }}>
                  <View style={{ height: 5, width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3 }} />
                </View>
              </Pressable>
            );
          })}

          <TouchableOpacity
            onPress={() => {
              setNewCatName('');
              setNewCatLimit('');
              setNewCatEmoji('📦');
              setNewCatModalVisible(true);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14, borderRadius: 16,
              borderWidth: 1, borderColor: c.border,
              backgroundColor: c.surface, marginTop: 4,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={c.primary} />
            <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.primary }}>
              + {t.newCategory}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location-outline" size={22} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.nearbyDeals}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{t.enableLocation}</Text>
            </View>
          </View>
        </View>
        </>}
      </ScrollView>

      {/* Edit PYF modal */}
      <Modal
        visible={editingPYF !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingPYF(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 4 }}>
              {editingPYF?.emoji} {editingPYF?.label}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 16 }}>
              {t.monthlyAmount}
            </Text>
            <TextInput
              value={pyfAmount}
              onChangeText={setPyfAmount}
              keyboardType="decimal-pad"
              placeholder="π.χ. 200"
              placeholderTextColor={c.textMuted}
              style={{
                backgroundColor: c.background,
                borderRadius: 12, padding: 14,
                fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border, marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingPYF(null)}
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.textMuted }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!editingPYF) return;
                  const parsed = parseFloat(pyfAmount);
                  if (isNaN(parsed) || parsed < 0) return;
                  await upsertPYF(editingPYF.type, parsed);
                  const updated = await fetchPYF();
                  setPyfData(updated);
                  setEditingPYF(null);
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#fff' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit budget category limit modal */}
      <Modal
        visible={editingBudget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingBudget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          {(() => {
            const isEditingCustom = editingBudget ? !(editingBudget.category in CATEGORIES) : false;
            return (
              <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 24, width: '90%' }}>
                <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 16 }}>
                  {editCustomEmoji} {isEditingCustom ? editCustomName || editingBudget?.label : editingBudget?.label}
                </Text>

                {isEditingCustom && (
                  <>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginBottom: 6 }}>
                      {t.categoryName}
                    </Text>
                    <TextInput
                      value={editCustomName}
                      onChangeText={setEditCustomName}
                      placeholder={t.categoryName}
                      placeholderTextColor={c.textMuted}
                      style={{
                        backgroundColor: c.background,
                        borderRadius: 12, padding: 14,
                        fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                        borderWidth: 1, borderColor: c.border, marginBottom: 12,
                      }}
                    />
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginBottom: 8 }}>
                      Emoji
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {EMOJI_OPTIONS.map((em) => (
                        <Pressable
                          key={em}
                          onPress={() => setEditCustomEmoji(em)}
                          style={{
                            width: 44, height: 44, borderRadius: 12,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: editCustomEmoji === em ? c.primary + '20' : c.background,
                            borderWidth: 2, borderColor: editCustomEmoji === em ? c.primary : c.border,
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>{em}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginBottom: 6 }}>
                  {t.budgetLimitPlaceholder}
                </Text>
                <TextInput
                  value={newLimit}
                  onChangeText={setNewLimit}
                  keyboardType="numeric"
                  placeholder="π.χ. 300"
                  placeholderTextColor={c.textMuted}
                  style={{
                    backgroundColor: c.background,
                    borderRadius: 12, padding: 14,
                    fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text,
                    borderWidth: 1, borderColor: c.border, marginBottom: 16,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setEditingBudget(null)}
                    style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.textMuted }}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!editingBudget || !newLimit) return;
                      await upsert(
                        editingBudget.category,
                        Number(newLimit),
                        isEditingCustom ? editCustomEmoji : undefined,
                        isEditingCustom ? (editCustomName.trim() || undefined) : undefined,
                      );
                      await fetchBudgets();
                      setEditingBudget(null);
                    }}
                    style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#fff' }}>{t.save}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </KeyboardAvoidingView>
      </Modal>

      {/* New category modal */}
      <Modal
        visible={newCatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNewCatModalVisible(false)}
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
              {t.newCategory}
            </Text>
            <TouchableOpacity onPress={() => setNewCatModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <TextInput
              placeholder={t.categoryNamePlaceholder}
              placeholderTextColor={c.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 16, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            <TextInput
              placeholder={`${t.budgetLimitPlaceholder} (${currency})`}
              placeholderTextColor={c.textMuted}
              keyboardType="decimal-pad"
              value={newCatLimit}
              onChangeText={setNewCatLimit}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 22, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted }}>
              {t.chooseEmoji}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {EMOJI_OPTIONS.map((em) => {
                const selected = newCatEmoji === em;
                return (
                  <Pressable
                    key={em}
                    onPress={() => setNewCatEmoji(em)}
                    style={{
                      width: 52, height: 52, borderRadius: 14,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selected ? c.primary + '20' : c.surface,
                      borderWidth: 2, borderColor: selected ? c.primary : c.border,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{em}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleSaveNewCategory}
              style={{
                backgroundColor: c.primary, borderRadius: 14, padding: 16,
                alignItems: 'center', marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                {t.save}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Monthly budget edit modal */}
      <Modal
        visible={budgetEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 4 }}>
              {t.editBudget}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginBottom: 12 }}>
              {t.monthlyBudgetLabel}
            </Text>
            <TextInput
              value={budgetEditAmount}
              onChangeText={setBudgetEditAmount}
              keyboardType="decimal-pad"
              placeholder="π.χ. 1500"
              placeholderTextColor={c.textMuted}
              style={{
                backgroundColor: c.background,
                borderRadius: 12, padding: 14,
                fontSize: 18, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border, marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setBudgetEditModalVisible(false)}
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.textMuted }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const parsed = parseFloat(budgetEditAmount);
                  if (isNaN(parsed) || parsed <= 0) return;
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  await supabase.from('profiles').update({ monthly_income: parsed }).eq('id', user.id);
                  setMonthlyIncome(parsed);
                  setBudgetEditModalVisible(false);
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#fff' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
