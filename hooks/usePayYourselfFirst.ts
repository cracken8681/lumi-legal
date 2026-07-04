import { supabase } from '@/lib/supabase'

export type PYFType = 'investment' | 'savings' | 'goals'

export function usePayYourselfFirst() {
  const fetchAll = async () => {
    const { data } = await supabase
      .from('pay_yourself_first')
      .select('*')
    return data ?? []
  }

  const upsert = async (type: PYFType, amount: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('pay_yourself_first')
      .upsert({ user_id: user.id, type, amount }, { onConflict: 'user_id,type' })

    const month = new Date().toISOString().slice(0, 7)
    await supabase
      .from('pyf_history')
      .upsert({ user_id: user.id, month, type, amount }, { onConflict: 'user_id,month,type' })
  }

  return { fetchAll, upsert }
}
