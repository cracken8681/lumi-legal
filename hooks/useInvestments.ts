import { supabase } from '@/lib/supabase'

export function useInvestments() {
  const fetchAll = async () => {
    const { data: investments } = await supabase
      .from('investments')
      .select('*, investment_returns(*)')
      .order('created_at', { ascending: false })
    return investments ?? []
  }

  const add = async (name: string, amount: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('investments')
      .insert({ name, amount, user_id: user.id })
      .select()
      .single()
    return data
  }

  const addReturn = async (investmentId: string, amount: number, note: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('investment_returns')
      .insert({ investment_id: investmentId, amount, note, user_id: user.id })
      .select()
      .single()
    return data
  }

  const updateReturn = async (id: string, amount: number, note: string) => {
    const { data } = await supabase
      .from('investment_returns')
      .update({ amount, note })
      .eq('id', id)
      .select()
      .single()
    return data
  }

  const remove = async (id: string) => {
    await supabase.from('investments').delete().eq('id', id)
  }

  return { fetchAll, add, addReturn, updateReturn, remove }
}
