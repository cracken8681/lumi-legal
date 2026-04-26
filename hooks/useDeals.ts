import { supabase } from '@/lib/supabase'
import * as Location from 'expo-location'

const NEARBY_RADIUS_KM = 2

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function useDeals() {
  const fetchAllDealsRaw = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*, supermarkets(name, lat, lng)')
    return { supermarkets: [], deals: data ?? [], userLocation: null }
  }

  const fetchNearbyDeals = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        return await fetchAllDealsRaw()
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      })
      const { latitude, longitude } = location.coords

      const { data: supermarkets } = await supabase.from('supermarkets').select('*')
      if (!supermarkets) return { supermarkets: [], deals: [], userLocation: { latitude, longitude } }

      const nearby = supermarkets
        .map(s => ({
          ...s,
          distance: getDistanceKm(latitude, longitude, Number(s.lat), Number(s.lng))
        }))
        .filter(s => s.distance <= NEARBY_RADIUS_KM)
        .sort((a, b) => a.distance - b.distance)

      if (nearby.length === 0) return { supermarkets: nearby, deals: [], userLocation: { latitude, longitude } }

      const ids = nearby.map(s => s.id)
      const { data: deals } = await supabase
        .from('deals')
        .select('*, supermarkets(name)')
        .in('supermarket_id', ids)

      return { supermarkets: nearby, deals: deals ?? [], userLocation: { latitude, longitude } }
    } catch (error) {
      console.log('Location error, falling back to all deals:', error)
      return await fetchAllDealsRaw()
    }
  }

  const fetchAllDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*, supermarkets(name, lat, lng)')
    return data ?? []
  }

  return { fetchNearbyDeals, fetchAllDeals }
}
