import React, { useState, useMemo } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Svg, { Path, Circle, Defs, LinearGradient, Stop, ClipPath, Rect, Text as SvgText } from 'react-native-svg'
import { LumiColors } from '@/constants/LumiColors'
import { useColorScheme } from '@/components/useColorScheme'

const ASSET_COLORS = ['#5B5FEF', '#00C896', '#FF6B6B', '#FFB547', '#A78BFA', '#F472B6']

type Return = { amount: number; created_at: string }
type Investment = {
  id: string
  name: string
  amount: number
  created_at: string
  investment_returns?: Return[]
}

type TimeFilter = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL'

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: '1D', label: '1ΗΜ' },
  { key: '7D', label: '7ΗΜ' },
  { key: '1M', label: '1Μ' },
  { key: '3M', label: '3Μ' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Ε' },
  { key: 'ALL', label: 'ALL' },
]

function getDaysBack(filter: TimeFilter): number {
  switch (filter) {
    case '1D': return 1
    case '7D': return 7
    case '1M': return 30
    case '3M': return 90
    case 'YTD': return Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000)
    case '1Y': return 365
    case 'ALL': return 3650
  }
}

function buildDailyData(investments: Investment[], daysBack: number) {
  const now = new Date()
  const days: { date: string; value: number }[] = []

  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    let total = 0
    investments.forEach(inv => {
      const invDate = inv.created_at?.slice(0, 10) ?? '2000-01-01'
      if (invDate <= dateStr) total += inv.amount

      inv.investment_returns?.forEach(r => {
        const rDate = r.created_at?.slice(0, 10) ?? '2000-01-01'
        if (rDate <= dateStr) total += r.amount
      })
    })

    days.push({ date: dateStr, value: total })
  }

  return days
}

export function AssetsChart({ investments }: { investments: Investment[] }) {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const [filter, setFilter] = useState<TimeFilter>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const WIDTH = 320
  const HEIGHT = 220
  const PAD = { top: 30, bottom: 10, left: 10, right: 40 }

  const dailyData = useMemo(() => {
    const src = selectedId ? investments.filter(i => i.id === selectedId) : investments
    return buildDailyData(src, getDaysBack(filter))
  }, [investments, filter, selectedId])

  const values = dailyData.map(d => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const toX = (i: number) => PAD.left + (i / (dailyData.length - 1)) * (WIDTH - PAD.left - PAD.right)
  const toY = (v: number) => PAD.top + ((maxVal - v) / range) * (HEIGHT - PAD.top - PAD.bottom)

  const linePath = dailyData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.value)}`).join(' ')
  const areaPath = linePath + ` L ${toX(dailyData.length - 1)} ${HEIGHT - PAD.bottom} L ${toX(0)} ${HEIGHT - PAD.bottom} Z`

  const peakIndex = values.indexOf(maxVal)
  const peakX = toX(peakIndex)
  const peakY = toY(maxVal)

  const activeColor = selectedId
    ? ASSET_COLORS[investments.findIndex(i => i.id === selectedId) % ASSET_COLORS.length]
    : '#5B5FEF'

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 10 }}>
        Πορεία Επενδύσεων
      </Text>

      <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, minHeight: 280 }}>
        <Svg width={WIDTH} height={HEIGHT}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={activeColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={activeColor} stopOpacity="0.0" />
            </LinearGradient>
            <ClipPath id="clip">
              <Rect x={0} y={0} width={WIDTH} height={HEIGHT} />
            </ClipPath>
          </Defs>

          {/* Area fill */}
          <Path d={areaPath} fill="url(#grad)" clipPath="url(#clip)" />

          {/* Line */}
          <Path d={linePath} stroke={activeColor} strokeWidth="2" fill="none" clipPath="url(#clip)" />

          {/* Peak label */}
          {maxVal > 0 && (() => {
            const labelWidth = 64
            const labelHeight = 22
            const labelX = peakX > WIDTH - 80 ? peakX - labelWidth - 10 : peakX + 10
            const labelY = Math.max(PAD.top, peakY - labelHeight / 2)
            const labelText = `€${maxVal.toFixed(0)}`
            return (
              <>
                <Circle cx={peakX} cy={peakY} r={5} fill={activeColor} />
                <Rect
                  x={labelX}
                  y={labelY}
                  width={labelWidth}
                  height={labelHeight}
                  rx={5}
                  fill={scheme === 'dark' ? '#161829' : '#FFFFFF'}
                />
                <SvgText
                  x={labelX + labelWidth / 2}
                  y={labelY + 15}
                  textAnchor="middle"
                  fontSize="13"
                  fill={activeColor}
                  fontWeight="700"
                >
                  {labelText}
                </SvgText>
              </>
            )
          })()}
        </Svg>

        {/* Time filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {FILTERS.map(f => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
                marginRight: 6,
                backgroundColor: filter === f.key ? activeColor : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: filter === f.key ? '#fff' : c.textMuted,
              }}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Asset pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <Pressable
          onPress={() => setSelectedId(null)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
            backgroundColor: !selectedId ? '#5B5FEF20' : c.surface,
            borderWidth: 1.5, borderColor: !selectedId ? '#5B5FEF' : c.border,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: !selectedId ? '#5B5FEF' : c.text }}>
            Όλα
          </Text>
        </Pressable>
        {investments.map((inv, index) => {
          const color = ASSET_COLORS[index % ASSET_COLORS.length]
          const isSelected = inv.id === selectedId
          const returns = (inv.investment_returns ?? []).reduce((s, r) => s + r.amount, 0)
          const roi = inv.amount > 0 ? ((returns / inv.amount) * 100).toFixed(1) : '0.0'
          return (
            <Pressable
              key={inv.id}
              onPress={() => setSelectedId(isSelected ? null : inv.id)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                backgroundColor: isSelected ? color + '20' : c.surface,
                borderWidth: 1.5, borderColor: isSelected ? color : c.border,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: isSelected ? color : c.text }}>
                {inv.name}
              </Text>
              <Text style={{ fontSize: 11, color: Number(roi) >= 0 ? c.success : c.danger, marginLeft: 4 }}>
                {Number(roi) >= 0 ? '+' : ''}{roi}%
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
