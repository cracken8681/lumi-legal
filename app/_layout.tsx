import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import 'react-native-reanimated'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useColorScheme } from '@/components/useColorScheme'
import { useBiometrics } from '@/hooks/useBiometrics'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(auth)',
}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  useEffect(() => { if (error) throw error }, [error])

  if (!fontsLoaded) return null

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const segments = useSegments()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [appLocked, setAppLocked] = useState(false)
  const { isBiometricsEnabled } = useBiometrics()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        setAppLocked(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return

    SplashScreen.hideAsync()

    const inTabs = segments[0] === '(tabs)'
    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inLock = segments[0] === 'lock'

    if (!session) {
      setAppLocked(false)
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    // Already showing lock screen — wait for user to authenticate
    if (inLock) return

    // Lock was triggered for this session — stay put until unlocked
    if (appLocked) return

    // Already in tabs — no further routing needed
    if (inTabs) return

    isBiometricsEnabled().then(enabled => {
      if (enabled) {
        setAppLocked(true)
        router.replace('/lock')
        return
      }

      supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_completed) {
            router.replace('/(tabs)')
          } else {
            if (!inOnboarding) router.replace('/(onboarding)/welcome')
          }
        })
    })
  }, [session, segments[0]])

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  )
}
