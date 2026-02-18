import { useMemo } from 'react'
import { useAssets } from './useAssets'
import { useAllAssetTransactions } from './useAssetTransactions'
import { DEFAULT_EXCHANGE_RATE } from './useExchangeRates'
import type { AssetType, AssetWithStats } from '../types'

interface AllocationEntry {
  value: number
  percentage: number
}

export interface PortfolioStats {
  isLoading: boolean
  totalPortfolioValue: number
  totalCostBasis: number
  totalUnrealizedGainLoss: number
  totalIncome: number
  overallROI: number
  incomeYield: number
  allocationByType: Record<AssetType, AllocationEntry>
  assetsWithStats: AssetWithStats[]
}

const INCOME_TYPES = ['dividend', 'interest', 'rental_income', 'other_income']

export function usePortfolioStats(exchangeRate?: number): PortfolioStats {
  const { data: assets, isLoading: assetsLoading } = useAssets()
  const { data: transactions, isLoading: txnLoading } = useAllAssetTransactions()

  const rate = exchangeRate || DEFAULT_EXCHANGE_RATE
  const isLoading = assetsLoading || txnLoading

  return useMemo(() => {
    if (!assets) {
      return {
        isLoading,
        totalPortfolioValue: 0,
        totalCostBasis: 0,
        totalUnrealizedGainLoss: 0,
        totalIncome: 0,
        overallROI: 0,
        incomeYield: 0,
        allocationByType: {} as Record<AssetType, AllocationEntry>,
        assetsWithStats: [],
      }
    }

    // Build income per asset from transactions
    const incomeByAsset = new Map<string, number>()
    if (transactions) {
      transactions.forEach(txn => {
        if (INCOME_TYPES.includes(txn.transaction_type)) {
          const currency = txn.asset?.currency || 'BDT'
          const amountBDT = currency === 'USD' ? txn.amount * rate : txn.amount
          const prev = incomeByAsset.get(txn.asset_id) || 0
          incomeByAsset.set(txn.asset_id, prev + amountBDT)
        }
      })
    }

    let totalPortfolioValue = 0
    let totalCostBasis = 0
    let totalIncome = 0

    const assetsWithStats: AssetWithStats[] = assets.map(asset => {
      const valueBDT = asset.currency === 'USD' ? asset.current_value * rate : asset.current_value
      const costBDT = asset.currency === 'USD' ? asset.purchase_price * rate : asset.purchase_price
      const assetIncome = incomeByAsset.get(asset.id) || 0

      totalPortfolioValue += valueBDT
      totalCostBasis += costBDT
      totalIncome += assetIncome

      const gainLoss = valueBDT - costBDT
      const gainLossPercent = costBDT > 0 ? (gainLoss / costBDT) * 100 : 0

      return {
        ...asset,
        totalIncome: assetIncome,
        gainLoss,
        gainLossPercent,
      }
    })

    const totalUnrealizedGainLoss = totalPortfolioValue - totalCostBasis
    const overallROI = totalCostBasis > 0 ? (totalUnrealizedGainLoss / totalCostBasis) * 100 : 0
    const incomeYield = totalCostBasis > 0 ? (totalIncome / totalCostBasis) * 100 : 0

    // Allocation by type
    const allocationByType = {} as Record<AssetType, AllocationEntry>
    const allTypes: AssetType[] = ['bd_stock', 'intl_stock', 'real_estate', 'fixed_deposit', 'gold', 'crypto', 'bond', 'other']
    allTypes.forEach(type => {
      const typeValue = assets
        .filter(a => a.asset_type === type)
        .reduce((sum, a) => sum + (a.currency === 'USD' ? a.current_value * rate : a.current_value), 0)
      allocationByType[type] = {
        value: typeValue,
        percentage: totalPortfolioValue > 0 ? (typeValue / totalPortfolioValue) * 100 : 0,
      }
    })

    return {
      isLoading,
      totalPortfolioValue,
      totalCostBasis,
      totalUnrealizedGainLoss,
      totalIncome,
      overallROI,
      incomeYield,
      allocationByType,
      assetsWithStats,
    }
  }, [assets, transactions, rate, isLoading])
}
