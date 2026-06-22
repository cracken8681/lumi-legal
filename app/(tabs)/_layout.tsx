import { Tabs } from 'expo-router';
import { ComponentProps, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import { useLocationNotifications } from '@/hooks/useLocationNotifications';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

// implementation="custom" is required for New Architecture compatibility but missing from expo-router types
type TabsCompat = ComponentProps<typeof Tabs> & { implementation?: string };
const LumiTabs = Tabs as React.FC<TabsCompat>;

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const c = LumiColors[scheme];
  const { checkNearbyAndNotify } = useLocationNotifications();
  const { checkAndNotify, checkExpiringCoupons, checkRecurringExpenses, checkBudgetAlerts } = useSmartNotifications();
  const { fetch: fetchSettings } = useNotificationSettings();

  useEffect(() => {
    checkNearbyAndNotify();
    const run = async () => {
      const settings = await fetchSettings();
      await checkAndNotify(settings);
      await checkExpiringCoupons();
      await checkRecurringExpenses();
      await checkBudgetAlerts();
    };
    run();
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
      <LumiTabs
        implementation="custom"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: scheme === 'dark' ? c.goldLight : c.primary,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: {
            backgroundColor: c.tabBar,
            borderTopColor: c.tabBarBorder,
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
          tabBarIconStyle: { marginBottom: -2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="assets"
          options={{
            title: 'Investments',
            tabBarIcon: ({ color, size }) => <Ionicons name="trending-up-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="finance"
          options={{
            title: 'Expenses',
            tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Tools',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        {/* Hidden from tab bar — accessible via programmatic navigation */}
        <Tabs.Screen name="expenses" options={{ href: null }} />
        <Tabs.Screen name="list" options={{ href: null }} />
        <Tabs.Screen name="deals" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </LumiTabs>
    </Animated.View>
  );
}
