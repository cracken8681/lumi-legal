import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'
import { NotificationSettings } from './useNotificationSettings'

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isInWindow(_time: string, windowTime: string): boolean {
  const now = new Date()
  const [wHour, wMin] = windowTime.split(':').map(Number)
  const windowStart = new Date()
  windowStart.setHours(wHour, wMin - 30, 0)
  const windowEnd = new Date()
  windowEnd.setHours(wHour, wMin + 30, 0)
  return now >= windowStart && now <= windowEnd
}

export function useSmartNotifications() {
  const checkAndNotify = async (settings: NotificationSettings) => {
    try {
      if (!settings.global_enabled) return

      const inMorning = isInWindow('', settings.morning_time)
      const inAfternoon = isInWindow('', settings.afternoon_time)
      if (!inMorning && !inAfternoon) return

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = location.coords

      const { data: stores } = await supabase.from('supermarkets').select('*')
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_used', false)

      if (!stores || !coupons || coupons.length === 0) return

      const today = new Date().toISOString().slice(0, 10)
      const todayNotified = coupons.filter(c => c.notified_date === today)
      if (todayNotified.length >= settings.max_per_day) return

      for (const store of stores) {
        const distance = getDistanceKm(latitude, longitude, Number(store.lat), Number(store.lng))
        if (distance > 0.4) continue

        if (settings.store_exceptions[store.name] === false) continue

        const storeCoupons = coupons.filter(c =>
          c.store_name.toLowerCase() === store.name.toLowerCase() &&
          c.notified_date !== today
        )
        if (storeCoupons.length === 0) continue

        const totalValue = storeCoupons.reduce((s: number, c: { value: number }) => s + c.value, 0)
        const distanceM = Math.round(distance * 1000)

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🏪 ${store.name} είναι ${distanceM}μ μακριά!`,
            body: `Έχεις κουπόνι αξίας €${totalValue.toFixed(2)} να εξαργυρώσεις`,
            data: { storeId: store.id },
          },
          trigger: null,
        })

        for (const coupon of storeCoupons) {
          await supabase
            .from('coupons')
            .update({ notified_date: today })
            .eq('id', coupon.id)
        }

        break
      }
    } catch (error) {
      console.log('Smart notification error:', error)
    }
  }

  return { checkAndNotify }
}
