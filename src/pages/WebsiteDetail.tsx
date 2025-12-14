import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { CategoryList } from '../components/categories/CategoryList'
import { CategoryForm } from '../components/categories/CategoryForm'
import { DeleteConfirmation } from '../components/websites/DeleteConfirmation'
import { MonthlyDataEntry } from '../components/websites/MonthlyDataEntry'
import { WebsiteCharts } from '../components/websites/WebsiteCharts'
import { WebsiteAnnualExpenses } from '../components/websites/WebsiteAnnualExpenses'
import { useWebsite } from '../hooks/useWebsites'
import {
  useCategoriesByWebsite,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories'
import type { Category } from '../types'

export function WebsiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState<'revenue' | 'expense'>('revenue')
  const [mainTab, setMainTab] = useState<'monthly' | 'analytics' | 'categories' | 'annual'>('monthly')

  // Query website details
  const { data: website, isLoading: isWebsiteLoading } = useWebsite(id)

  // Query categories for this website
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategoriesByWebsite(id)

  // Mutations
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  // Filter categories by type
  const revenueCategories = useMemo(
    () => categories.filter((c) => c.type === 'revenue'),
    [categories]
  )
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )

  // Handlers
  const handleAddNew = () => {
    setSelectedCategory(null)
    setIsFormOpen(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setIsFormOpen(true)
  }

  const handleDelete = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: { name: string; type: 'revenue' | 'expense' }) => {
    if (!id) return

    try {
      if (selectedCategory) {
        // Update existing
        await updateMutation.mutateAsync({
          id: selectedCategory.id,
          data: { name: data.name, type: data.type },
        })
      } else {
        // Create new
        await createMutation.mutateAsync({
          name: data.name,
          type: data.type,
          website_id: id,
        })
      }
      setIsFormOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCategory || !id) return

    try {
      await deleteMutation.mutateAsync({
        id: selectedCategory.id,
        websiteId: id,
      })
      setIsDeleteOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  if (isWebsiteLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!website) {
    return (
      <div>
        <Header title="Website Not Found" />
        <div className="p-6">
          <p className="text-gray-600 mb-4">The website you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/websites')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Websites
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={website.name}
        action={
          <Button variant="secondary" onClick={() => navigate('/websites')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="p-6">
        {/* Website Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{website.name}</h2>
              {website.url && (
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-link hover:underline"
                >
                  {website.url}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Tabs: Monthly Data / Analytics / Categories / Annual Expenses */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'monthly' | 'analytics' | 'categories' | 'annual')}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">Monthly Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="annual">Annual Expenses</TabsTrigger>
          </TabsList>

          {/* Monthly Data Tab */}
          <TabsContent value="monthly">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Financial Data</h3>
              </div>
              {id && <MonthlyDataEntry websiteId={id} />}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Website Analytics</h3>
              </div>
              {id && <WebsiteCharts websiteId={id} />}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'revenue' | 'expense')}>
                <div className="px-4 pt-4">
                  <TabsList>
                    <TabsTrigger value="revenue">
                      Revenue ({revenueCategories.length})
                    </TabsTrigger>
                    <TabsTrigger value="expense">
                      Expense ({expenseCategories.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="revenue" className="p-4 pt-2">
                  <CategoryList
                    categories={revenueCategories}
                    isLoading={isCategoriesLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    emptyMessage="No revenue categories yet. Add one to start tracking income."
                  />
                </TabsContent>

                <TabsContent value="expense" className="p-4 pt-2">
                  <CategoryList
                    categories={expenseCategories}
                    isLoading={isCategoriesLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    emptyMessage="No expense categories yet. Add one to start tracking costs."
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Annual Expenses Tab */}
          <TabsContent value="annual">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Annual Expenses</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track yearly expenses specific to this website (domain, subscriptions, etc.)
                </p>
              </div>
              {id && website && <WebsiteAnnualExpenses websiteId={id} websiteName={website.name} />}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Form Modal */}
      <CategoryForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        defaultType={activeTab}
        isLoading={isFormLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${selectedCategory?.name}"?`}
        description={`Are you sure you want to delete the ${selectedCategory?.type} category "${selectedCategory?.name}"? This may affect monthly entries using this category.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
