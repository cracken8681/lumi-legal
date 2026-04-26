import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen
        name="register"
        options={{
          headerShown: true,
          animation: 'slide_from_right',
          title: '',
          headerBackTitle: 'Πίσω',
        }}
      />
    </Stack>
  )
}
