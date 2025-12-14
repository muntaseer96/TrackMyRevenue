import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import {
  InvestmentSummary,
  InvestmentForm,
  DividendForm,
  InvestmentList,
} from '../components/investments'
import { DeleteConfirmation } from '../components/websites/DeleteConfirmation'
import {
  useInvestments,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
  useDividends,
  useCreateDividend,
  useDeleteDividend,
  useInvestmentStats,
  type InvestmentFormData,
  type DividendFormData,
} from '../hooks/useInvestments'
import type { Investment } from '../types'

export function Investments() {
  // Form states
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false)
  const [isDividendFormOpen, setIsDividendFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)

  // Data hooks
  const { data: investments = [], isLoading: investmentsLoading } = useInvestments()
  const { data: dividends = [], isLoading: dividendsLoading } = useDividends()
  const { totalPortfolio, totalDividends, dividendYield, isLoading: statsLoading } = useInvestmentStats()

  // Mutations
  const createInvestment = useCreateInvestment()
  const updateInvestment = useUpdateInvestment()
  const deleteInvestment = useDeleteInvestment()
  const createDividend = useCreateDividend()
  const deleteDividend = useDeleteDividend()

  // Investment form handlers
  const handleAddInvestment = () => {
    setSelectedInvestment(null)
    setIsInvestmentFormOpen(true)
  }

  const handleEditInvestment = (investment: Investment) => {
    setSelectedInvestment(investment)
    setIsInvestmentFormOpen(true)
  }

  const handleInvestmentSubmit = async (data: InvestmentFormData) => {
    if (selectedInvestment) {
      await updateInvestment.mutateAsync({ id: selectedInvestment.id, data })
    } else {
      await createInvestment.mutateAsync(data)
    }
    setIsInvestmentFormOpen(false)
    setSelectedInvestment(null)
  }

  // Delete handlers
  const handleDeleteClick = (investment: Investment) => {
    setSelectedInvestment(investment)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedInvestment) {
      await deleteInvestment.mutateAsync(selectedInvestment.id)
      setIsDeleteOpen(false)
      setSelectedInvestment(null)
    }
  }

  // Dividend form handlers
  const handleAddDividend = (investment: Investment) => {
    setSelectedInvestment(investment)
    setIsDividendFormOpen(true)
  }

  const handleDividendSubmit = async (data: Omit<DividendFormData, 'investment_id'>) => {
    if (selectedInvestment) {
      await createDividend.mutateAsync({
        investment_id: selectedInvestment.id,
        month: data.month,
        amount: data.amount,
      })
      setIsDividendFormOpen(false)
      setSelectedInvestment(null)
    }
  }

  const handleDeleteDividend = async (dividendId: string, investmentId: string) => {
    await deleteDividend.mutateAsync({ id: dividendId, investmentId })
  }

  const isLoading = investmentsLoading || dividendsLoading

  return (
    <div>
      <Header
        title="Investments"
        action={
          <Button onClick={handleAddInvestment}>
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <InvestmentSummary
          totalPortfolio={totalPortfolio}
          totalDividends={totalDividends}
          dividendYield={dividendYield}
          isLoading={statsLoading}
        />

        {/* Investment List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h2>
          <InvestmentList
            investments={investments}
            dividends={dividends}
            onEdit={handleEditInvestment}
            onDelete={handleDeleteClick}
            onAddDividend={handleAddDividend}
            onDeleteDividend={handleDeleteDividend}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Investment Form Modal */}
      <InvestmentForm
        open={isInvestmentFormOpen}
        onOpenChange={setIsInvestmentFormOpen}
        onSubmit={handleInvestmentSubmit}
        investment={selectedInvestment}
        isLoading={createInvestment.isPending || updateInvestment.isPending}
      />

      {/* Dividend Form Modal */}
      <DividendForm
        open={isDividendFormOpen}
        onOpenChange={setIsDividendFormOpen}
        onSubmit={handleDividendSubmit}
        companyName={selectedInvestment?.company_name ?? ''}
        isLoading={createDividend.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedInvestment?.company_name ?? 'Investment'}?`}
        description="This will permanently delete this investment and all associated dividend records."
        isLoading={deleteInvestment.isPending}
      />
    </div>
  )
}
