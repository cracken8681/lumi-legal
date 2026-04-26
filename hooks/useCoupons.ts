import { supabase } from '@/lib/supabase'

export type Coupon = {
  id: string
  store_name: string
  store_category: string
  value: number
  description?: string
  expires_at?: string
  is_used: boolean
  notified_date?: string
  created_at: string
}

export function useCoupons() {
  const fetchAll = async (): Promise<Coupon[]> => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    return data ?? []
  }

  const add = async (coupon: Omit<Coupon, 'id' | 'created_at' | 'is_used'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('coupons').insert({
      ...coupon,
      user_id: user.id,
      is_used: false,
    })
    if (error) console.error(error)
  }

  const markUsed = async (id: string) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_used: true })
      .eq('id', id)
    if (error) console.error(error)
  }

  const remove = async (id: string) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  return { fetchAll, add, markUsed, remove }
}
