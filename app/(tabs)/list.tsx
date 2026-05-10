import {
  View, Text, ScrollView, Pressable, TextInput,
  RefreshControl, ActivityIndicator, AppState, Alert,
  Modal, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useShoppingList, ShoppingItem } from '@/hooks/useShoppingList';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';
import { useTransactions } from '@/hooks/useTransactions';

export default function ShoppingListScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = LumiColors[scheme];
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ShoppingItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [inputText, setInputText] = useState('');
  const { fetchAll, fetchArchived, add, toggle, remove, updateQuantity, archiveChecked, unarchive } = useShoppingList();
  const { language, budgets, currency } = useAppStore();
  const t = translations[language];
  const { add: addExpense } = useTransactions();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expenseModalItem, setExpenseModalItem] = useState<ShoppingItem | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('food');
  const appStateRef = useRef(AppState.currentState);

  const loadItems = useCallback(async () => {
    const [active, archived] = await Promise.all([fetchAll(), fetchArchived()]);
    setItems(active);
    setArchivedItems(archived);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadItems().then(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        await archiveChecked();
      }
      if (nextState === 'active' && prev !== 'active') {
        await loadItems();
      }
    });
    return () => sub.remove();
  }, []);

  const addItem = async () => {
    if (!inputText.trim()) return;
    const newItem = await add(inputText.trim());
    if (newItem) setItems((prev) => [...prev, newItem]);
    setInputText('');
  };

  const EXPENSE_CATS = [
    { key: 'food', label: 'Τρόφιμα' },
    { key: 'shopping', label: 'Αγορές' },
    { key: 'health', label: 'Υγεία' },
    { key: 'other', label: 'Άλλο' },
  ];

  const foodBudget = budgets.find(b => b.category === 'food');
  const foodAvailable = foodBudget ? foodBudget.limit - foodBudget.spent : null;

  const showExpenseModal = (item: ShoppingItem) => {
    setExpenseModalItem(item);
    setExpenseAmount('');
    setExpenseCategory('food');
  };

  const toggleItem = async (id: string, currentChecked: boolean) => {
    const next = !currentChecked;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: next } : i)));
    await toggle(id, next);
    if (next) {
      const item = items.find(i => i.id === id);
      if (item) {
        Alert.alert(
          t.addToExpenseQuestion,
          t.addToExpenseMessage.replace('{name}', item.name),
          [
            { text: t.cancel, style: 'cancel' },
            { text: t.yes, onPress: () => showExpenseModal(item) },
          ]
        );
      }
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await remove(id);
  };

  const changeQuantity = async (id: string, current: number, delta: number) => {
    const next = Math.max(1, current + delta);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: next } : i)));
    await updateQuantity(id, next);
  };

  const handleClearChecked = () => {
    Alert.alert(
      t.clearList,
      t.clearListConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.clear, style: 'destructive',
          onPress: async () => { await archiveChecked(); await loadItems(); },
        },
      ]
    );
  };

  const handleShowArchived = () => {
    setShowArchived((prev) => !prev);
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const unchecked = filteredItems.filter((i) => !i.checked);
  const checked = filteredItems.filter((i) => i.checked);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <View>
          <Text style={{ fontSize: 32, fontFamily: 'Inter_700Bold', color: c.text, letterSpacing: -0.5 }}>
            {t.shoppingList} 🛒
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
            {items.length} {t.itemsCount} · {checked.length} {t.itemsDone}
          </Text>
        </View>
        {checked.length > 0 && (
          <Pressable onPress={handleClearChecked} hitSlop={8} style={{ marginTop: 4 }}>
            <Ionicons name="trash-outline" size={20} color={c.danger} />
          </Pressable>
        )}
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
          placeholder="Αναζήτηση..."
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: c.text }}
        />
      </View>

      {/* Add Item */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
        <TextInput
          placeholder={`${t.addItem}...`}
          placeholderTextColor={c.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={addItem}
          returnKeyType="done"
          style={{
            flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: 14,
            fontSize: 14, fontFamily: 'Inter_400Regular', color: c.text,
            borderWidth: 1, borderColor: c.border,
          }}
        />
        <Pressable
          onPress={addItem}
          style={{
            width: 50, height: 50, borderRadius: 14,
            backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      {foodAvailable !== null && (
        <View style={{
          marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10,
          borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: (foodAvailable > 20 ? c.success : c.danger) + '20',
        }}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: foodAvailable > 20 ? c.success : c.danger }}>
            🛒 {t.budgetAvailable}: {currency}{foodAvailable.toFixed(2)}
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, minHeight: '100%', paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🛒</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
                  {t.noListItems}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
                  {t.tapToAddItem}
                </Text>
              </View>
            ) : (
              <>
                {/* Unchecked items */}
                {unchecked.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleItem(item.id, item.checked)}
                    style={{
                      backgroundColor: c.surface, borderRadius: 14, padding: 14,
                      marginBottom: 8, borderWidth: 1, borderColor: c.border,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                    }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.primary }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text }}>
                        {item.name}
                        {(item.quantity ?? 1) > 1 && (
                          <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.primary }}>
                            {` ×${item.quantity}`}
                          </Text>
                        )}
                      </Text>
                    </View>
                    {/* Quantity controls */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Pressable
                        onPress={() => changeQuantity(item.id, item.quantity ?? 1, -1)}
                        hitSlop={6}
                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 15, color: c.primary, fontFamily: 'Inter_600SemiBold', lineHeight: 20 }}>−</Text>
                      </Pressable>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: c.text, minWidth: 16, textAlign: 'center' }}>
                        {item.quantity ?? 1}
                      </Text>
                      <Pressable
                        onPress={() => changeQuantity(item.id, item.quantity ?? 1, 1)}
                        hitSlop={6}
                        style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.surfaceSecondary, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text style={{ fontSize: 15, color: c.primary, fontFamily: 'Inter_600SemiBold', lineHeight: 20 }}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                    </Pressable>
                  </Pressable>
                ))}

                {/* Checked items */}
                {checked.length > 0 && (
                  <>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginTop: 8, marginBottom: 8 }}>
                      {t.purchasedItems} ({checked.length})
                    </Text>
                    {checked.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleItem(item.id, item.checked)}
                        style={{
                          backgroundColor: c.surfaceSecondary, borderRadius: 14, padding: 14,
                          marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12,
                        }}
                      >
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.success, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="checkmark" size={14} color="#FFF" />
                        </View>
                        <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, textDecorationLine: 'line-through' }}>
                          {item.name}
                          {(item.quantity ?? 1) > 1 && ` ×${item.quantity}`}
                        </Text>
                        <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                          <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                        </Pressable>
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Archived section */}
            <Pressable
              onPress={handleShowArchived}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 20, marginBottom: 8,
                paddingVertical: 8, paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: c.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {t.purchasedItems}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.primary }}>
                  {showArchived ? t.hide : t.showSection}
                </Text>
                <Ionicons name={showArchived ? 'chevron-up' : 'chevron-down'} size={14} color={c.primary} />
              </View>
            </Pressable>

            {showArchived && archivedItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => Alert.alert(
                  t.restoreItem,
                  t.restoreItemConfirm.replace('{name}', item.name),
                  [
                    { text: t.cancel, style: 'cancel' },
                    { text: t.restore, onPress: async () => { await unarchive(item.id); await loadItems(); } },
                  ]
                )}
                style={{
                  backgroundColor: c.surfaceSecondary, borderRadius: 14, padding: 14,
                  marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12,
                  opacity: 0.5,
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={14} color={c.textMuted} />
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, textDecorationLine: 'line-through' }}>
                  {item.name}
                  {(item.quantity ?? 1) > 1 && ` ×${item.quantity}`}
                </Text>
                <Ionicons name="refresh-outline" size={14} color={c.textMuted} />
              </Pressable>
            ))}

            {showArchived && archivedItems.length === 0 && (
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, textAlign: 'center', paddingVertical: 12 }}>
                {t.noArchivedItems}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Record expense modal */}
      <Modal
        visible={expenseModalItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setExpenseModalItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.text, marginBottom: 4 }}>
              {t.recordExpense}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: c.textMuted, marginBottom: 16 }}>
              {expenseModalItem?.name}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 6 }}>
              ΠΟΣΟ (€)
            </Text>
            <TextInput
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={c.textMuted}
              style={{
                backgroundColor: c.background, borderRadius: 12, padding: 14,
                fontSize: 24, fontFamily: 'Inter_600SemiBold', color: c.text,
                borderWidth: 1, borderColor: c.border, marginBottom: 16,
              }}
            />
            <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, marginBottom: 8 }}>
              ΚΑΤΗΓΟΡΙΑ
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {EXPENSE_CATS.map(cat => (
                <Pressable
                  key={cat.key}
                  onPress={() => setExpenseCategory(cat.key)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: expenseCategory === cat.key ? c.primary : c.surfaceSecondary,
                    borderWidth: 1, borderColor: expenseCategory === cat.key ? c.primary : c.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: expenseCategory === cat.key ? '#FFF' : c.textMuted }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setExpenseModalItem(null)}
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: c.textMuted }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const parsed = parseFloat(expenseAmount);
                  if (isNaN(parsed) || parsed <= 0) return;
                  await addExpense({
                    amount: parsed,
                    category: expenseCategory,
                    note: expenseModalItem?.name ?? '',
                    date: new Date().toISOString().slice(0, 10),
                  });
                  setExpenseModalItem(null);
                }}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>{t.submit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
