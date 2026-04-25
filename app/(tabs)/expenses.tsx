import {
  View, Text, ScrollView, useColorScheme, Pressable, TextInput,
  Modal, KeyboardAvoidingView, Platform, TouchableOpacity,
  Animated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LumiColors } from '@/constants/LumiColors';
import { useAppStore, Category, Transaction } from '@/store/useAppStore';
import { CATEGORIES } from '@/constants/categories';
import { useTransactions } from '@/hooks/useTransactions';
import { translations } from '@/constants/translations';

// ── Swipeable row ──────────────────────────────────────────────
function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const THRESHOLD = -80;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(Math.max(dx, THRESHOLD - 8));
      },
      onPanResponderRelease: (_, { dx }) => {
        Animated.spring(translateX, {
          toValue: dx < THRESHOLD / 2 ? THRESHOLD : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const close = () =>
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Delete button revealed on swipe */}
      <View
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          backgroundColor: '#FF4757', borderRadius: 16,
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        <Pressable onPress={() => { close(); onDelete(); }} style={{ alignItems: 'center' }}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 3 }}>Διαγραφή</Text>
        </Pressable>
      </View>
      {/* Row content slides left */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────
export default function ExpensesScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { transactions, currency, language } = useAppStore();
  const t = translations[language];
  const { fetchAll, add, update, remove } = useTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('food');

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setEditingTransaction(null);
    setAmount('');
    setNote('');
    setSelectedCategory('food');
    setModalVisible(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(String(tx.amount));
    setNote(tx.note);
    setSelectedCategory(tx.category);
    setModalVisible(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    if (editingTransaction) {
      await update(editingTransaction.id, {
        amount: parsed,
        category: selectedCategory,
        note: note || CATEGORIES[selectedCategory].label,
      });
    } else {
      await add({
        amount: parsed,
        category: selectedCategory,
        note: note || CATEGORIES[selectedCategory].label,
        date: new Date().toISOString(),
      });
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: c.text }}>
          {t.expenses}
        </Text>
        <Pressable
          onPress={openAdd}
          style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Transactions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
      >
        {transactions.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: c.text }}>
              {t.noExpenses}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 4 }}>
              Tap + to add your first expense
            </Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const cat = CATEGORIES[tx.category];
            return (
              <SwipeableRow key={tx.id} onDelete={() => remove(tx.id)}>
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
                    backgroundColor: cat.color + '20',
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: c.text }}>
                      {tx.note}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: c.textMuted, marginTop: 2 }}>
                      {cat.label} · {new Date(tx.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.text }}>
                    -{currency}{Number(tx.amount).toFixed(2)}
                  </Text>
                </Pressable>
              </SwipeableRow>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Modal — native bottom sheet */}
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
          {/* Modal header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: c.border,
          }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: c.text }}>
              {editingTransaction ? 'Επεξεργασία' : t.addExpense}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {/* Amount */}
            <TextInput
              placeholder={`${t.amount} (€)`}
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

            {/* Note */}
            <TextInput
              placeholder={`${t.note} (optional)`}
              placeholderTextColor={c.textMuted}
              value={note}
              onChangeText={setNote}
              style={{
                backgroundColor: c.surface, borderRadius: 14, padding: 16,
                fontSize: 15, fontFamily: 'Inter_400Regular', color: c.text,
                borderWidth: 1, borderColor: c.border,
              }}
            />

            {/* Category selector */}
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: c.textMuted, marginTop: 4 }}>
              {t.category}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
                const info = CATEGORIES[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isSelected ? c.primary : c.surface,
                      borderWidth: 1, borderColor: isSelected ? c.primary : c.border,
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 6 }}>{info.emoji}</Text>
                    <Text style={{
                      fontSize: 13, fontFamily: 'Inter_500Medium',
                      color: isSelected ? '#FFF' : c.text,
                    }}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: c.primary, borderRadius: 14, padding: 16,
                alignItems: 'center', marginTop: 8,
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
