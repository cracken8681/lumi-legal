import { useColorScheme as useNativeColorScheme } from 'react-native'
import { useAppStore } from '@/store/useAppStore'

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useNativeColorScheme()
  const theme = useAppStore((s) => s.theme)

  if (theme === 'system') {
    return systemScheme ?? 'dark'
  }

  return theme
}
