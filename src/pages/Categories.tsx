import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { useWebsites } from '../hooks/useWebsites'
import { useAllCategories } from '../hooks/useCategories'
import type { Website, Category } from '../types'

interface WebsiteWithCategories {
  website: Website
  revenueCategories: Category[]
  expenseCategories: Category[]
}

export function Categories() {
  const navigate = useNavigate()
  const { data: websites = [], isLoading: isWebsitesLoading } = useWebsites()
  const { data: categories = [], isLoading: isCategoriesLoading } = useAllCategories()

  const isLoading = isWebsitesLoading || isCategoriesLoading

  // Group categories by website
  const websitesWithCategories = useMemo(() => {
    const result: WebsiteWithCategories[] = []

    for (const website of websites) {
      const websiteCategories = categories.filter((c) => c.website_id === website.id)
      result.push({
        website,
        revenueCategories: websiteCategories.filter((c) => c.type === 'revenue'),
        expenseCategories: websiteCategories.filter((c) => c.type === 'expense'),
      })
    }

    return result
  }, [websites, categories])

  // Calculate totals
  const totalRevenue = categories.filter((c) => c.type === 'revenue').length
  const totalExpense = categories.filter((c) => c.type === 'expense').length

  if (isLoading) {
    return (
      <div>
        <Header title="Categories Overview" />
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Categories Overview" />

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expense Categories</p>
                <p className="text-2xl font-bold text-gray-900">{totalExpense}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Websites with Categories */}
        {websitesWithCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Tag className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
            <p className="text-gray-500">
              Add websites first, then create categories for each website.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {websitesWithCategories.map(({ website, revenueCategories, expenseCategories }) => (
              <div
                key={website.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/websites/${website.id}`)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{website.name}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Revenue Categories */}
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2">
                        Revenue ({revenueCategories.length})
                      </p>
                      {revenueCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {revenueCategories.slice(0, 5).map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                            >
                              {cat.name}
                            </span>
                          ))}
                          {revenueCategories.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{revenueCategories.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">None</p>
                      )}
                    </div>

                    {/* Expense Categories */}
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2">
                        Expense ({expenseCategories.length})
                      </p>
                      {expenseCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {expenseCategories.slice(0, 5).map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-200"
                            >
                              {cat.name}
                            </span>
                          ))}
                          {expenseCategories.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{expenseCategories.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">None</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
