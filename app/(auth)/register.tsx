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
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { LumiColors, ThemeColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async () => {
    setError('')
    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν')
      return
    }
    if (password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  const s = styles(c)

  if (success) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <Text style={[s.logo]}>Lumi</Text>
        <Text style={[s.subtitle, { marginBottom: 0 }]}>
          Επιβεβαίωσε το email σου για να συνεχίσεις.
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.inner}>
        <Text style={s.logo}>Lumi</Text>
        <Text style={s.subtitle}>Δημιούργησε λογαριασμό</Text>

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
          <TextInput
            style={s.input}
            placeholder="Επιβεβαίωση κωδικού"
            placeholderTextColor={c.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.buttonText}>Δημιουργία λογαριασμού</Text>
            }
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={s.linkRow}>
            <Text style={s.linkText}>Έχεις ήδη λογαριασμό; </Text>
            <Text style={[s.linkText, s.linkBold]}>Σύνδεση</Text>
          </TouchableOpacity>
        </Link>
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
