import { View, Text, ScrollView, Pressable, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import { CATEGORIES } from '@/constants/categories';
import { Category } from '@/store/useAppStore';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { usePayYourselfFirst, PYFType } from '@/hooks/usePayYourselfFirst';
import { translations } from '@/constants/translations';

const PYF_ROWS: { type: PYFType; emoji: string }[] = [
  { type: 'investment', emoji: '📈' },
  { type: 'savings', emoji: '🏦' },
  { type: 'goals', emoji: '🎯' },
];

const EMOJI_OPTIONS = ['📈','💰','🏠','🚗','✈️','🎓','💊','🛒','🎮','🍕','☕','💪','🐶','👶','🎁','💡'];

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { budgets, currency, language } = useAppStore();
  const t = translations[language];
  const { fetchAll: fetchBudgets, upsert } = useBudgets();
  const { fetchAll: fetchTransactions } = useTransactions();
  const { fetchAll: fetchPYF, upsert: upsertPYF } = usePayYourselfFirst();

  const pyfLabel: Record<PYFType, string> = {
    investment: t.investment,
    savings: t.savings,
    goals: t.goals,
  };

  const [editingBudget, setEditingBudget] = useState<{ category: string; label: string; emoji: string; limit: number } | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📦');

  const [pyfData, setPyfData] = useState<{ type: string; amount: number }[]>([]);
  const [editingPYF, setEditingPYF] = useState<{ type: PYFType; label: string; emoji: string; amount: number } | null>(null);
  const [pyfAmount, setPyfAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        fetchTransactions();
        fetchBudgets();
        const pyfResult = await fetchPYF();
        setPyfData(pyfResult);
      };
      load();
    }, [])
  );

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const pyfTotal = pyfData.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRemaining = totalLimit - totalSpent - pyfTotal;
  const spentPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View>
            <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>Lumi 💡</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>April 2026</Text>
          </View>
          <Pressable style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ backgroundColor: c.primary, borderRadius: 24, padding: 24, shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{t.totalBudget}</Text>
            <Text style={{ fontSize: 42, fontFamily: 'Inter_700Bold', color: '#FFF', marginBottom: 16 }}>{currency}{totalRemaining.toFixed(0)}</Text>
            <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, marginBottom: 10 }}>
              <View style={{ height: 6, width: `${Math.min(spentPercent, 100)}%`, backgroundColor: '#FFF', borderRadius: 3 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t.spent}: {currency}{totalSpent.toFixed(0)}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t.remaining}: {currency}{totalLimit.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Pay Yourself First */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{
            backgroundColor: c.primary, borderRadius: 20, padding: 20,
            shadowColor: c.primary, shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
          }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF', marginBottom: 2 }}>
              💰 {t.payYourselfFirst}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              {t.payYourselfFirstSubtitle}
            </Text>
            {PYF_ROWS.map((row, index) => {
              const entry = pyfData.find((p) => p.type === row.type);
              const amount = entry ? Number(entry.amount) : 0;
              return (
                <View key={row.type}>
                  {index > 0 && (
                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 }} />
                  )}
                  <Pressable
                    onPress={() => {
                      setEditingPYF({ type: row.type, label: pyfLabel[row.type], emoji: row.emoji, amount });
                      setPyfAmount(amount > 0 ? String(amount) : '');
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: '#FFF' }}>
                      {row.emoji} {pyfLabel[row.type]}
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.success }}>
                      {currency}{amount.toFixed(2)}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: scoreColor + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: scoreColor }}>{lumiScore}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.lumiScore}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                {lumiScore >= 70 ? "Great! You're on track." : lumiScore >= 40 ? 'Watch your spending.' : 'Budget nearly reached.'}
              </Text>
            </View>
            <Ionicons name="trending-up" size={20} color={scoreColor} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 12 }}>{t.category}</Text>
          {budgets.map((budget) => {
            const knownCat = (CATEGORIES as Record<string, { label: string; emoji: string; color: string } | undefined>)[budget.category];
            const displayEmoji = knownCat?.emoji ?? budget.emoji ?? '📦';
            const displayLabel = knownCat?.label ?? budget.custom_name ?? budget.category;
            const displayColor = knownCat?.color ?? '#8B8FA8';
            const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
            const barColor = pct >= 90 ? c.danger : pct >= 70 ? c.warning : c.success;
            return (
              <Pressable
                key={budget.category}
                onPress={() => {
                  setEditingBudget({ category: budget.category, label: displayLabel, emoji: displayEmoji, limit: budget.limit });
                  setNewLimit(String(budget.limit));
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
                </View>
                <View style={{ height: 5, backgroundColor: c.border, borderRadius: 3 }}>
                  <View style={{ height: 5, width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3 }} />
                </View>
              </Pressable>
            );
          })}

          {/* Add new category button */}
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
              + New Category
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location-outline" size={22} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: c.text }}>{t.nearbyDeals}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Enable location to see deals near you</Text>
            </View>
          </View>
        </View>
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

      {/* Edit budget limit modal */}
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
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 4 }}>
              {editingBudget?.emoji} {editingBudget?.label}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 16 }}>
              Όριο προϋπολογισμού
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
                  await upsert(editingBudget.category, Number(newLimit));
                  await fetchBudgets();
                  setEditingBudget(null);
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#fff' }}>{t.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              New Category
            </Text>
            <TouchableOpacity onPress={() => setNewCatModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <TextInput
              placeholder="Category name (e.g. Investing)"
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
              placeholder={`Budget limit (${currency})`}
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
              Choose an emoji
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
    </SafeAreaView>
  );
}
