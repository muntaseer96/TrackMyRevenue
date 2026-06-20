import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Settings, Plus, AlertTriangle, Info } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import {
  ZakatSummary,
  WealthBreakdown,
  ZakatYearSetup,
  ZakatPaymentForm,
  ZakatPaymentList,
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

export function AdvanceZakat() {
  const { availableYears } = useYearStore()

  // The advance year is always the next year after the latest activated (global) year.
  // It auto-rolls forward: once you genuinely create 2027 sitewide, this becomes 2028, etc.
  const advanceYear = availableYears.length
    ? Math.max(...availableYears) + 1
    : new Date().getFullYear() + 1

  // Modal states
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<ZakatPayment | null>(null)

  // Data hooks (independent of the global year selector)
  const { data: zakatYear, isLoading: yearLoading } = useZakatYear(advanceYear)
  const { data: payments, isLoading: paymentsLoading } = useZakatPayments(zakatYear?.id)

  // Use the configured calculation month, or default to current month
  const calcMonth = zakatYear?.calculation_month ?? new Date().getMonth() + 1
  const stats = useZakatStats(advanceYear, calcMonth)

  // Mutation hooks
  const upsertYear = useUpsertZakatYear()
  const createPayment = useCreateZakatPayment()
  const updatePayment = useUpdateZakatPayment()
  const deletePayment = useDeleteZakatPayment()

  const handleSetupSubmit = (data: { gold_price_per_gram: number; calculation_month: number; payoneer_balance: number; paypal_balance: number; exchange_rate: number; notes?: string | null }) => {
    upsertYear.mutate(
      { year: advanceYear, ...data },
      {
        onSuccess: () => {
          setIsSetupOpen(false)
          toast({ title: `Advance Zakat setup ${zakatYear ? 'updated' : 'saved'} for ${advanceYear}` })
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
            toast({ title: 'Advance payment recorded' })
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
        title={`Advance Zakat — ${advanceYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSetupOpen(true)}
            >
              <Settings className="w-4 h-4 mr-1" />
              {isYearConfigured ? 'Edit Setup' : `Setup ${advanceYear}`}
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
        {/* Back link */}
        <Link
          to="/zakat"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Zakat
        </Link>

        {/* Explainer: what advance Zakat is and how it reconciles */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 space-y-1.5">
            <p className="font-semibold">Paying {advanceYear} Zakat in advance (Taʿjīl az-Zakāh)</p>
            <p>
              Log the Zakat you give through the year here. When {advanceYear} completes (your hawl),
              finalize the gold price &amp; balances on the main Zakat page — these payments are then
              written off against the actual amount due.
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>Make the <span className="font-medium">intention (niyyah)</span> that each payment is Zakat.</li>
              <li>Give to an <span className="font-medium">eligible recipient</span> (the 8 categories — poor, needy, etc.).</li>
              <li>Figures below are an <span className="font-medium">estimate</span> from your current wealth — finalized at the hawl.</li>
            </ul>
            <p className="text-xs text-blue-600 pt-0.5">
              Permissible per the majority of scholars (evidence: the Prophet ﷺ allowed al-ʿAbbās to pay two years ahead).
              Confirm specifics with a trusted scholar.
            </p>
          </div>
        </div>

        {/* Setup prompt if the advance year is not configured yet */}
        {!yearLoading && !isYearConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Advance Zakat not set up for {advanceYear}</p>
              <p className="text-sm text-amber-700 mt-1">
                Click "Setup {advanceYear}" to enter the gold price per gram and calculation month, then start logging advance payments.
              </p>
            </div>
          </div>
        )}

        {/* Estimated KPI Summary */}
        {isYearConfigured && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
              Estimated — provisional until {advanceYear} hawl is finalized
            </p>
            <ZakatSummary
              totalWealth={stats.totalWealth}
              zakatDue={stats.zakatDue}
              totalPaid={stats.totalPaid}
              remaining={stats.remaining}
              isAboveNisab={stats.isAboveNisab}
              isLoading={stats.isLoading}
            />
          </div>
        )}

        {/* Tabs: Estimated Wealth & Advance Payments */}
        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments">Advance Payments</TabsTrigger>
            <TabsTrigger value="wealth">Estimated Wealth</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            {isYearConfigured ? (
              <ZakatPaymentList
                payments={payments || []}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
                isLoading={paymentsLoading}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
                Set up {advanceYear} first to start logging advance payments.
              </div>
            )}
          </TabsContent>

          <TabsContent value="wealth">
            <WealthBreakdown
              items={stats.wealthItems}
              cashWealth={stats.cashWealth}
              portfolioWealth={stats.portfolioWealth}
              totalWealth={stats.totalWealth}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ZakatYearSetup
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        onSubmit={handleSetupSubmit}
        year={advanceYear}
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
