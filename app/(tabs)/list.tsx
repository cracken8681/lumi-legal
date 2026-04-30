import {
  View, Text, ScrollView, useColorScheme, Pressable, TextInput,
  RefreshControl, ActivityIndicator, AppState, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useShoppingList, ShoppingItem } from '@/hooks/useShoppingList';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';

export default function ShoppingListScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ShoppingItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [inputText, setInputText] = useState('');
  const { fetchAll, fetchArchived, add, toggle, remove, updateQuantity, archiveChecked, unarchive } = useShoppingList();
  const { language } = useAppStore();
  const t = translations[language];
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const toggleItem = async (id: string, currentChecked: boolean) => {
    const next = !currentChecked;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: next } : i)));
    await toggle(id, next);
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
      'Καθαρισμός λίστας',
      'Θέλεις να αφαιρέσεις όλα τα αγορασμένα προϊόντα;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Καθαρισμός', style: 'destructive',
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
          <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
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
                      Done ({checked.length})
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
                Αγορασμένα
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.primary }}>
                  {showArchived ? 'Απόκρυψη' : 'Εμφάνιση'}
                </Text>
                <Ionicons name={showArchived ? 'chevron-up' : 'chevron-down'} size={14} color={c.primary} />
              </View>
            </Pressable>

            {showArchived && archivedItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => Alert.alert(
                  'Επαναφορά προϊόντος',
                  `Θέλεις να επαναφέρεις "${item.name}" στη λίστα;`,
                  [
                    { text: 'Άκυρο', style: 'cancel' },
                    { text: 'Επαναφορά', onPress: async () => { await unarchive(item.id); await loadItems(); } },
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
                Δεν υπάρχουν αγορασμένα προϊόντα
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
