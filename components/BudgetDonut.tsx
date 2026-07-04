import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'

type Category = {
  name: string
  spent: number
  color: string
  emoji: string
}

type Props = {
  categories: Category[]
  totalBudget: number
  totalSpent: number
}

const SIZE = 160
const STROKE = 18
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export function BudgetDonut({ categories, totalBudget, totalSpent }: Props) {
  const scheme = useColorScheme() ?? 'dark'
  const c = LumiColors[scheme]

  const active = categories.filter(cat => cat.spent > 0)
  const hasSpend = active.length > 0
  const total = active.reduce((s, cat) => s + cat.spent, 0) || 1

  let offset = 0
  const segments = active.map(cat => {
    const pct = cat.spent / total
    const dash = pct * CIRCUMFERENCE
    const gap = CIRCUMFERENCE - dash
    const currentOffset = offset
    offset += dash
    return { ...cat, dash, gap, offset: currentOffset }
  })

  const pct = totalBudget > 0
    ? Math.min(100, Math.round((totalSpent / totalBudget) * 100))
    : 0

  const centerColor = pct === 0 ? c.textMuted : pct >= 100 ? c.danger : pct >= 80 ? c.warning : c.goldLight

  // For the legend: show active categories if any, otherwise all categories with limit data
  const legendItems = hasSpend
    ? active.slice(0, 5)
    : categories.slice(0, 5)

  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 20,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <Text style={{
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: c.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 16,
      }}>
        Κατανομή Δαπανών
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
        {/* Donut */}
        <View style={{ position: 'relative', width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background track */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={c.border}
              strokeWidth={STROKE}
              fill="none"
            />
            {/* Category segments */}
            {segments.map((seg, i) => (
              <Circle
                key={i}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke={seg.color}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="round"
              />
            ))}
          </Svg>
          {/* Center label */}
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 22,
              color: centerColor,
              fontVariant: ['tabular-nums'],
            }}>
              {pct}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: c.textMuted,
              fontFamily: 'Inter_400Regular',
            }}>
              χρησιμοποιήθηκε
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={{ flex: 1, gap: 8 }}>
          {legendItems.map((cat, i) => {
            const catPct = hasSpend ? Math.round((cat.spent / total) * 100) : 0
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  width: 10, height: 10,
                  borderRadius: 5,
                  backgroundColor: hasSpend ? cat.color : c.border,
                  flexShrink: 0,
                }} />
                <Text style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: 'Inter_400Regular',
                  color: c.textMuted,
                }} numberOfLines={1}>
                  {cat.emoji} {cat.name}
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: hasSpend ? c.text : c.textMuted,
                  fontVariant: ['tabular-nums'],
                }}>
                  {catPct}%
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
