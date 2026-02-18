// Database types
export interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  available_years: number[] | null
  selected_year: number | null
  created_at: string | null
  updated_at: string | null
}

export interface Website {
  id: string
  user_id: string
  name: string
  url: string | null
  year: number
  created_at: string | null
  updated_at: string | null
}

export interface Category {
  id: string
  user_id: string
  website_id: string | null
  name: string
  type: 'revenue' | 'expense' | string
  year: number
  created_at: string | null
}

export interface WebsiteCategory {
  id: string
  website_id: string
  category_id: string
  created_at: string | null
}

export interface MonthlyEntry {
  id: string
  user_id: string
  website_id: string
  category_id: string
  year: number
  month: number
  amount: number
  created_at: string | null
  updated_at: string | null
}

export interface Investment {
  id: string
  user_id: string
  company_name: string
  principal_amount: number
  notes: string | null
  year: number
  created_at: string | null
  updated_at: string | null
}

export interface Dividend {
  id: string
  user_id: string
  investment_id: string
  year: number
  month: number
  amount: number
  created_at: string | null
}

// Extended type with investment name for display
export interface DividendWithInvestment extends Dividend {
  investment?: Investment
}

export interface Tool {
  id: string
  user_id: string
  name: string
  year: number
  month: number
  cost_usd: number
  exchange_rate: number
  cost_bdt: number | null
  recurrence: 'monthly' | 'yearly'
  due_month: number | null
  website_id: string | null
  is_template: boolean
  is_allocated: boolean
  created_at: string | null
}

export interface MonthlyExchangeRate {
  id: string
  user_id: string
  year: number
  month: number
  rate: number
  created_at: string | null
  updated_at: string | null
}

// Extended types with relations
export interface WebsiteWithCategories extends Website {
  categories: Category[]
}

export interface MonthlyEntryWithCategory extends MonthlyEntry {
  category: Category
}

// Form types
export interface WebsiteFormData {
  name: string
  url?: string
}

export interface CategoryFormData {
  name: string
  type: 'revenue' | 'expense'
  website_id: string
}

export interface MonthlyEntryFormData {
  category_id: string
  amount: number
}

export interface InvestmentFormData {
  company_name: string
  year: number
  month: number
  dividend_amount: number
}

export interface ToolFormData {
  name: string
  year: number
  month: number
  cost_usd: number
  exchange_rate: number
  recurrence?: 'monthly' | 'yearly'
  due_month?: number | null
  website_id?: string | null
  is_template?: boolean
  is_allocated?: boolean
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number
  totalExpense: number
  totalProfit: number
  profitMargin: number
  topRevenueCategory: { name: string; amount: number } | null
  topExpenseCategory: { name: string; amount: number } | null
}

export interface MonthlyTrend {
  month: number
  year: number
  revenue: number
  expense: number
  profit: number
}

export interface WebsiteRevenue {
  websiteId: string
  websiteName: string
  revenue: number
  expense: number
  profit: number
}

// Filter types
export interface DateFilter {
  year: number
  startMonth?: number
  endMonth?: number
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// ============================================
// Personal Cashflow Types (Separate from business)
// ============================================

export interface PersonalAccount {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface PersonalCategory {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  color: string
  created_at: string
}

export interface PersonalBalance {
  id: string
  user_id: string
  account_id: string
  year: number
  month: number
  beginning_balance: number
  created_at: string
  updated_at: string
}

export interface PersonalTransaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  balance_category_id: string | null
  year: number
  month: number
  day: number
  amount: number
  note: string | null
  created_at: string
  updated_at: string
}

export interface BalanceCategory {
  id: string
  user_id: string
  account_id: string
  name: string
  initial_balance: number
  color: string
  created_at: string
  updated_at: string
}

// Extended types for UI
export interface PersonalTransactionWithCategory extends PersonalTransaction {
  category: PersonalCategory | null
  balance_category?: BalanceCategory | null
}

// Computed type for balance category with running balance
export interface BalanceCategoryWithBalance extends BalanceCategory {
  current_balance: number // initial_balance + sum of tagged transactions
}

export interface AccountSummary extends PersonalAccount {
  beginning_balance: number
  ending_balance: number
  net_change: number
  total_income: number
  total_expense: number
}

// Form types for personal cashflow
export interface PersonalAccountFormData {
  name: string
  color?: string
}

export interface PersonalCategoryFormData {
  name: string
  type: 'income' | 'expense'
  color?: string
}

export interface PersonalTransactionFormData {
  account_id: string
  category_id?: string
  balance_category_id?: string
  day: number
  amount: number
  note?: string
}

export interface BalanceCategoryFormData {
  name: string
  initial_balance: number
  color?: string
}
