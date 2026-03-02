import { useState } from 'react'
import { Settings, Plus, AlertTriangle } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import {
  ZakatSummary,
  WealthBreakdown,
  ZakatYearSetup,
  ZakatPaymentForm,
  ZakatPaymentList,
  ZakatEncouragement,
} from '../components/zakat'
import {
  useZakatYear,
  useZakatPayments,
  useUpsertZakatYear,
  useCreateZakatPayment,
  useUpdateZakatPayment,
  useDeleteZakatPayment,
} from '../hooks/useZakat'
import { useZakatStats } from '../hooks/useZakatStats'
import { useYearStore } from '../stores/yearStore'
import { toast } from '../components/ui/useToast'
import type { ZakatPayment } from '../types'

export function Zakat() {
  const { selectedYear: year } = useYearStore()

  // Modal states
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<ZakatPayment | null>(null)

  // Data hooks
  const { data: zakatYear, isLoading: yearLoading } = useZakatYear(year)
  const { data: payments, isLoading: paymentsLoading } = useZakatPayments(zakatYear?.id)

  // Use the configured calculation month, or default to current month
  const calcMonth = zakatYear?.calculation_month ?? new Date().getMonth() + 1
  const stats = useZakatStats(year, calcMonth)

  // Mutation hooks
  const upsertYear = useUpsertZakatYear()
  const createPayment = useCreateZakatPayment()
  const updatePayment = useUpdateZakatPayment()
  const deletePayment = useDeleteZakatPayment()

  const handleSetupSubmit = (data: { gold_price_per_gram: number; calculation_month: number; payoneer_balance: number; paypal_balance: number; exchange_rate: number; notes?: string | null }) => {
    upsertYear.mutate(
      { year, ...data },
      {
        onSuccess: () => {
          setIsSetupOpen(false)
          toast({ title: `Zakat setup ${zakatYear ? 'updated' : 'saved'} for ${year}` })
        },
        onError: (err) => {
          toast({ title: 'Error saving setup', description: err.message, variant: 'destructive' })
        },
      }
    )
  }

  const handlePaymentSubmit = (data: { amount: number; payment_date?: string | null; note?: string | null }) => {
    if (!zakatYear) return

    if (editingPayment) {
      updatePayment.mutate(
        { id: editingPayment.id, data: { ...data, zakat_year_id: zakatYear.id } },
        {
          onSuccess: () => {
            setIsPaymentFormOpen(false)
            setEditingPayment(null)
            toast({ title: 'Payment updated' })
          },
          onError: (err) => {
            toast({ title: 'Error updating payment', description: err.message, variant: 'destructive' })
          },
        }
      )
    } else {
      createPayment.mutate(
        { ...data, zakat_year_id: zakatYear.id },
        {
          onSuccess: () => {
            setIsPaymentFormOpen(false)
            toast({ title: 'Payment recorded' })
          },
          onError: (err) => {
            toast({ title: 'Error recording payment', description: err.message, variant: 'destructive' })
          },
        }
      )
    }
  }

  const handleEditPayment = (payment: ZakatPayment) => {
    setEditingPayment(payment)
    setIsPaymentFormOpen(true)
  }

  const handleDeletePayment = (payment: ZakatPayment) => {
    if (!confirm('Delete this payment?')) return
    deletePayment.mutate(
      { id: payment.id, zakatYearId: payment.zakat_year_id },
      {
        onSuccess: () => toast({ title: 'Payment deleted' }),
        onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
      }
    )
  }

  const isYearConfigured = !!zakatYear

  return (
    <div>
      <Header
        title="Zakat Calculator"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSetupOpen(true)}
            >
              <Settings className="w-4 h-4 mr-1" />
              {isYearConfigured ? 'Edit Setup' : 'Setup Year'}
            </Button>
            {isYearConfigured && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingPayment(null)
                  setIsPaymentFormOpen(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Setup prompt if year not configured */}
        {!yearLoading && !isYearConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Zakat not configured for {year}</p>
              <p className="text-sm text-amber-700 mt-1">
                Click "Setup Year" to enter the gold price per gram, select your calculation month, and calculate your Nisab threshold.
              </p>
            </div>
          </div>
        )}

        {/* KPI Summary */}
        {isYearConfigured && (
          <ZakatSummary
            totalWealth={stats.totalWealth}
            zakatDue={stats.zakatDue}
            totalPaid={stats.totalPaid}
            remaining={stats.remaining}
            isAboveNisab={stats.isAboveNisab}
            isLoading={stats.isLoading}
          />
        )}

        {/* Tabs: Wealth Breakdown & Payments */}
        <Tabs defaultValue="wealth">
          <TabsList>
            <TabsTrigger value="wealth">Wealth Breakdown</TabsTrigger>
            {isYearConfigured && <TabsTrigger value="payments">Payment Records</TabsTrigger>}
            <TabsTrigger value="encouragement">Encouragement</TabsTrigger>
          </TabsList>

          <TabsContent value="wealth">
            <WealthBreakdown
              items={stats.wealthItems}
              cashWealth={stats.cashWealth}
              portfolioWealth={stats.portfolioWealth}
              totalWealth={stats.totalWealth}
            />
          </TabsContent>

          {isYearConfigured && (
            <TabsContent value="payments">
              <ZakatPaymentList
                payments={payments || []}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
                isLoading={paymentsLoading}
              />
            </TabsContent>
          )}

          <TabsContent value="encouragement">
            <ZakatEncouragement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ZakatYearSetup
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        onSubmit={handleSetupSubmit}
        year={year}
        existing={zakatYear}
        isLoading={upsertYear.isPending}
      />

      <ZakatPaymentForm
        open={isPaymentFormOpen}
        onOpenChange={(open) => {
          setIsPaymentFormOpen(open)
          if (!open) setEditingPayment(null)
        }}
        onSubmit={handlePaymentSubmit}
        payment={editingPayment}
        isLoading={createPayment.isPending || updatePayment.isPending}
      />
    </div>
  )
}
