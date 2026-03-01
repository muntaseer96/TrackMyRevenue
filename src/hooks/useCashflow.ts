import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type {
  PersonalAccount,
  PersonalCategory,
  PersonalBalance,
  PersonalTransactionWithCategory,
  PersonalAccountFormData,
  PersonalCategoryFormData,
  PersonalTransactionFormData,
  BalanceCategory,
  BalanceCategoryFormData,
  BalanceCategoryWithBalance,
} from '../types'

// Query keys
export const cashflowKeys = {
  all: ['cashflow'] as const,
  accounts: () => [...cashflowKeys.all, 'accounts'] as const,
  accountList: (userId: string) => [...cashflowKeys.accounts(), userId] as const,
  categories: () => [...cashflowKeys.all, 'categories'] as const,
  categoryList: (userId: string) => [...cashflowKeys.categories(), userId] as const,
  balances: () => [...cashflowKeys.all, 'balances'] as const,
  balanceList: (userId: string, year: number, month: number) =>
    [...cashflowKeys.balances(), userId, year, month] as const,
  transactions: () => [...cashflowKeys.all, 'transactions'] as const,
  transactionList: (userId: string, year: number, month: number, accountId?: string) =>
    [...cashflowKeys.transactions(), userId, year, month, accountId] as const,
  carryForward: () => [...cashflowKeys.all, 'carryForward'] as const,
  carryForwardKey: (userId: string, year: number, month: number) =>
    [...cashflowKeys.carryForward(), userId, year, month] as const,
  balanceCategories: () => [...cashflowKeys.all, 'balanceCategories'] as const,
  balanceCategoryList: (userId: string, accountId?: string) =>
    [...cashflowKeys.balanceCategories(), userId, accountId] as const,
}

// Default categories to seed on first use
const DEFAULT_CATEGORIES: Omit<PersonalCategoryFormData, 'color'>[] = [
  { name: 'Daily Expense', type: 'expense' },
  { name: 'Outdoor Food', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Bills', type: 'expense' },
  { name: 'Transportation', type: 'expense' },
  { name: 'Healthcare', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Personal Care', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Dividend', type: 'income' },
  { name: 'Gift', type: 'income' },
  { name: 'Other Income', type: 'income' },
  { name: 'Other Expense', type: 'expense' },
]

// ============================================
// ACCOUNTS
// ============================================

export function usePersonalAccounts() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.accountList(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('personal_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as PersonalAccount[]
    },
    enabled: !!user?.id,
  })
}

export function useCreatePersonalAccount() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: PersonalAccountFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: account, error } = await supabase
        .from('personal_accounts')
        .insert({
          user_id: user.id,
          name: data.name,
          color: data.color || '#5A8C27',
        })
        .select()
        .single()

      if (error) throw error
      return account as PersonalAccount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.accounts() })
    },
  })
}

export function useUpdatePersonalAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PersonalAccountFormData }) => {
      const { data: account, error } = await supabase
        .from('personal_accounts')
        .update({
          name: data.name,
          color: data.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return account as PersonalAccount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.accounts() })
    },
  })
}

export function useDeletePersonalAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.accounts() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.balances() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.carryForward() })
    },
  })
}

// ============================================
// CATEGORIES
// ============================================

export function usePersonalCategories() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.categoryList(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('personal_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as PersonalCategory[]
    },
    enabled: !!user?.id,
  })
}

export function useSeedDefaultCategories() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if user already has categories
      const { data: existing } = await supabase
        .from('personal_categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existing && existing.length > 0) {
        return [] // Already has categories
      }

      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        user_id: user.id,
        name: cat.name,
        type: cat.type,
      }))

      const { data, error } = await supabase
        .from('personal_categories')
        .insert(categoriesToInsert)
        .select()

      if (error) throw error
      return data as PersonalCategory[]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.categories() })
    },
  })
}

