import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/constants/categories'

// DEV ONLY — preview the Wrapped for the current (in-progress) month instead of last month.
// Must be false before commit.
const DEV_PREVIEW_CURRENT_MONTH = false

export type WrappedCategoryStat = {
  key: string
  label: string
  emoji: string
  color: string
  amount: number
}

export type WrappedBiggestExpense = {
  amount: number
  note: string
  categoryLabel: string
  categoryEmoji: string
}

export type WrappedStats = {
  hasData: boolean
  monthLabel: string
  year: number
  totalSpent: number
  topCategory: WrappedCategoryStat | null
  budgetLimit: number
  budgetResult: number
  pyfTotal: number
  savingsStreak: number
  ageOfMoney: number
  couponsSaved: number
  investmentReturns: number
  biggestExpense: WrappedBiggestExpense | null
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function monthKeyFor(year: number, monthIndex: number) {
  return `${year}-${pad(monthIndex + 1)}`
}

function shiftMonth(year: number, monthIndex: number, delta: number) {
  const d = new Date(year, monthIndex + delta, 1)
  return { year: d.getFullYear(), monthIndex: d.getMonth() }
}

function categoryDisplay(category: string, budgetRows: { category: string; emoji?: string | null; custom_name?: string | null }[]) {
  const known = (CATEGORIES as Record<string, { label: string; emoji: string; color: string } | undefined>)[category]
  if (known) return { label: known.label, emoji: known.emoji, color: known.color }
  const custom = budgetRows.find(b => b.category === category)
  return {
    label: custom?.custom_name ?? category,
    emoji: custom?.emoji ?? '📦',
    color: '#8B8FA8',
  }
}

export function useWrapped() {
  const getWrapped = async (): Promise<WrappedStats> => {
    const empty: WrappedStats = {
      hasData: false,
      monthLabel: '',
      year: new Date().getFullYear(),
      totalSpent: 0,
      topCategory: null,
      budgetLimit: 0,
      budgetResult: 0,
      pyfTotal: 0,
      savingsStreak: 0,
      ageOfMoney: 0,
      couponsSaved: 0,
      investmentReturns: 0,
      biggestExpense: null,
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return empty

    const now = new Date()
    const recapYear = DEV_PREVIEW_CURRENT_MONTH
      ? now.getFullYear()
      : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
    const recapMonthIndex = DEV_PREVIEW_CURRENT_MONTH
      ? now.getMonth()
      : (now.getMonth() - 1 + 12) % 12
    const monthKey = monthKeyFor(recapYear, recapMonthIndex)
    const monthLabel = new Date(recapYear, recapMonthIndex, 1).toLocaleDateString('el-GR', { month: 'long' })

    const rangeStart = new Date(recapYear, recapMonthIndex, 1).toISOString()
    const rangeEnd = new Date(recapYear, recapMonthIndex + 1, 1).toISOString()
    const daysInMonth = new Date(recapYear, recapMonthIndex + 1, 0).getDate()

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const currentMonthKey = monthKeyFor(now.getFullYear(), now.getMonth())

    const [
      { data: transactions },
      { data: budgetRows },
      { data: currentTransactions },
      { data: currentBudgetRows },
      { data: profile },
      { data: pyfHistoryRows },
      { data: currentPyfRows },
      { data: couponRows },
      { data: returnRows },
    ] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', rangeStart).lt('date', rangeEnd),
      supabase.from('budgets').select('*').eq('month', monthKey),
      supabase.from('transactions').select('amount').gte('date', currentMonthStart),
      supabase.from('budgets').select('limit_amount').eq('month', currentMonthKey),
      supabase.from('profiles').select('monthly_income').eq('id', user.id).single(),
      supabase.from('pyf_history').select('month, amount'),
      supabase.from('pay_yourself_first').select('amount'),
      supabase.from('coupons').select('value, used_at, created_at').eq('is_used', true),
      supabase.from('investment_returns').select('amount').gte('created_at', rangeStart).lt('created_at', rangeEnd),
    ])

    const txs = transactions ?? []
    const hasData = txs.length > 0

    // pyfTotal for the recap month, and consecutive-month streak, from pyf_history
    const pyfSumByMonth: Record<string, number> = {}
    ;(pyfHistoryRows ?? []).forEach(r => {
      pyfSumByMonth[r.month] = (pyfSumByMonth[r.month] ?? 0) + Number(r.amount)
    })
    const pyfTotal = pyfSumByMonth[monthKey] ?? 0

    let savingsStreak = 0
    let cursor = { year: recapYear, monthIndex: recapMonthIndex }
    while ((pyfSumByMonth[monthKeyFor(cursor.year, cursor.monthIndex)] ?? 0) > 0) {
      savingsStreak++
      cursor = shiftMonth(cursor.year, cursor.monthIndex, -1)
    }

    if (!hasData) {
      return { ...empty, hasData: false, monthLabel, year: recapYear, pyfTotal, savingsStreak }
    }

    const totalSpent = txs.reduce((sum, t) => sum + Number(t.amount), 0)

    const spentByCategory: Record<string, number> = {}
    txs.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + Number(t.amount)
    })
    const topCategoryEntry = Object.entries(spentByCategory).sort((a, b) => b[1] - a[1])[0]
    const topCategory: WrappedCategoryStat | null = topCategoryEntry
      ? { key: topCategoryEntry[0], amount: topCategoryEntry[1], ...categoryDisplay(topCategoryEntry[0], budgetRows ?? []) }
      : null

    const budgetLimit = (budgetRows ?? []).reduce((sum, b) => sum + Number(b.limit_amount), 0)
    const budgetResult = budgetLimit - totalSpent

    const couponsSaved = (couponRows ?? []).reduce((sum, c) => {
      const effectiveDate = c.used_at ?? c.created_at
      if (effectiveDate >= rangeStart && effectiveDate < rangeEnd) return sum + Number(c.value)
      return sum
    }, 0)
    const investmentReturns = (returnRows ?? []).reduce((sum, r) => sum + Number(r.amount), 0)

    const biggestTx = [...txs].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
    const biggestExpense: WrappedBiggestExpense | null = biggestTx
      ? {
          amount: Number(biggestTx.amount),
          note: biggestTx.note || '',
          ...(() => {
            const d = categoryDisplay(biggestTx.category, budgetRows ?? [])
            return { categoryLabel: d.label, categoryEmoji: d.emoji }
          })(),
        }
      : null

    // Age of Money — current available balance vs. last month's average daily spend
    const currentSpent = (currentTransactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
    const currentBudgetLimit = profile?.monthly_income != null
      ? Number(profile.monthly_income)
      : (currentBudgetRows ?? []).reduce((sum, b) => sum + Number(b.limit_amount), 0)
    const currentPyfTotal = (currentPyfRows ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
    const currentAvailable = currentBudgetLimit - currentSpent - currentPyfTotal
    const avgDailySpend = totalSpent / daysInMonth
    const ageOfMoney = avgDailySpend > 0
      ? Math.max(0, Math.min(99, Math.round(currentAvailable / avgDailySpend)))
      : 99

    return {
      hasData: true,
      monthLabel,
      year: recapYear,
      totalSpent,
      topCategory,
      budgetLimit,
      budgetResult,
      pyfTotal,
      savingsStreak,
      ageOfMoney,
      couponsSaved,
      investmentReturns,
      biggestExpense,
    }
  }

  return { getWrapped }
}
