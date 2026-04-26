import { Stack } from 'expo-router'
import { createContext, useContext, useState } from 'react'

type PYFAmounts = { investment: number; savings: number; goals: number }

type OnboardingData = {
  monthlyIncome: number
  pyfAmounts: PYFAmounts
  budgetLimits: Record<string, number>
  setMonthlyIncome: (v: number) => void
  setPyfAmounts: (v: PYFAmounts) => void
  setBudgetLimits: (v: Record<string, number>) => void
}

export const OnboardingContext = createContext<OnboardingData>({
  monthlyIncome: 0,
  pyfAmounts: { investment: 0, savings: 0, goals: 0 },
  budgetLimits: {},
  setMonthlyIncome: () => {},
  setPyfAmounts: () => {},
  setBudgetLimits: () => {},
})

export function useOnboarding() {
  return useContext(OnboardingContext)
}

export default function OnboardingLayout() {
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [pyfAmounts, setPyfAmounts] = useState<PYFAmounts>({ investment: 0, savings: 0, goals: 0 })
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({})

  return (
    <OnboardingContext.Provider value={{ monthlyIncome, pyfAmounts, budgetLimits, setMonthlyIncome, setPyfAmounts, setBudgetLimits }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </OnboardingContext.Provider>
  )
}
