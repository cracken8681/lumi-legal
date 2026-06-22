import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
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

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle - 90))
  const y1 = cy + r * Math.sin(toRad(startAngle - 90))
  const x2 = cx + r * Math.cos(toRad(endAngle - 90))
  const y2 = cy + r * Math.sin(toRad(endAngle - 90))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function describeDonutArc(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle - 90))
  const y1 = cy + r * Math.sin(toRad(startAngle - 90))
  const x2 = cx + r * Math.cos(toRad(endAngle - 90))
  const y2 = cy + r * Math.sin(toRad(endAngle - 90))
  const ix1 = cx + innerR * Math.cos(toRad(endAngle - 90))
  const iy1 = cy + innerR * Math.sin(toRad(endAngle - 90))
  const ix2 = cx + innerR * Math.cos(toRad(startAngle - 90))
  const iy2 = cy + innerR * Math.sin(toRad(startAngle - 90))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
}

export function AssetsChart({ investments }: { investments: Investment[] }) {
  const scheme = useColorScheme() ?? 'light'
  const c = LumiColors[scheme]
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const SIZE = 240
  const cx = SIZE / 2
  const cy = SIZE / 2
  const R = 100
  const INNER_R = 60
  const GAP = 2

  const slices = investments.map((inv, index) => {
    const returns = (inv.investment_returns ?? []).reduce((s, r) => s + r.amount, 0)
    return {
      inv,
      total: inv.amount + returns,
      color: ASSET_COLORS[index % ASSET_COLORS.length],
    }
  })

  const grandTotal = slices.reduce((s, sl) => s + Math.max(sl.total, 0), 0)

  const selectedSlice = selectedId ? slices.find(sl => sl.inv.id === selectedId) : null
  const displayTotal = selectedSlice ? selectedSlice.total : grandTotal
  const displayLabel = selectedSlice ? selectedSlice.inv.name : 'Σύνολο'

  let cursor = 0
  const paths = slices
    .filter(sl => sl.total > 0 && grandTotal > 0)
    .map(sl => {
      const pct = sl.total / grandTotal
      const sweep = pct * (360 - GAP * slices.length)
      const start = cursor
      const end = cursor + sweep
      cursor = end + GAP
      const isSelected = sl.inv.id === selectedId
      return { ...sl, start, end, pct, isSelected }
    })

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: c.text, marginBottom: 10 }}>
        Κατανομή Επενδύσεων
      </Text>

      <View style={{ backgroundColor: c.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border }}>
        {grandTotal === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
            <Text style={{ fontSize: 14, color: c.textMuted, fontFamily: 'Inter_400Regular' }}>
              Δεν υπάρχουν επενδύσεις ακόμα
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Svg width={SIZE} height={SIZE}>
              {paths.map((p, i) => (
                <Path
                  key={i}
                  d={describeDonutArc(cx, cy, p.isSelected ? R + 8 : R, INNER_R, p.start, p.end)}
                  fill={p.color}
                  opacity={selectedId && !p.isSelected ? 0.4 : 1}
                  onPress={() => setSelectedId(p.isSelected ? null : p.inv.id)}
                />
              ))}
              <SvgText
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill={c.text}
              >
                €{displayTotal.toFixed(0)}
              </SvgText>
              <SvgText
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fontSize="11"
                fill={c.textMuted}
              >
                {displayLabel}
              </SvgText>
            </Svg>
          </View>
        )}
      </View>

      {/* Asset pills */}
      {slices.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {slices.map((sl, index) => {
            const color = sl.color
            const isSelected = sl.inv.id === selectedId
            const returns = (sl.inv.investment_returns ?? []).reduce((s, r) => s + r.amount, 0)
            const roi = sl.inv.amount > 0 ? ((returns / sl.inv.amount) * 100).toFixed(1) : '0.0'
            const pct = grandTotal > 0 ? ((Math.max(sl.total, 0) / grandTotal) * 100).toFixed(0) : '0'
            return (
              <Pressable
                key={sl.inv.id}
                onPress={() => setSelectedId(isSelected ? null : sl.inv.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                  backgroundColor: isSelected ? color + '20' : c.surface,
                  borderWidth: 1.5, borderColor: isSelected ? color : c.border,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: isSelected ? color : c.text }}>
                  {sl.inv.name}
                </Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginLeft: 4 }}>
                  {pct}%
                </Text>
                <Text style={{ fontSize: 11, color: Number(roi) >= 0 ? c.success : c.danger, marginLeft: 4 }}>
                  {Number(roi) >= 0 ? '+' : ''}{roi}%
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
