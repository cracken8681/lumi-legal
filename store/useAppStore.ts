import { create } from 'zustand';

export const formatAmount = (amount: number) =>
  amount.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Category =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'bills'
  | 'health'
  | 'other';

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
  emoji?: string;
  custom_name?: string;
}

interface AppState {
  language: 'el' | 'en';
  theme: 'light' | 'dark' | 'system';
  transactions: Transaction[];
  budgets: Budget[];
  currency: string;
  setLanguage: (lang: 'el' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  addTransaction: (t: Omit<Transaction, 'id'> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (category: string, limit: number) => void;
}

const defaultBudgets: Budget[] = [
  { category: 'food', limit: 300, spent: 0 },
  { category: 'transport', limit: 100, spent: 0 },
  { category: 'entertainment', limit: 80, spent: 0 },
  { category: 'shopping', limit: 150, spent: 0 },
  { category: 'bills', limit: 200, spent: 0 },
  { category: 'health', limit: 50, spent: 0 },
  { category: 'other', limit: 100, spent: 0 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'system',
      transactions: [],
      budgets: defaultBudgets,
      currency: '€',

      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),

      setTransactions: (transactions) => set({ transactions }),

      setBudgets: (budgets) => set({ budgets }),

      addTransaction: (t) =>
        set((state) => {
          const newTx: Transaction = { ...t, id: t.id ?? Date.now().toString() };
          const updatedBudgets = state.budgets.map((b) =>
            b.category === t.category ? { ...b, spent: b.spent + t.amount } : b
          );
          return {
            transactions: [newTx, ...state.transactions],
            budgets: updatedBudgets,
          };
        }),

      deleteTransaction: (id) =>
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          const updatedBudgets = tx
            ? state.budgets.map((b) =>
                b.category === tx.category
                  ? { ...b, spent: Math.max(0, b.spent - tx.amount) }
                  : b
              )
            : state.budgets;
          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            budgets: updatedBudgets,
          };
        }),

      updateBudget: (category, limit) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.category === category ? { ...b, limit } : b
          ),
        })),
    }),
    {
      name: 'lumi-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language, theme: state.theme }),
    }
  )
);
