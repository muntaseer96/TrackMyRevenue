import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import {
  PortfolioSummary,
  AssetList,
  AssetForm,
  TransactionForm,
  ValuationForm,
  AssetAllocationChart,
} from '../components/portfolio'
import { DeleteConfirmation } from '../components/websites/DeleteConfirmation'
import { useCreateAsset, useUpdateAsset, useDeleteAsset } from '../hooks/useAssets'
import { useCreateAssetTransaction } from '../hooks/useAssetTransactions'
import { useUpsertAssetValuation } from '../hooks/useAssetValuations'
import { usePortfolioStats } from '../hooks/usePortfolioStats'
import type { Asset, AssetType, AssetFormData } from '../types'

export function Investments() {
  // Form states
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false)
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)
  const [isValuationFormOpen, setIsValuationFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all')

  // Data
  const stats = usePortfolioStats()

  // Mutations
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()
  const createTransaction = useCreateAssetTransaction()
  const upsertValuation = useUpsertAssetValuation()

  // Asset form handlers
  const handleAddAsset = () => {
    setSelectedAsset(null)
    setIsAssetFormOpen(true)
  }

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsAssetFormOpen(true)
  }

  const handleAssetSubmit = async (data: any) => {
    const formData = data as AssetFormData
    if (selectedAsset) {
      await updateAsset.mutateAsync({ id: selectedAsset.id, data: formData })
    } else {
      await createAsset.mutateAsync(formData)
    }
    setIsAssetFormOpen(false)
    setSelectedAsset(null)
  }

  // Delete handlers
  const handleDeleteClick = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedAsset) {
      await deleteAsset.mutateAsync(selectedAsset.id)
      setIsDeleteOpen(false)
      setSelectedAsset(null)
    }
  }

  // Transaction form handlers
  const handleAddTransaction = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsTransactionFormOpen(true)
  }

  const handleTransactionSubmit = async (data: any) => {
    if (selectedAsset) {
      await createTransaction.mutateAsync({
        asset_id: selectedAsset.id,
        transaction_type: data.transaction_type,
        year: data.year,
        month: data.month,
        day: data.day || null,
        amount: data.amount,
        quantity: data.quantity || null,
        price_per_unit: data.price_per_unit || null,
        fees: data.fees || 0,
        notes: data.notes || null,
      })
      setIsTransactionFormOpen(false)
      setSelectedAsset(null)
    }
  }

  // Valuation form handlers
  const handleUpdateValue = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsValuationFormOpen(true)
  }

  const handleValuationSubmit = async (data: any) => {
    if (selectedAsset) {
      await upsertValuation.mutateAsync({
        asset_id: selectedAsset.id,
        year: data.year,
        month: data.month,
        value: data.value,
      })
      setIsValuationFormOpen(false)
      setSelectedAsset(null)
    }
  }

  return (
    <div>
      <Header
        title="Portfolio"
        action={
          <Button onClick={handleAddAsset}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <PortfolioSummary
          totalValue={stats.totalPortfolioValue}
          gainLoss={stats.totalUnrealizedGainLoss}
          totalIncome={stats.totalIncome}
          roi={stats.overallROI}
          isLoading={stats.isLoading}
        />

        {/* Tabs */}
        <Tabs defaultValue="assets">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <AssetList
              assets={stats.assetsWithStats}
              filterType={filterType}
              onFilterChange={setFilterType}
              onEdit={handleEditAsset}
              onDelete={handleDeleteClick}
              onAddTransaction={handleAddTransaction}
              onUpdateValue={handleUpdateValue}
              isLoading={stats.isLoading}
            />
          </TabsContent>

          <TabsContent value="overview">
            <AssetAllocationChart allocationByType={stats.allocationByType} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Asset Form Modal */}
      <AssetForm
        open={isAssetFormOpen}
        onOpenChange={setIsAssetFormOpen}
        onSubmit={handleAssetSubmit}
        asset={selectedAsset}
        isLoading={createAsset.isPending || updateAsset.isPending}
      />

      {/* Transaction Form Modal */}
      <TransactionForm
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        onSubmit={handleTransactionSubmit}
        asset={selectedAsset}
        isLoading={createTransaction.isPending}
      />

      {/* Valuation Form Modal */}
      <ValuationForm
        open={isValuationFormOpen}
        onOpenChange={setIsValuationFormOpen}
        onSubmit={handleValuationSubmit}
        asset={selectedAsset}
        isLoading={upsertValuation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedAsset?.name ?? 'Asset'}?`}
        description="This will permanently delete this asset and all associated transactions and valuations."
        isLoading={deleteAsset.isPending}
      />
    </div>
  )
}
