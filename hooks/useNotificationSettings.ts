import { supabase } from '@/lib/supabase'

export type NotificationSettings = {
  id?: string
  global_enabled: boolean
  morning_time: string
  afternoon_time: string
  max_per_day: number
  store_exceptions: Record<string, boolean>
}

const DEFAULTS: NotificationSettings = {
  global_enabled: true,
  morning_time: '07:30',
  afternoon_time: '16:30',
  max_per_day: 2,
  store_exceptions: {},
}

export function useNotificationSettings() {
  const fetch = async (): Promise<NotificationSettings> => {
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .single()
    return data ?? DEFAULTS
  }

  const save = async (settings: NotificationSettings) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('notification_settings')
      .upsert({ ...settings, user_id: user.id, updated_at: new Date().toISOString() })
  }

  return { fetch, save }
}
