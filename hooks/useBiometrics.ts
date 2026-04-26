import * as LocalAuthentication from 'expo-local-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useBiometrics() {
  const isAvailable = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    return compatible && enrolled
  }

  const authenticate = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Σύνδεση στο Lumi',
      fallbackLabel: 'Χρήση κωδικού',
      cancelLabel: 'Ακύρωση',
    })
    return result.success
  }

  const setBiometricsEnabled = async (enabled: boolean) => {
    await AsyncStorage.setItem('biometrics_enabled', enabled ? 'true' : 'false')
  }

  const isBiometricsEnabled = async () => {
    const val = await AsyncStorage.getItem('biometrics_enabled')
    return val === 'true'
  }

  return { isAvailable, authenticate, setBiometricsEnabled, isBiometricsEnabled }
}
