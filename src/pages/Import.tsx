import { Header } from '../components/layout/Header'

export function Import() {
  return (
    <div>
      <Header title="Import Data" />
      <div className="p-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Import CSV Data</h2>
          <p className="text-gray-600">
            Import your historical data from CSV files here.
          </p>
        </div>
      </div>
    </div>
  )
}