export function useCreatePersonalCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: PersonalCategoryFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: category, error } = await supabase
        .from('personal_categories')
        .insert({
          user_id: user.id,
          name: data.name,
          type: data.type,
          color: data.color || '#666666',
        })
        .select()
        .single()

      if (error) throw error
      return category as PersonalCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.categories() })
    },
  })
}

export function useUpdatePersonalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PersonalCategoryFormData }) => {
      const { data: category, error } = await supabase
        .from('personal_categories')
        .update({
          name: data.name,
          type: data.type,
          color: data.color,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return category as PersonalCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.categories() })
    },
  })
}

export function useDeletePersonalCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.categories() })
    },
  })
}

// ============================================
// BALANCES
// ============================================

export function usePersonalBalances(year: number, month: number) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.balanceList(user?.id ?? '', year, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('personal_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)

      if (error) throw error
      return data as PersonalBalance[]
    },
    enabled: !!user?.id,
  })
}

export function useUpsertPersonalBalance() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      account_id,
      year,
      month,
      beginning_balance,
    }: {
      account_id: string
      year: number
      month: number
      beginning_balance: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if balance exists
      const { data: existing } = await supabase
        .from('personal_balances')
        .select('id')
        .eq('account_id', account_id)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle()

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('personal_balances')
          .update({
            beginning_balance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data as PersonalBalance
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('personal_balances')
          .insert({
            user_id: user.id,
            account_id,
            year,
            month,
            beginning_balance,
          })
          .select()
          .single()

        if (error) throw error
        return data as PersonalBalance
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.balances() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.carryForward() })
    },
  })
}

// ============================================
// TRANSACTIONS
// ============================================

export function usePersonalTransactions(year: number, month: number, accountId?: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.transactionList(user?.id ?? '', year, month, accountId),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      let query = supabase
        .from('personal_transactions')
        .select('*, category:personal_categories(*), balance_category:balance_categories(*)')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .order('day', { ascending: false })
        .order('created_at', { ascending: false })

      if (accountId) {
        query = query.eq('account_id', accountId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as PersonalTransactionWithCategory[]
    },
    enabled: !!user?.id,
  })
}

export function useCreatePersonalTransaction() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      data,
      year,
      month,
    }: {
      data: PersonalTransactionFormData
      year: number
      month: number
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: transaction, error } = await supabase
        .from('personal_transactions')
        .insert({
          user_id: user.id,
          account_id: data.account_id,
          category_id: data.category_id || null,
          balance_category_id: data.balance_category_id || null,
          year,
          month,
          day: data.day,
          amount: data.amount,
          note: data.note || null,
        })
        .select('*, category:personal_categories(*), balance_category:balance_categories(*)')
        .single()

      if (error) throw error
      return transaction as PersonalTransactionWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.carryForward() })
    },
  })
}

export function useUpdatePersonalTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<PersonalTransactionFormData> & { day?: number }
    }) => {
      const { data: transaction, error } = await supabase
        .from('personal_transactions')
        .update({
          account_id: data.account_id,
          category_id: data.category_id || null,
          balance_category_id: data.balance_category_id || null,
          day: data.day,
          amount: data.amount,
          note: data.note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, category:personal_categories(*), balance_category:balance_categories(*)')
        .single()

      if (error) throw error
      return transaction as PersonalTransactionWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.carryForward() })
    },
  })
}

export function useDeletePersonalTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: cashflowKeys.carryForward() })
    },
  })
}

// ============================================
// COMPUTED / STATS
// ============================================

