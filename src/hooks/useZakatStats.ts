import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useCashflowStats } from './useCashflow'
import { useAssets } from './useAssets'
import { useZakatYear, useZakatPayments } from './useZakat'
import { DEFAULT_EXCHANGE_RATE } from './useExchangeRates'
import { assetTransactionKeys } from './useAssetTransactions'
import { assetValuationKeys } from './useAssetValuations'
import type { Asset, AssetTransaction, AssetValuation, AccountSummary } from '../types'

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

// Months since year 0, so (year, month) pairs compare as plain numbers
const period = (year: number, month: number) => year * 12 + month

// Net money moved into an asset by a transaction: buys add, sells take out.
// Income (dividends, rent, interest) doesn't change the asset's own value.
function netFlow(txn: AssetTransaction): number {
  if (txn.transaction_type === 'buy') return txn.amount
  if (txn.transaction_type === 'sell') return -txn.amount
  return 0
}

/**
 * The asset's value at the end of the Zakat calculation month, not today.
 *
 * Cash is taken from that month's ending balances, so assets must be valued at
 * the same point — otherwise a buy made after the hawl is counted twice: once
 * as cash in the calculation month, and again as the asset it later became.
 *
 * - Bought after the calculation month → not owned yet, worth 0.
 * - Has a valuation on or before that month → the latest one, plus any buys and
 *   sells between it and the calculation month.
 * - Otherwise → today's value with every later buy and sell rolled back.
 */
function valueAsOf(
  asset: Asset,
  transactions: AssetTransaction[],
  valuations: AssetValuation[],
  year: number,
  month: number
): number {
  const target = period(year, month)

  if (asset.purchase_date) {
    const [py, pm] = asset.purchase_date.split('-').map(Number)
    if (period(py, pm) > target) return 0
  }

  const snapshot = valuations
    .filter((v) => period(v.year, v.month) <= target)
    .sort((a, b) => period(b.year, b.month) - period(a.year, a.month))[0]

  if (snapshot) {
    const from = period(snapshot.year, snapshot.month)
    const flowsSince = transactions
      .filter((t) => period(t.year, t.month) > from && period(t.year, t.month) <= target)
      .reduce((sum, t) => sum + netFlow(t), 0)
    return Math.max(0, snapshot.value + flowsSince)
  }

  const laterFlows = transactions
    .filter((t) => period(t.year, t.month) > target)
    .reduce((sum, t) => sum + netFlow(t), 0)
  return Math.max(0, asset.current_value - laterFlows)
}

function useAssetHistory() {
  const { user } = useAuthStore()

  const transactions = useQuery({
    queryKey: [...assetTransactionKeys.lists(), 'all', user?.id ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_transactions')
        .select('*')
        .eq('user_id', user!.id)
      if (error) throw error
      return data as AssetTransaction[]
    },
    enabled: !!user?.id,
  })

  const valuations = useQuery({
    queryKey: [...assetValuationKeys.all, 'all', user?.id ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_valuations')
        .select('*')
        .eq('user_id', user!.id)
      if (error) throw error
      return data as AssetValuation[]
    },
    enabled: !!user?.id,
  })

  return {
    transactions: transactions.data,
    valuations: valuations.data,
    isLoading: transactions.isLoading || valuations.isLoading,
  }
}

export function useZakatStats(year: number, month: number): ZakatStats {
  // Cash wealth from the last month of the year (or current selected month)
  const { accounts: cashAccounts, isLoading: cashLoading } = useCashflowStats(year, month)
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { data: zakatYear, isLoading: zakatYearLoading } = useZakatYear(year)
  const { data: payments, isLoading: paymentsLoading } = useZakatPayments(zakatYear?.id)
  const { transactions, valuations, isLoading: historyLoading } = useAssetHistory()

  const isLoading = cashLoading || assetsLoading || zakatYearLoading || paymentsLoading || historyLoading

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

    // Portfolio wealth: zakatable assets valued as of the calculation month (USD→BDT conversion)
    let portfolioWealth = 0
    if (assets && assets.length > 0) {
      assets.forEach((asset: Asset) => {
        const value = valueAsOf(
          asset,
          (transactions || []).filter((t) => t.asset_id === asset.id),
          (valuations || []).filter((v) => v.asset_id === asset.id),
          year,
          month
        )
        // Not yet owned in the calculation month
        if (value === 0 && asset.current_value > 0) return

        const isZakatable = asset.is_zakatable !== false
        const valueBDT = asset.currency === 'USD'
          ? value * DEFAULT_EXCHANGE_RATE
          : value

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
    // Under ৳1 left is rounding, not an outstanding amount
    const remaining = zakatDue - totalPaid < 1 ? 0 : zakatDue - totalPaid

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
  }, [cashAccounts, assets, transactions, valuations, zakatYear, payments, year, month, isLoading])
}
