import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, ExternalLink, Globe } from 'lucide-react'
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
import type { Website } from '../../types'

interface WebsiteListProps {
  websites: Website[]
  isLoading?: boolean
  onEdit: (website: Website) => void
  onDelete: (website: Website) => void
}

export function WebsiteList({
  websites,
  isLoading,
  onEdit,
  onDelete,
}: WebsiteListProps) {
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={4} rows={5} />
          </TableBody>
        </Table>
      </div>
    )
  }

  if (websites.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No websites yet
        </h3>
        <p className="text-gray-500 mb-4">
          Add your first website or income source to start tracking revenue.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {websites.map((website) => (
            <TableRow
              key={website.id}
              className="cursor-pointer"
              onClick={() => navigate(`/websites/${website.id}`)}
            >
              <TableCell className="font-medium">{website.name}</TableCell>
              <TableCell>
                {website.url ? (
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {new URL(website.url).hostname}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell className="text-gray-500">
                {website.created_at ? formatDate(website.created_at) : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(website)
                    }}
                    aria-label="Edit website"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(website)
                    }}
                    aria-label="Delete website"
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
