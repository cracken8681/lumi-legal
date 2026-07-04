import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Dimensions, ScrollView, Modal, ActivityIndicator } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import ConfettiCannon from 'react-native-confetti-cannon'
import { LumiColors } from '@/constants/LumiColors'
import { useAppStore } from '@/store/useAppStore'
import { useWrapped, WrappedStats } from '@/hooks/useWrapped'

const { width } = Dimensions.get('window')
const SLIDE_COUNT = 5

type ThemeColors = typeof LumiColors.dark

const fmt = (n: number) => Math.round(n).toLocaleString('el-GR')

type Props = {
  visible: boolean
  onClose: () => void
}

export function LumiWrapped({ visible, onClose }: Props) {
  const c = LumiColors.dark
  const currency = useAppStore(state => state.currency)
  const { getWrapped } = useWrapped()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WrappedStats | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const viewShotRef = useRef<ViewShot>(null)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    setCurrentIndex(0)
    getWrapped().then((result) => {
      setStats(result)
      setLoading(false)
    })
  }, [visible])

  const handleClose = () => {
    setCurrentIndex(0)
    onClose()
  }

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.()
      if (!uri) return
      const available = await Sharing.isAvailableAsync()
      if (available) await Sharing.shareAsync(uri)
    } catch (e) {
      console.error('wrapped share error:', e)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        {loading || !stats ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={c.goldLight} />
          </View>
        ) : !stats.hasData ? (
          <NoDataSlide c={c} onClose={handleClose} />
        ) : (
          <>
            {/* Progress dots */}
            <View style={{ flexDirection: 'row', gap: 6, paddingTop: 60, paddingHorizontal: 20 }}>
              {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i <= currentIndex ? c.goldLight : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </View>

            <Pressable
              onPress={handleClose}
              style={{
                position: 'absolute',
                top: 56,
                right: 20,
                zIndex: 10,
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width)
                setCurrentIndex(index)
              }}
              style={{ flex: 1 }}
            >
              <IntroSlide stats={stats} c={c} />
              <SpendingSlide stats={stats} c={c} currency={currency} />
              <BudgetResultSlide stats={stats} c={c} currency={currency} active={currentIndex === 2} />
              <StreakSlide stats={stats} c={c} />
              <SummarySlide stats={stats} c={c} currency={currency} viewShotRef={viewShotRef} onShare={handleShare} />
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  )
}

function IntroSlide({ stats, c }: { stats: WrappedStats; c: ThemeColors }) {
  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Animated.View
        entering={FadeInUp.delay(100).duration(500)}
        style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: c.goldLight + '20',
          alignItems: 'center', justifyContent: 'center', marginBottom: 32,
        }}
      >
        <Text style={{ fontSize: 52 }}>🎬</Text>
      </Animated.View>
      <Animated.Text
        entering={FadeInUp.delay(220).duration(500)}
        style={{
          fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: c.text,
          textAlign: 'center', letterSpacing: -0.5, marginBottom: 14,
        }}
      >
        Ο {stats.monthLabel} σου σε αριθμούς 🎬
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(340).duration(500)}
        style={{ fontSize: 15, color: c.textMuted, textAlign: 'center', lineHeight: 22 }}
      >
        Ας δούμε πώς πήγε ο μήνας σου οικονομικά ✨
      </Animated.Text>
    </View>
  )
}

function SpendingSlide({ stats, c, currency }: { stats: WrappedStats; c: ThemeColors; currency: string }) {
  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Animated.Text
        entering={FadeInUp.delay(80).duration(500)}
        style={{
          fontSize: 13, fontFamily: 'Inter_600SemiBold', color: c.textMuted,
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12,
        }}
      >
        Ξόδεψες
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(180).duration(550)}
        style={{
          fontSize: 56, fontFamily: 'Inter_800ExtraBold', color: c.goldLight,
          fontVariant: ['tabular-nums'], marginBottom: 32,
        }}
      >
        {currency}{fmt(stats.totalSpent)}
      </Animated.Text>

      {stats.topCategory && (
        <Animated.View
          entering={FadeInUp.delay(320).duration(500)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: c.surface, borderRadius: 20,
            paddingVertical: 16, paddingHorizontal: 20,
            borderWidth: 1, borderColor: c.border,
          }}
        >
          <Text style={{ fontSize: 30 }}>{stats.topCategory.emoji}</Text>
          <View>
            <Text style={{ fontSize: 12, color: c.textMuted, marginBottom: 3 }}>Top κατηγορία</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: c.text, fontVariant: ['tabular-nums'] }}>
              {stats.topCategory.label} {currency}{fmt(stats.topCategory.amount)}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  )
}

function BudgetResultSlide({
  stats, c, currency, active,
}: { stats: WrappedStats; c: ThemeColors; currency: string; active: boolean }) {
  const saved = stats.budgetResult >= 0

  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      {active && saved && (
        <ConfettiCannon
          count={140}
          origin={{ x: width / 2, y: 0 }}
          fadeOut
          autoStart
          fallSpeed={2600}
          colors={[c.goldLight, c.gold, '#FFFFFF', c.success]}
        />
      )}
      <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={{ fontSize: 60, marginBottom: 24 }}>
        {saved ? '💪' : '🎯'}
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(220).duration(500)}
        style={{
          fontSize: 26, fontFamily: 'Inter_800ExtraBold',
          color: saved ? c.success : c.text,
          textAlign: 'center', lineHeight: 34,
          fontVariant: ['tabular-nums'],
        }}
      >
        {saved
          ? `Εξοικονόμησες ${currency}${fmt(stats.budgetResult)} 💪`
          : `Ξεπέρασες το budget κατά ${currency}${fmt(Math.abs(stats.budgetResult))} — νέος μήνας, νέα αρχή 🎯`}
      </Animated.Text>
    </View>
  )
}

