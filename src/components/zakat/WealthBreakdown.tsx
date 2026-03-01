import { Check, X } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from '../ui/Table'
import type { WealthItem } from '../../hooks/useZakatStats'

interface WealthBreakdownProps {
  items: WealthItem[]
  cashWealth: number
  portfolioWealth: number
  totalWealth: number
}

function formatBDT(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN')
  return amount < 0 ? `-৳${formatted}` : `৳${formatted}`
}

export function WealthBreakdown({ items, cashWealth, portfolioWealth, totalWealth }: WealthBreakdownProps) {
  const accountItems = items.filter(i => i.type === 'account')
  const assetItems = items.filter(i => i.type === 'asset')

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Wealth Breakdown</h3>
        </div>
        <Table>
          <TableBody>
            <TableEmpty columns={4} message="No accounts or assets found. Add cashflow accounts and portfolio assets to see your wealth breakdown." />
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Wealth Breakdown</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Value (BDT)</TableHead>
            <TableHead className="text-center">Zakatable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Cash accounts */}
          {accountItems.length > 0 && (
            <>
              <TableRow className="bg-gray-50">
                <TableCell colSpan={4} className="font-semibold text-gray-700 text-sm">
                  Cash Accounts
                </TableCell>
              </TableRow>
              {accountItems.map((item, idx) => (
                <TableRow key={`account-${idx}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Account</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.value)}</TableCell>
                  <TableCell className="text-center">
                    <Check className="w-5 h-5 text-green-600 mx-auto" strokeWidth={3} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t border-gray-200">
                <TableCell colSpan={2} className="font-semibold text-sm text-gray-600">
                  Cash Subtotal
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatBDT(cashWealth)}</TableCell>
                <TableCell />
              </TableRow>
            </>
          )}

          {/* Portfolio assets */}
          {assetItems.length > 0 && (
            <>
              <TableRow className="bg-gray-50">
                <TableCell colSpan={4} className="font-semibold text-gray-700 text-sm">
                  Portfolio Assets
                </TableCell>
              </TableRow>
              {assetItems.map((item, idx) => (
                <TableRow key={`asset-${idx}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Asset</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatBDT(item.value)}</TableCell>
                  <TableCell className="text-center">
                    {item.zakatable ? (
                      <Check className="w-5 h-5 text-green-600 mx-auto" strokeWidth={3} />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" strokeWidth={3} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t border-gray-200">
                <TableCell colSpan={2} className="font-semibold text-sm text-gray-600">
                  Portfolio Subtotal (Zakatable)
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatBDT(portfolioWealth)}</TableCell>
                <TableCell />
              </TableRow>
            </>
          )}

          {/* Grand total */}
          <TableRow className="bg-primary/5 border-t-2 border-primary/20">
            <TableCell colSpan={2} className="font-bold text-gray-900">
              Total Zakatable Wealth
            </TableCell>
            <TableCell className="text-right font-mono font-bold text-lg">{formatBDT(totalWealth)}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
