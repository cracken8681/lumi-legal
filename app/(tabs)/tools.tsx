import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LumiColors } from '@/constants/LumiColors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/store/useAppStore';
import Animated, { FadeInUp } from 'react-native-reanimated';

type ToolCard = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
};

export default function ToolsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = LumiColors[scheme];
  const router = useRouter();
  const { language } = useAppStore();

  const tools: ToolCard[] = [
    {
      title: language === 'el' ? 'Λίστα Αγορών' : 'Shopping List',
      subtitle: language === 'el' ? 'Οργάνωσε τις αγορές σου' : 'Track what you need to buy',
      icon: 'cart-outline',
      color: '#EC4899',
      route: '/(tabs)/list',
    },
    {
      title: language === 'el' ? 'Προσφορές' : 'Deals',
      subtitle: language === 'el' ? 'Βρες εκπτώσεις κοντά σου' : 'Find savings near you',
      icon: 'pricetag-outline',
      color: '#F59E0B',
      route: '/(tabs)/deals',
    },
    {
      title: language === 'el' ? 'Προφίλ' : 'Profile',
      subtitle: language === 'el' ? 'Διαχείριση λογαριασμού' : 'Manage your account',
      icon: 'person-outline',
      color: '#6366F1',
      route: '/(tabs)/profile',
    },
    {
      title: language === 'el' ? 'Επενδύσεις' : 'Investments',
      subtitle: language === 'el' ? 'Παρακολούθηση περιουσίας' : 'Track your assets & returns',
      icon: 'trending-up-outline',
      color: '#10B981',
      route: '/(tabs)/assets',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <Text style={{
          fontSize: 28, fontFamily: 'Inter_700Bold', color: c.text,
          letterSpacing: -0.5, marginBottom: 24,
        }}>
          Tools
        </Text>

        {/* 2×2 Card Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {tools.map((tool, i) => (
            <Animated.View
              key={tool.title}
              entering={FadeInUp.delay(i * 70).duration(380)}
              style={{ width: '47.5%' }}
            >
              <Pressable
                onPress={() => router.push(tool.route as any)}
                style={({ pressed }) => ({
                  backgroundColor: c.surface,
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 148,
                  opacity: pressed ? 0.82 : 1,
                  borderWidth: 1,
                  borderColor: c.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: scheme === 'dark' ? 0.3 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                })}
              >
                {/* Icon badge */}
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: tool.color,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Ionicons name={tool.icon} size={24} color="#fff" />
                </View>
                <Text style={{
                  fontSize: 15, fontFamily: 'Inter_600SemiBold',
                  color: c.text, marginBottom: 4,
                }}>
                  {tool.title}
                </Text>
                <Text style={{
                  fontSize: 12, fontFamily: 'Inter_400Regular',
                  color: c.textMuted, lineHeight: 17,
                }}>
                  {tool.subtitle}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
