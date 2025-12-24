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
        .select('*, category:personal_categories(*)')
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
          year,
          month,
          day: data.day,
          amount: data.amount,
          note: data.note || null,
        })
        .select('*, category:personal_categories(*)')
        .single()

      if (error) throw error
      return transaction as PersonalTransactionWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
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
          day: data.day,
          amount: data.amount,
          note: data.note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, category:personal_categories(*)')
        .single()

      if (error) throw error
      return transaction as PersonalTransactionWithCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashflowKeys.transactions() })
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
    },
  })
}

// ============================================
// COMPUTED / STATS
// ============================================

// Helper to get previous month/year
function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: month - 1 }
}

export function useCashflowStats(year: number, month: number) {
  const { data: accounts, isLoading: accountsLoading } = usePersonalAccounts()
  const { data: balances, isLoading: balancesLoading } = usePersonalBalances(year, month)
  const { data: transactions, isLoading: transactionsLoading } = usePersonalTransactions(year, month)

  // Get previous month data for carry-forward calculation
  const prev = getPreviousMonth(year, month)
  const { data: prevBalances, isLoading: prevBalancesLoading } = usePersonalBalances(prev.year, prev.month)
  const { data: prevTransactions, isLoading: prevTransactionsLoading } = usePersonalTransactions(prev.year, prev.month)

  const isLoading = accountsLoading || balancesLoading || transactionsLoading || prevBalancesLoading || prevTransactionsLoading

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

  // Create balance map for current month
  const balanceMap = new Map(balances.map(b => [b.account_id, b.beginning_balance]))

  // Calculate previous month's ending balances for carry-forward
  const prevBalanceMap = new Map((prevBalances || []).map(b => [b.account_id, b.beginning_balance]))
  const prevEndingBalanceMap = new Map<string, number>()

  if (prevTransactions) {
    accounts.forEach(account => {
      const prevAccountTransactions = prevTransactions.filter(t => t.account_id === account.id)
      const prevNetChange = prevAccountTransactions.reduce((sum, t) => sum + t.amount, 0)
      const prevBeginning = prevBalanceMap.get(account.id) || 0
      prevEndingBalanceMap.set(account.id, prevBeginning + prevNetChange)
    })
  }

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

    // Use explicit balance if set, otherwise use previous month's ending balance
    const explicitBalance = balanceMap.get(account.id)
    const carryForwardBalance = prevEndingBalanceMap.get(account.id) || 0
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