// Hook that fetches all historical balances and transactions before a given month,
// then walks through the chain to compute the correct carry-forward ending balance
// for each account. This fixes the bug where carry-forward only worked one month deep.
function useCarryForwardBalances(year: number, month: number) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.carryForwardKey(user?.id ?? '', year, month),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      // Fetch ALL explicit beginning balances for this user
      const { data: allBalances, error: balErr } = await supabase
        .from('personal_balances')
        .select('account_id, year, month, beginning_balance')
        .eq('user_id', user.id)

      if (balErr) throw balErr

      // Fetch ALL transactions before the current month (only needed columns)
      const { data: allTransactions, error: txErr } = await supabase
        .from('personal_transactions')
        .select('account_id, amount, year, month')
        .eq('user_id', user.id)

      if (txErr) throw txErr

      // Filter to only months strictly before (year, month)
      const isBefore = (y: number, m: number) =>
        y < year || (y === year && m < month)

      const priorBalances = (allBalances || []).filter(b => isBefore(b.year, b.month))
      const priorTransactions = (allTransactions || []).filter(t => isBefore(t.year, t.month))

      // Collect all unique (year, month) pairs that have data
      const monthSet = new Set<string>()
      priorBalances.forEach(b => monthSet.add(`${b.year}-${b.month}`))
      priorTransactions.forEach(t => monthSet.add(`${t.year}-${t.month}`))

      // Sort chronologically
      const sortedMonths = Array.from(monthSet)
        .map(s => {
          const [y, m] = s.split('-').map(Number)
          return { year: y, month: m }
        })
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)

      // Build lookup: "year-month" -> account_id -> explicit beginning_balance
      const balanceLookup = new Map<string, Map<string, number>>()
      priorBalances.forEach(b => {
        const key = `${b.year}-${b.month}`
        if (!balanceLookup.has(key)) balanceLookup.set(key, new Map())
        balanceLookup.get(key)!.set(b.account_id, b.beginning_balance)
      })

      // Build lookup: "year-month" -> account_id -> sum of transaction amounts
      const txSumLookup = new Map<string, Map<string, number>>()
      priorTransactions.forEach(t => {
        const key = `${t.year}-${t.month}`
        if (!txSumLookup.has(key)) txSumLookup.set(key, new Map())
        const current = txSumLookup.get(key)!.get(t.account_id) || 0
        txSumLookup.get(key)!.set(t.account_id, current + t.amount)
      })

      // Walk through months chronologically, computing carry-forward
      const carryForward = new Map<string, number>() // account_id -> ending balance

      for (const { year: my, month: mm } of sortedMonths) {
        const key = `${my}-${mm}`
        const monthBalances = balanceLookup.get(key)
        const monthTxSums = txSumLookup.get(key)

        // Collect all account IDs involved in this month
        const accountIds = new Set<string>()
        monthBalances?.forEach((_, id) => accountIds.add(id))
        monthTxSums?.forEach((_, id) => accountIds.add(id))

        for (const accountId of accountIds) {
          const explicit = monthBalances?.get(accountId)
          // Use explicit balance if set, otherwise carry forward from previous month
          const beginning = explicit !== undefined ? explicit : (carryForward.get(accountId) || 0)
          const netChange = monthTxSums?.get(accountId) || 0
          carryForward.set(accountId, beginning + netChange)
        }
      }

      // Convert to plain object for React Query serialization
      return Object.fromEntries(carryForward) as Record<string, number>
    },
    enabled: !!user?.id,
  })
}

