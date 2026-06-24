import { useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { toast } from '../ui/useToast'
import { parseExpense } from '../../utils/expenseParser'
import { useCreateDailyExpense } from '../../hooks/useDailyExpenses'
import { useDailyExpenseCategories } from '../../hooks/useDailyExpenseCategories'
import { DEFAULT_EXPENSE_CATEGORY_NAMES } from '../../types'
import type { DailyExpenseCurrency } from '../../types'

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-primary focus:border-transparent'

export function QuickAddExpense() {
  const [raw, setRaw] = useState('')
  const createExpense = useCreateDailyExpense()
  const { data: dbCategories } = useDailyExpenseCategories()

  // Live list of category names: from the DB, falling back to defaults while loading.
  const categoryNames =
    dbCategories && dbCategories.length > 0
      ? dbCategories.map((c) => c.name)
      : [...DEFAULT_EXPENSE_CATEGORY_NAMES]

  // Editable fields — re-derived from the parsed input but overridable before saving.
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<DailyExpenseCurrency>('BDT')
  const [category, setCategory] = useState<string>('Other')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayStr())

  const parsed = useMemo(() => parseExpense(raw), [raw])

  // Whenever the raw text changes, refresh the editable fields from the parser.
  useEffect(() => {
    setAmount(parsed.amount ? String(parsed.amount) : '')
    setCurrency(parsed.currency)
    setCategory(parsed.category)
    setNote(parsed.note)
  }, [parsed])

  const handleAdd = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast({ title: 'Enter an amount', description: 'Type something like "tea 20".', variant: 'destructive' })
      return
    }

    try {
      await createExpense.mutateAsync({
        expense_date: date,
        amount: amt,
        currency,
        category,
        note: note || null,
        raw_input: raw.trim() || null,
      })
      toast({ title: 'Expense added', description: `${category} · ${currency} ${amt}` })
      setRaw('')
      setAmount('')
      setNote('')
      setCategory('Other')
      setCurrency('BDT')
      // Keep the date as-is so several same-day entries are quick.
    } catch (err) {
      toast({
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to submit (Shift+Enter for newline).
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-gray-900">Quick add</h3>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder={'e.g. "10 cigs 120 BDT", "tea 20", "rickshaw 80", "lunch 250"'}
        className={`${inputCls} resize-y min-h-[64px]`}
      />

      {/* Live parsed preview / override row */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-6 gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          aria-label="Amount"
          className={`${inputCls} col-span-1`}
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as DailyExpenseCurrency)}
          aria-label="Currency"
          className={`${inputCls} col-span-1`}
        >
          <option value="BDT">BDT</option>
          <option value="USD">USD</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className={`${inputCls} col-span-2`}
        >
          {(categoryNames.includes(category) ? categoryNames : [category, ...categoryNames]).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            )
          )}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          className={`${inputCls} col-span-2`}
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
          aria-label="Note"
          className={`${inputCls} col-span-2 sm:col-span-4`}
        />
        <Button
          onClick={handleAdd}
          loading={createExpense.isPending}
          className="col-span-2 sm:col-span-2"
        >
          <Plus className="w-4 h-4" />
          Add expense
        </Button>
      </div>
    </div>
  )
}
