export const LumiColors = {
  light: {
    background: '#F8F9FF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F2FF',
    primary: '#5B5FEF',
    accent: '#FF6B6B',
    success: '#00C896',
    warning: '#FFB547',
    danger: '#FF4757',
    text: '#1A1D2E',
    textMuted: '#8B8FA8',
    border: '#E8EAFF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8EAFF',
  },
  dark: {
    background: '#0D0F1A',
    surface: '#161829',
    surfaceSecondary: '#1E2038',
    primary: '#6E72FF',
    accent: '#FF7A7A',
    success: '#00E5AD',
    warning: '#FFCA6B',
    danger: '#FF6B78',
    text: '#F0F1FF',
    textMuted: '#5A5E7A',
    border: '#252840',
    tabBar: '#161829',
    tabBarBorder: '#252840',
  },
} as const;

export type ThemeColors = typeof LumiColors.light | typeof LumiColors.dark;
