import { supabase } from '@/lib/supabase'
import { useAppStore, Category } from '@/store/useAppStore'

export function useTransactions() {
  const { transactions, addTransaction, deleteTransaction, setTransactions } = useAppStore()

  const fetchAll = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    if (data) setTransactions(data)
  }

  const add = async (transaction: { amount: number; category: string; note: string; date: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select()
      .single()

    if (data) addTransaction(data)
  }

  const update = async (id: string, data: { amount: number; category: string; note: string }) => {
    const { transactions } = useAppStore.getState()
    useAppStore.setState({
      transactions: transactions.map((t) =>
        t.id === id ? { ...t, ...data, category: data.category as Category } : t
      ),
    })
    await supabase
      .from('transactions')
      .update({ amount: data.amount, category: data.category, note: data.note })
      .eq('id', id)
  }

  const remove = async (id: string) => {
    deleteTransaction(id)
    await supabase.from('transactions').delete().eq('id', id)
  }

  return { fetchAll, add, update, remove }
}
