import { supabase } from '@/lib/supabase'

export type RecurringExpense = {
  id: string
  name: string
  rf_code?: string
  amount?: number
  due_day?: number
  category: string
  is_paid: boolean
  paid_month?: string
  paid_amount?: number
  notify_days: number
  notes?: string
  created_at: string
}

export function useRecurringExpenses() {
  const fetchAll = async (): Promise<RecurringExpense[]> => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('due_day', { ascending: true, nullsFirst: false })
    if (error) console.error(error)
    return data ?? []
  }

  const add = async (expense: Omit<RecurringExpense, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('recurring_expenses').insert({
      ...expense,
      user_id: user.id,
    })
    if (error) console.error(error)
  }

  const update = async (id: string, expense: Partial<RecurringExpense>) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .update(expense)
      .eq('id', id)
    if (error) console.error(error)
  }

  const markPaid = async (
    id: string,
    addToExpenses: boolean,
    category: string,
    paidAmount: number,
    fullAmount: number,
  ) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const isFullyPaid = fullAmount > 0 ? paidAmount >= fullAmount : paidAmount > 0

    await supabase
      .from('recurring_expenses')
      .update({ is_paid: isFullyPaid, paid_month: currentMonth, paid_amount: paidAmount })
      .eq('id', id)

    if (addToExpenses && paidAmount > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: paidAmount,
          category,
          note: '',
          date: new Date().toISOString(),
        })
      }
    }
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  const checkAndResetMonth = async (expenses: RecurringExpense[]) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const toReset = expenses.filter(e => e.is_paid && e.paid_month !== currentMonth)
    for (const e of toReset) {
      await supabase
        .from('recurring_expenses')
        .update({ is_paid: false, paid_month: null, paid_amount: 0 })
        .eq('id', e.id)
    }
  }

  return { fetchAll, add, update, markPaid, remove, checkAndResetMonth }
}
