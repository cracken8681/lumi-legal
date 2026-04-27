import { supabase } from '@/lib/supabase'

export type ShoppingItem = {
  id: string
  name: string
  checked: boolean
  quantity: number
  archived: boolean
  archived_at?: string
  created_at?: string
  user_id?: string
}

export function useShoppingList() {
  const fetchAll = async (): Promise<ShoppingItem[]> => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true })
    return data ?? []
  }

  const fetchArchived = async (): Promise<ShoppingItem[]> => {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('archived', true)
      .order('archived_at', { ascending: false })
    return data ?? []
  }

  const add = async (name: string): Promise<ShoppingItem | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('shopping_list')
      .insert({ name, user_id: user.id, checked: false, quantity: 1, archived: false })
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

  const updateQuantity = async (id: string, quantity: number) => {
    await supabase
      .from('shopping_list')
      .update({ quantity })
      .eq('id', id)
  }

  const archiveChecked = async () => {
    await supabase
      .from('shopping_list')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('checked', true)
      .eq('archived', false)
  }

  const unarchive = async (id: string) => {
    await supabase
      .from('shopping_list')
      .update({ archived: false, archived_at: null, checked: false })
      .eq('id', id)
  }

  return { fetchAll, fetchArchived, add, toggle, remove, updateQuantity, archiveChecked, unarchive }
}
