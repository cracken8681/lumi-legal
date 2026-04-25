import { View, Text, ScrollView, useColorScheme, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';

interface ListItem {
  id: string;
  name: string;
  checked: boolean;
}

export default function ShoppingListScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const [items, setItems] = useState<ListItem[]>([]);
  const [inputText, setInputText] = useState('');
  const { fetchAll, add, toggle, remove } = useShoppingList();
  const { language } = useAppStore();
  const t = translations[language];

  useFocusEffect(
    useCallback(() => {
      fetchAll().then(setItems);
    }, [])
  );

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

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
          {t.shoppingList} 🛒
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
          {items.length} items · {checked.length} done
        </Text>
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
            flex: 1,
            backgroundColor: c.surface,
            borderRadius: 14,
            padding: 14,
            fontSize: 14,
            fontFamily: 'Inter_400Regular',
            color: c.text,
            borderWidth: 1,
            borderColor: c.border,
          }}
        />
        <Pressable
          onPress={addItem}
          style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🛒</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
              Your list is empty
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
              Add items above
            </Text>
          </View>
        ) : (
          <>
            {unchecked.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id, item.checked)}
                style={{
                  backgroundColor: c.surface,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: c.primary,
                  }}
                />
                <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text, flex: 1 }}>
                  {item.name}
                </Text>
                <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={c.textMuted} />
                </Pressable>
              </Pressable>
            ))}

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
                      backgroundColor: c.surfaceSecondary,
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: c.success,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                    <Text style={{ fontSize: 15, fontFamily: 'Inter_400Regular', color: c.textMuted, flex: 1, textDecorationLine: 'line-through' }}>
                      {item.name}
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
      </ScrollView>
    </SafeAreaView>
  );
}
