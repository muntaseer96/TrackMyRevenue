import { useCurrencyStore } from '../../stores/currencyStore'

export function CurrencyToggle() {
  const { currencyView, setCurrencyView } = useCurrencyStore()

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setCurrencyView('USD')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currencyView === 'USD'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        USD
      </button>
      <button
        onClick={() => setCurrencyView('BDT')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          currencyView === 'BDT'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        BDT
      </button>
    </div>
  )
}