function StreakSlide({ stats, c }: { stats: WrappedStats; c: ThemeColors }) {
  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 44 }}>
      <Animated.View entering={FadeInUp.delay(100).duration(500)} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 58, fontFamily: 'Inter_800ExtraBold', color: c.goldLight, fontVariant: ['tabular-nums'] }}>
          {stats.savingsStreak}
        </Text>
        <Text style={{ fontSize: 15, color: c.textMuted, marginTop: 6, textAlign: 'center' }}>
          Savings Streak: {stats.savingsStreak} {stats.savingsStreak === 1 ? 'μήνας' : 'μήνες'} 🔥
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(260).duration(500)} style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 58, fontFamily: 'Inter_800ExtraBold', color: c.primaryLight, fontVariant: ['tabular-nums'] }}>
          {stats.ageOfMoney}
        </Text>
        <Text style={{ fontSize: 15, color: c.textMuted, marginTop: 6, textAlign: 'center' }}>
          Age of Money: {stats.ageOfMoney} ημέρες ⏳
        </Text>
      </Animated.View>
    </View>
  )
}

function SummarySlide({
  stats, c, currency, viewShotRef, onShare,
}: {
  stats: WrappedStats
  c: ThemeColors
  currency: string
  viewShotRef: React.RefObject<ViewShot | null>
  onShare: () => void
}) {
  return (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <View
          style={{
            backgroundColor: c.surface, borderRadius: 28, padding: 28,
            width: width - 48,
            borderWidth: 1, borderColor: 'rgba(240,180,41,0.3)',
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Lumi Wrapped
          </Text>
          <Text style={{ fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: c.text, marginBottom: 20 }}>
            {stats.monthLabel} {stats.year}
          </Text>

          <SummaryRow emoji="💸" label="Ξόδεψες" value={`${currency}${fmt(stats.totalSpent)}`} c={c} />
          {stats.topCategory && (
            <SummaryRow
              emoji={stats.topCategory.emoji}
              label="Top κατηγορία"
              value={`${stats.topCategory.label} · ${currency}${fmt(stats.topCategory.amount)}`}
              c={c}
            />
          )}
          <SummaryRow
            emoji={stats.budgetResult >= 0 ? '💪' : '🎯'}
            label={stats.budgetResult >= 0 ? 'Εξοικονόμησες' : 'Υπέρβαση budget'}
            value={`${currency}${fmt(Math.abs(stats.budgetResult))}`}
            c={c}
          />
          <SummaryRow
            emoji="🔥"
            label="Savings Streak"
            value={`${stats.savingsStreak} ${stats.savingsStreak === 1 ? 'μήνας' : 'μήνες'}`}
            c={c}
          />
          <SummaryRow emoji="⏳" label="Age of Money" value={`${stats.ageOfMoney} ημέρες`} c={c} />
          {stats.couponsSaved > 0 && (
            <SummaryRow emoji="🏷️" label="Κουπόνια" value={`${currency}${fmt(stats.couponsSaved)}`} c={c} />
          )}
          {stats.investmentReturns !== 0 && (
            <SummaryRow emoji="📈" label="Αποδόσεις" value={`${currency}${fmt(stats.investmentReturns)}`} c={c} />
          )}
          {stats.biggestExpense && (
            <SummaryRow
              emoji={stats.biggestExpense.categoryEmoji}
              label="Μεγαλύτερο έξοδο"
              value={`${currency}${fmt(stats.biggestExpense.amount)}`}
              c={c}
              last
            />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: c.goldLight }}>Lumi 💡</Text>
          </View>
        </View>
      </ViewShot>

      <Pressable
        onPress={onShare}
        style={({ pressed }) => ({
          marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: c.goldLight, borderRadius: 16,
          paddingVertical: 14, paddingHorizontal: 28,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F1928' }}>📤 Μοιράσου το</Text>
      </Pressable>
    </View>
  )
}

function SummaryRow({
  emoji, label, value, c, last,
}: { emoji: string; label: string; value: string; c: ThemeColors; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ fontSize: 13, color: c.textMuted, fontFamily: 'Inter_500Medium' }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: c.text, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  )
}

function NoDataSlide({ c, onClose }: { c: ThemeColors; onClose: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: 56, right: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
      </Pressable>
      <Text style={{ fontSize: 56, marginBottom: 24 }}>📊</Text>
      <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: c.text, textAlign: 'center', marginBottom: 12 }}>
        Δεν υπάρχουν αρκετά δεδομένα
      </Text>
      <Text style={{ fontSize: 15, color: c.textMuted, textAlign: 'center', lineHeight: 22 }}>
        Κατέγραψε τα έξοδά σου και ο επόμενος Wrapped θα είναι 🔥
      </Text>
    </View>
  )
}
