import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '../ui/Button'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface MonthSelectorProps {
  year: number
  month: number
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
}

export function MonthSelector({ year, month, onYearChange, onMonthChange }: MonthSelectorProps) {
  const goToPreviousMonth = () => {
    if (month === 1) {
      onYearChange(year - 1)
      onMonthChange(12)
    } else {
      onMonthChange(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      onYearChange(year + 1)
      onMonthChange(1)
    } else {
      onMonthChange(month + 1)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg min-w-[160px] justify-center">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        aria-label="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
