import { useMemo } from 'react'
import { useCashflowStats } from './useCashflow'
import { useAssets } from './useAssets'
import { useZakatYear, useZakatPayments } from './useZakat'
import { DEFAULT_EXCHANGE_RATE } from './useExchangeRates'
import type { Asset, AccountSummary } from '../types'

const NISAB_GOLD_GRAMS = 87.48
const ZAKAT_RATE = 0.025

export interface WealthItem {
  name: string
  value: number
  type: 'account' | 'asset'
  zakatable: boolean
}

export interface ZakatStats {
  isLoading: boolean
  // Wealth
  cashWealth: number
  portfolioWealth: number
  totalWealth: number
  wealthItems: WealthItem[]
  // Nisab
  nisab: number
  isAboveNisab: boolean
  // Zakat
  zakatDue: number
  totalPaid: number
  remaining: number
}

export function useZakatStats(year: number, month: number): ZakatStats {
  // Cash wealth from the last month of the year (or current selected month)
  const { accounts: cashAccounts, isLoading: cashLoading } = useCashflowStats(year, month)
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { data: zakatYear, isLoading: zakatYearLoading } = useZakatYear(year)
  const { data: payments, isLoading: paymentsLoading } = useZakatPayments(zakatYear?.id)

  const isLoading = cashLoading || assetsLoading || zakatYearLoading || paymentsLoading

  return useMemo(() => {
    const wealthItems: WealthItem[] = []

    // Cash wealth: sum of ending balances from all accounts
    let cashWealth = 0
    if (cashAccounts && cashAccounts.length > 0) {
      ;(cashAccounts as AccountSummary[]).forEach((account) => {
        const balance = account.ending_balance || 0
        cashWealth += balance
        wealthItems.push({
          name: account.name,
          value: balance,
          type: 'account',
          zakatable: true,
        })
      })
    }

    // External wallet balances (stored in USD, convert to BDT using zakat year's exchange rate)
    const zakatExRate = zakatYear?.exchange_rate ?? 123
    const payoneerUSD = zakatYear?.payoneer_balance ?? 0
    const paypalUSD = zakatYear?.paypal_balance ?? 0
    if (payoneerUSD > 0) {
      const payoneerBDT = payoneerUSD * zakatExRate
      cashWealth += payoneerBDT
      wealthItems.push({
        name: 'Payoneer',
        value: payoneerBDT,
        type: 'account',
        zakatable: true,
      })
    }
    if (paypalUSD > 0) {
      const paypalBDT = paypalUSD * zakatExRate
      cashWealth += paypalBDT
      wealthItems.push({
        name: 'PayPal',
        value: paypalBDT,
        type: 'account',
        zakatable: true,
      })
    }

    // Portfolio wealth: sum of zakatable asset current values (USD→BDT conversion)
    let portfolioWealth = 0
    if (assets && assets.length > 0) {
      assets.forEach((asset: Asset) => {
        const isZakatable = asset.is_zakatable !== false
        const valueBDT = asset.currency === 'USD'
          ? asset.current_value * DEFAULT_EXCHANGE_RATE
          : asset.current_value

        if (isZakatable) {
          portfolioWealth += valueBDT
        }

        wealthItems.push({
          name: asset.name,
          value: valueBDT,
          type: 'asset',
          zakatable: isZakatable,
        })
      })
    }

    const totalWealth = cashWealth + portfolioWealth

    // Nisab calculation
    const goldPrice = zakatYear?.gold_price_per_gram ?? 0
    const nisab = NISAB_GOLD_GRAMS * goldPrice
    const isAboveNisab = nisab > 0 && totalWealth >= nisab

    // Zakat due
    const zakatDue = isAboveNisab ? totalWealth * ZAKAT_RATE : 0

    // Total paid
    const totalPaid = (payments || []).reduce((sum, p) => sum + p.amount, 0)
    const remaining = Math.max(0, zakatDue - totalPaid)

    return {
      isLoading,
      cashWealth,
      portfolioWealth,
      totalWealth,
      wealthItems,
      nisab,
      isAboveNisab,
      zakatDue,
      totalPaid,
      remaining,
    }
  }, [cashAccounts, assets, zakatYear, payments, isLoading])
}
