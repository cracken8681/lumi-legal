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

      for (const store of stores) {
        const distance = getDistanceKm(latitude, longitude, Number(store.lat), Number(store.lng))
        if (distance > 0.4) continue

        if (settings.store_exceptions[store.name]?.enabled === false) continue

        const storeMaxPerDay = settings.store_exceptions[store.name]?.max_per_day ?? settings.max_per_day
        const storeMorning = settings.store_exceptions[store.name]?.morning_time ?? settings.morning_time
        const storeAfternoon = settings.store_exceptions[store.name]?.afternoon_time ?? settings.afternoon_time

        const inMorning = isInWindow('', storeMorning)
        const inAfternoon = isInWindow('', storeAfternoon)
        if (!inMorning && !inAfternoon) continue

        const todayNotified = coupons.filter(c => c.notified_date === today)
        if (todayNotified.length >= storeMaxPerDay) continue

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

  const checkExpiringCoupons = async () => {
    try {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_used', false)

      if (!coupons) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const coupon of coupons) {
        if (!coupon.expires_at) continue

        const expDate = new Date(coupon.expires_at)
        expDate.setHours(0, 0, 0, 0)
        const daysLeft = Math.round((expDate.getTime() - today.getTime()) / 86400000)

        if (daysLeft === 3 || daysLeft === 1 || daysLeft === 0) {
          const msg = daysLeft === 0
            ? `Λήγει σήμερα!`
            : daysLeft === 1
            ? `Λήγει αύριο!`
            : `Λήγει σε ${daysLeft} ημέρες`

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⚠️ Κουπόνι ${coupon.store_name} €${Number(coupon.value).toFixed(2)}`,
              body: msg,
              data: { couponId: coupon.id },
            },
            trigger: null,
          })
        }
      }
    } catch (error) {
      console.log('checkExpiringCoupons error:', error)
    }
  }

  const checkRecurringExpenses = async () => {
    try {
      const { data: expenses } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('is_paid', false)

      if (!expenses) return

      const today = new Date()
      const currentDay = today.getDate()

      for (const expense of expenses) {
        if (!expense.due_day || !expense.amount) continue

        const daysUntilDue = expense.due_day - currentDay
        const notifyDaysForThis = expense.notify_days ?? 3

        if (daysUntilDue >= 0 && daysUntilDue <= notifyDaysForThis) {
          const msg = daysUntilDue === 0
            ? 'Πληρωτέο σήμερα!'
            : `Πληρωτέο σε ${daysUntilDue} ημέρες`

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `💳 ${expense.name} €${Number(expense.amount).toFixed(2)}`,
              body: msg,
              data: { recurringId: expense.id },
            },
            trigger: null,
          })
        }
      }
    } catch (error) {
      console.log('checkRecurringExpenses error:', error)
    }
  }

  const checkBudgetAlerts = async () => {
    try {
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      if (!budgets || !transactions) return

      for (const budget of budgets) {
        if (!budget.limit_amount) continue

        const spent = transactions
          .filter((t: { category: string; amount: number }) => t.category === budget.category)
          .reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0)

        const percentage = (spent / budget.limit_amount) * 100

        if (percentage >= 90 && percentage < 100) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⚠️ Budget ${budget.category}`,
              body: `Έχεις χρησιμοποιήσει το 90% του budget σου! (€${spent.toFixed(0)}/€${budget.limit_amount})`,
              data: { budgetId: budget.id },
            },
            trigger: null,
          })
        } else if (percentage >= 100) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚨 Υπέρβαση Budget ${budget.category}!`,
              body: `Έχεις ξεπεράσει το όριό σου κατά €${(spent - budget.limit_amount).toFixed(0)}`,
              data: { budgetId: budget.id },
            },
            trigger: null,
          })
        }
      }
    } catch (error) {
      console.log('checkBudgetAlerts error:', error)
    }
  }

  return { checkAndNotify, checkExpiringCoupons, checkRecurringExpenses, checkBudgetAlerts }
}
