import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function useLocationNotifications() {
  const checkNearbyAndNotify = async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync()
    if (locStatus !== 'granted') return

    const { status: notifStatus } = await Notifications.requestPermissionsAsync()
    if (notifStatus !== 'granted') return

    const location = await Location.getCurrentPositionAsync({})
    const { latitude, longitude } = location.coords

    const { data: supermarkets } = await supabase.from('supermarkets').select('*')
    if (!supermarkets) return

    const nearby = supermarkets
      .map(s => ({ ...s, distance: getDistanceKm(latitude, longitude, Number(s.lat), Number(s.lng)) }))
      .filter(s => s.distance <= 0.5)
      .sort((a, b) => a.distance - b.distance)

    if (nearby.length > 0) {
      const closest = nearby[0]
      const distanceM = Math.round(closest.distance * 1000)

      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('supermarket_id', closest.id)

      if (deals && deals.length > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🛒 ${closest.name} είναι κοντά σου!`,
            body: `${distanceM}μ μακριά • ${deals.length} προσφορές σε περιμένουν`,
            data: { supermarketId: closest.id },
          },
          trigger: null,
        })
      }
    }
  }

  return { checkNearbyAndNotify }
}
