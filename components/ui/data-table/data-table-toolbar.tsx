'use client'

import { X } from 'lucide-react'
import { Table } from '@tanstack/react-table'
import { Search, Download, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTableFacetedFilter } from './data-table-faceted-filter'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchKey?: string
  searchPlaceholder?: string
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
      icon?: React.ComponentType<{ className?: string }>
    }[]
  }[]
  onExport?: (data: TData[]) => void
}

export function DataTableToolbar<TData>({
  table,
  searchKey = 'name',
  searchPlaceholder = 'Search...',
  filterableColumns = [],
  onExport,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="space-y-4">
      {/* Top Row: Search + Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9 h-10 bg-white dark:bg-neutral-900"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(table.getFilteredRowModel().rows.map(row => row.original))}
              className="h-10 gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      {filterableColumns.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterableColumns.map((column) => {
            const tableColumn = table.getColumn(column.id)
            if (!tableColumn) return null

            return (
              <DataTableFacetedFilter
                key={column.id}
                column={tableColumn}
                title={column.title}
                options={column.options}
              />
            )
          })}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

