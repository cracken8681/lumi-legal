import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/constants/translations';

// implementation="custom" is required for New Architecture compatibility but missing from expo-router types
type TabsCompat = ComponentProps<typeof Tabs> & { implementation?: string };
const LumiTabs = Tabs as React.FC<TabsCompat>;

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'light';
  const c = LumiColors[scheme];
  const { language } = useAppStore();
  const t = translations[language];

  return (
    <LumiTabs
      implementation="custom"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor: c.tabBarBorder,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: t.expenses,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: t.assets,
          tabBarIcon: ({ size, focused }) => <Ionicons name="trending-up" size={size} color={focused ? c.success : c.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: t.list,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: t.deals,
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetag-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </LumiTabs>
  );
}
