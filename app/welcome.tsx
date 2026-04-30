import React, { useState, useRef } from 'react'
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '💡',
    title: 'Καλώς ήρθες στο Lumi',
    subtitle: 'Το έξυπνο βοηθός για τα οικονομικά σου',
    color: '#5B5FEF',
  },
  {
    emoji: '💰',
    title: 'Δαπάνες & Budget',
    subtitle: 'Κατέγραψε τα έξοδά σου και όρισε όρια ανά κατηγορία. Δες πού πηγαίνουν τα χρήματά σου.',
    color: '#00C896',
  },
  {
    emoji: '📈',
    title: 'Επενδύσεις',
    subtitle: 'Παρακολούθησε τα assets σου με Trading 212 στυλ chart. Δες το ROI σου σε πραγματικό χρόνο.',
    color: '#5B5FEF',
  },
  {
    emoji: '🏷️',
    title: 'Κουπόνια & Deals',
    subtitle: 'Αποθήκευσε κουπόνια και λάβε ειδοποίηση όταν πλησιάζεις το κατάστημα!',
    color: '#FFB547',
  },
  {
    emoji: '📋',
    title: 'Πάγια Έξοδα',
    subtitle: 'Παρακολούθησε λογαριασμούς και συνδρομές. Μην ξεχάσεις ποτέ πληρωμή.',
    color: '#FF6B6B',
  },
  {
    emoji: '🛒',
    title: 'Λίστα Αγορών',
    subtitle: 'Έξυπνη λίστα αγορών με ποσότητες. Τα αγορασμένα αρχειοθετούνται αυτόματα.',
    color: '#00C896',
  },
  {
    emoji: '🚀',
    title: 'Είσαι έτοιμος!',
    subtitle: 'Ξεκίνα τώρα και πάρε τον έλεγχο των οικονομικών σου.',
    color: '#5B5FEF',
    isLast: true,
  },
]

export default function WelcomeScreen() {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1
      scrollRef.current?.scrollTo({ x: next * width, animated: true })
      setCurrentIndex(next)
    }
  }

  const handleStart = async () => {
    await AsyncStorage.setItem('welcome_shown', 'true')
    router.replace('/(tabs)')
  }

  const handleSkip = async () => {
    await AsyncStorage.setItem('welcome_shown', 'true')
    router.replace('/(tabs)')
  }

  const slide = SLIDES[currentIndex]

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Skip button */}
      {!slide.isLast && (
        <Pressable
          onPress={handleSkip}
          style={{ position: 'absolute', top: 60, right: 24, zIndex: 10 }}
        >
          <Text style={{ color: c.textMuted, fontSize: 15 }}>Παράλειψη</Text>
        </Pressable>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{
            width,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}>
            {/* Emoji circle */}
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: s.color + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
            }}>
              <Text style={{ fontSize: 64 }}>{s.emoji}</Text>
            </View>

            <Text style={{
              fontSize: 28,
              fontFamily: 'Inter_700Bold',
              color: c.text,
              textAlign: 'center',
              marginBottom: 16,
            }}>
              {s.title}
            </Text>

            <Text style={{
              fontSize: 16,
              color: c.textMuted,
              textAlign: 'center',
              lineHeight: 24,
            }}>
              {s.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {SLIDES.map((_, i) => (
          <View key={i} style={{
            width: i === currentIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === currentIndex ? '#5B5FEF' : c.border,
            marginHorizontal: 4,
          }} />
        ))}
      </View>

      {/* Button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 48 }}>
        {slide.isLast ? (
          <Pressable
            onPress={handleStart}
            style={{
              backgroundColor: '#5B5FEF',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Inter_600SemiBold' }}>
              Ξεκινάμε! 🚀
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleNext}
            style={{
              backgroundColor: '#5B5FEF',
              borderRadius: 16,
              padding: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Inter_600SemiBold' }}>
              Επόμενο →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
