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
