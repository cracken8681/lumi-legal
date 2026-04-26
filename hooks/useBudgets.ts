import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'

export function useBudgets() {
  const { setBudgets, updateBudget } = useAppStore()

  const currentMonth = new Date().toISOString().slice(0, 7) // "2026-04"

  const fetchAll = async () => {
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', currentMonth)

    const { data: transactionData } = await supabase
      .from('transactions')
      .select('*')

    if (!budgetData) return

    const spentByCategory: Record<string, number> = {}
    if (transactionData) {
      transactionData.forEach((t) => {
        spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + Number(t.amount)
      })
    }

    const mappedBudgets = budgetData.map((b) => ({
      ...b,
      limit: Number(b.limit_amount),
      spent: spentByCategory[b.category] ?? 0,
      emoji: b.emoji ?? undefined,
      custom_name: b.custom_name ?? undefined,
    }))

    setBudgets(mappedBudgets)
  }

  const upsert = async (category: string, limit_amount: number, emoji?: string, custom_name?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    updateBudget(category, limit_amount)

    await supabase
      .from('budgets')
      .upsert({
        user_id: user.id,
        category,
        limit_amount,
        month: currentMonth,
        ...(emoji !== undefined && { emoji }),
        ...(custom_name !== undefined && { custom_name }),
      }, { onConflict: 'user_id,category,month' })
  }

  const deleteCustomCategory = async (category: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('budgets')
      .delete()
      .eq('category', category)
      .eq('user_id', user.id)
  }

  return { fetchAll, upsert, deleteCustomCategory }
}
