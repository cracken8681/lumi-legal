import { supabase } from '@/lib/supabase'

export function useProfile() {
  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return data
  }

  const completeOnboarding = async (monthlyIncome: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('profiles')
      .upsert(
        { id: user.id, onboarding_completed: true, monthly_income: monthlyIncome },
        { onConflict: 'id' }
      )
  }

  return { getProfile, completeOnboarding }
}
