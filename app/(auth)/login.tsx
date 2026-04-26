import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { supabase } from '@/lib/supabase'
import { LumiColors, ThemeColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const btnScale = useSharedValue(1)
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }))

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  const router = useRouter()
  const s = styles(c)

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        <Text style={s.logo}>Lumi</Text>
        <Text style={s.subtitle}>Καλωσόρισες πίσω</Text>

        <View style={s.card}>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor={c.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            placeholder="Κωδικός"
            placeholderTextColor={c.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Animated.View style={btnStyle}>
            <TouchableOpacity
              style={s.button}
              onPress={handleLogin}
              onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 10, stiffness: 200 }) }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 10, stiffness: 200 }) }}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.buttonText}>Σύνδεση</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        </View>

        <TouchableOpacity style={s.linkRow} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.linkText}>Δεν έχεις λογαριασμό; </Text>
          <Text style={[s.linkText, s.linkBold]}>Εγγραφή →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logo: {
      fontSize: 40,
      fontFamily: 'Inter_700Bold',
      color: c.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter_400Regular',
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: 32,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    input: {
      height: 50,
      backgroundColor: c.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: c.text,
    },
    error: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: c.danger,
      textAlign: 'center',
    },
    button: {
      height: 50,
      backgroundColor: c.primary,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    linkText: {
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
      color: c.textMuted,
    },
    linkBold: {
      color: c.primary,
      fontFamily: 'Inter_600SemiBold',
    },
  })
