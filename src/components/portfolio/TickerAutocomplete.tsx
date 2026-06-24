import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useSymbolSearch, type SymbolResult } from '../../hooks/useSymbolSearch'

interface TickerAutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (result: SymbolResult) => void
  placeholder?: string
  error?: string
}

export function TickerAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Search e.g. AAPL, Tesla, BTC',
  error,
}: TickerAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [debounced, setDebounced] = useState(value)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce the typed value before querying.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value.trim()), 300)
    return () => clearTimeout(t)
  }, [value])

  const { data: results = [], isFetching } = useSymbolSearch(debounced, open && debounced.length >= 1)

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (r: SymbolResult) => {
    onChange(r.symbol)
    onSelect?.(r)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault()
      select(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && debounced.length >= 1

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2 border rounded-lg outline-none transition-all focus:ring-2 focus:ring-primary focus:border-transparent ${
            error ? 'border-danger focus:ring-danger' : 'border-gray-300'
          }`}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => value.trim().length >= 1 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-gray-400">
              {isFetching ? 'Searching…' : 'No matches — you can still type a ticker manually.'}
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.symbol}-${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left ${
                  i === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{r.symbol}</span>
                    <span className="text-xs text-gray-400">{r.exchange}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{r.name}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-gray-400 flex-shrink-0">
                  {r.type}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
