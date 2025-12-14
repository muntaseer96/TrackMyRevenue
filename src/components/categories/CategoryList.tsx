import { Pencil, Trash2, Tag } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
} from '../ui/Table'
import { Button } from '../ui/Button'
import type { Category } from '../../types'

interface CategoryListProps {
  categories: Category[]
  isLoading?: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  emptyMessage?: string
}

export function CategoryList({
  categories,
  isLoading,
  onEdit,
  onDelete,
  emptyMessage = 'No categories yet',
}: CategoryListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={3} rows={3} />
          </TableBody>
        </Table>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Tag className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.type === 'revenue'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.type === 'revenue' ? 'Revenue' : 'Expense'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                    aria-label="Edit category"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(category)}
                    aria-label="Delete category"
                    className="text-danger hover:text-danger hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
