import { supabase } from '@/lib/supabase'

export function useShoppingList() {
  const fetchAll = async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: true })
    return data ?? []
  }

  const add = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('shopping_list')
      .insert({ name, user_id: user.id, checked: false })
      .select()
      .single()
    return data
  }

  const toggle = async (id: string, checked: boolean) => {
    await supabase
      .from('shopping_list')
      .update({ checked })
      .eq('id', id)
  }

  const remove = async (id: string) => {
    await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)
  }

  return { fetchAll, add, toggle, remove }
}
