import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import 'react-native-reanimated'
import { Animated, Text, Image } from 'react-native'
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
import AsyncStorage from '@react-native-async-storage/async-storage'

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

  const opacityAnim = useRef(new Animated.Value(1)).current
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => { SplashScreen.hideAsync() }, [])

  useEffect(() => { if (error) throw error }, [error])

  useEffect(() => {
    if (fontsLoaded) {
      setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start(() => setShowSplash(false))
      }, 1200)
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <>
      <RootLayoutNav />
      {showSplash && (
        <Animated.View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0C0C22',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          opacity: opacityAnim,
        }}>
          <Image
            source={require('../assets/icon.png')}
            style={{ width: 160, height: 160 }}
            resizeMode="contain"
          />
          <Text style={{
            color: '#F2EEFF',
            fontSize: 36,
            fontWeight: '700',
            letterSpacing: 10,
            marginTop: 24,
          }}>LUMI</Text>
        </Animated.View>
      )}
    </>
  )
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

    const inTabs = segments[0] === '(tabs)'
    const inAuth = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inLock = segments[0] === 'lock'
    const inWelcome = segments[0] === 'welcome'

    if (!session) {
      setAppLocked(false)
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    // Already showing lock screen — wait for user to authenticate
    if (inLock) return

    // Lock was triggered for this session — stay put until unlocked
    if (appLocked) return

    // Already in tabs or welcome guide — no further routing needed
    if (inTabs) return
    if (inWelcome) return

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
        .then(async ({ data }) => {
          if (data?.onboarding_completed) {
            const welcomeShown = await AsyncStorage.getItem('welcome_shown')
            if (!welcomeShown) {
              router.replace('/welcome')
            } else {
              router.replace('/(tabs)')
            }
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
        <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="lock" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  )
}