export function useCashflowStats(year: number, month: number) {
  const { data: accounts, isLoading: accountsLoading } = usePersonalAccounts()
  const { data: balances, isLoading: balancesLoading } = usePersonalBalances(year, month)
  const { data: transactions, isLoading: transactionsLoading } = usePersonalTransactions(year, month)
  const { data: carryForwardBalances, isLoading: carryForwardLoading } = useCarryForwardBalances(year, month)

  const isLoading = accountsLoading || balancesLoading || transactionsLoading || carryForwardLoading

  if (!accounts || !balances || !transactions) {
    return {
      isLoading,
      accounts: [],
      totalBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      netChange: 0,
    }
  }

  // Create balance map for current month (explicit beginning balances)
  const balanceMap = new Map(balances.map(b => [b.account_id, b.beginning_balance]))

  // Calculate stats per account
  const accountStats = accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.account_id === account.id)
    const totalIncome = accountTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = accountTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netChange = totalIncome - totalExpense

    // Use explicit balance if set, otherwise use carry-forward from full chain
    const explicitBalance = balanceMap.get(account.id)
    const carryForwardBalance = carryForwardBalances?.[account.id] || 0
    const beginningBalance = explicitBalance !== undefined ? explicitBalance : carryForwardBalance
    const endingBalance = beginningBalance + netChange

    return {
      ...account,
      beginning_balance: beginningBalance,
      ending_balance: endingBalance,
      net_change: netChange,
      total_income: totalIncome,
      total_expense: totalExpense,
    }
  })

  // Calculate totals across all accounts
  const totalBalance = accountStats.reduce((sum, a) => sum + a.ending_balance, 0)
  const totalIncome = accountStats.reduce((sum, a) => sum + a.total_income, 0)
  const totalExpense = accountStats.reduce((sum, a) => sum + a.total_expense, 0)
  const netChange = totalIncome - totalExpense

  return {
    isLoading,
    accounts: accountStats,
    totalBalance,
    totalIncome,
    totalExpense,
    netChange,
  }
}

// ============================================
// BALANCE CATEGORIES (Sub-balances per account)
// ============================================

export function useBalanceCategories(accountId?: string) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: cashflowKeys.balanceCategoryList(user?.id ?? '', accountId),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      let query = supabase
        .from('balance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (accountId) {
        query = query.eq('account_id', accountId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as BalanceCategory[]
    },
    enabled: !!user?.id,
  })
}

export function useCreateBalanceCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      accountId,
      data,
    }: {
      accountId: string
      data: BalanceCategoryFormData
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: category, error } = await supabase
        .from('balance_categories')
        .insert({
          user_id: user.id,
          account_id: accountId,
          name: data.name,
          initial_balance: data.initial_balance,
          color: data.color || '#6366F1',
        })
        .select()
        .single()

      if (error) throw error
      return category as BalanceCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.balanceCategories() })
    },
  })
}

export function useUpdateBalanceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: BalanceCategoryFormData
    }) => {
      const { data: category, error } = await supabase
        .from('balance_categories')
        .update({
          name: data.name,
          initial_balance: data.initial_balance,
          color: data.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return category as BalanceCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.balanceCategories() })
    },
  })
}

export function useDeleteBalanceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('balance_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.balanceCategories() })
      // Also invalidate transactions since balance_category_id will be set to null
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
    },
  })
}

// Compute current balance for each balance category
export function useBalanceCategoryStats(accountId: string) {
  const { data: balanceCategories, isLoading: categoriesLoading } = useBalanceCategories(accountId)
  const { user } = useAuthStore()

  // Fetch ALL transactions for this account (no month filter) to calculate running balances
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [...cashflowKeys.transactions(), 'all', user?.id, accountId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('personal_transactions')
        .select('id, amount, balance_category_id')
        .eq('user_id', user.id)
        .eq('account_id', accountId)
        .not('balance_category_id', 'is', null)

      if (error) throw error
      return data as { id: string; amount: number; balance_category_id: string }[]
    },
    enabled: !!user?.id && !!accountId,
  })

  const isLoading = categoriesLoading || transactionsLoading

  if (!balanceCategories) {
    return { isLoading, balanceCategories: [] }
  }

  // Calculate current balance for each category
  const categoriesWithBalance: BalanceCategoryWithBalance[] = balanceCategories.map(category => {
    const categoryTransactions = (allTransactions || []).filter(
      t => t.balance_category_id === category.id
    )
    const transactionSum = categoryTransactions.reduce((sum, t) => sum + t.amount, 0)
    const currentBalance = category.initial_balance + transactionSum

    return {
      ...category,
      current_balance: currentBalance,
    }
  })

  return {
    isLoading,
    balanceCategories: categoriesWithBalance,
  }
}
