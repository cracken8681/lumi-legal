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
  }

  return { fetchAll, upsert }
}
