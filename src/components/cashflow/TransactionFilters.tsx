import { Search, Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import type { PersonalCategory } from '../../types'

interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategoryId: string
  onCategoryChange: (categoryId: string) => void
  categories: PersonalCategory[]
  onAddTransaction: () => void
}

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  categories,
  onAddTransaction,
}: TransactionFiltersProps) {
  // Separate categories by type
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {incomeCategories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50">
                    Income
                  </div>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </>
              )}
              {expenseCategories.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-red-600 bg-red-50">
                    Expense
                  </div>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Transaction Button */}
      <Button onClick={onAddTransaction}>
        <Plus className="w-4 h-4 mr-1" />
        Add Transaction
      </Button>
    </div>
  )
}
