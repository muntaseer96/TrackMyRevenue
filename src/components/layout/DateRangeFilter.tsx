import { useState } from 'react'
import { CalendarRange, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { Button } from '../ui/Button'
import {
  useFilterStore,
  getPresetLabel,
  formatDateRange,
  type FilterPreset,
} from '../../stores/filterStore'
import { useYearStore } from '../../stores/yearStore'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const PRESET_OPTIONS: { value: FilterPreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'full_year', label: 'Full Year' },
  { value: 'custom', label: 'Custom Range' },
]

export function DateRangeFilter() {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const {
    year,
    startMonth,
    endMonth,
    preset,
    setYear,
    setThisMonth,
    setLast3Months,
    setLast6Months,
    setYearToDate,
    setFullYear,
    setCustomRange,
  } = useFilterStore()

  const { availableYears } = useYearStore()

  const handlePresetChange = (value: FilterPreset) => {
    switch (value) {
      case 'this_month':
        setThisMonth()
        setShowCustom(false)
        break
      case 'last_3_months':
        setLast3Months()
        setShowCustom(false)
        break
      case 'last_6_months':
        setLast6Months()
        setShowCustom(false)
        break
      case 'year_to_date':
        setYearToDate()
        setShowCustom(false)
        break
      case 'full_year':
        setFullYear()
        setShowCustom(false)
        break
      case 'custom':
        setShowCustom(true)
        break
    }
    if (value !== 'custom') {
      setIsOpen(false)
    }
  }

  const handleCustomRangeApply = () => {
    setIsOpen(false)
    setShowCustom(false)
  }

  const displayLabel = preset === 'custom'
    ? formatDateRange(startMonth, endMonth, year)
    : getPresetLabel(preset)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <CalendarRange className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{displayLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setShowCustom(false)
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[280px]">
            {/* Preset Options */}
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 px-2 mb-1">Quick Filters</p>
              {PRESET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePresetChange(option.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    preset === option.value
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom Range Section */}
            {showCustom && (
              <div className="border-t border-gray-200 p-3 space-y-3">
                <p className="text-xs font-medium text-gray-500">Custom Range</p>

                {/* Year Selector */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <Select
                      value={startMonth.toString()}
                      onValueChange={(v) => {
                        const newStart = parseInt(v)
                        setCustomRange(newStart, Math.max(newStart, endMonth))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <Select
                      value={endMonth.toString()}
                      onValueChange={(v) => {
                        const newEnd = parseInt(v)
                        setCustomRange(Math.min(startMonth, newEnd), newEnd)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.filter((m) => m.value >= startMonth).map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCustomRangeApply}
                >
                  Apply Range
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
