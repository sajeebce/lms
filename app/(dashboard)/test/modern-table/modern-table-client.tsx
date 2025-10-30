'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// Sample data type
type Store = {
  id: string
  city: string
  banner: string
  area: string
  type: string
  state: string
  avgBasket: number
}

// Sample data (based on your screenshot)
const sampleData: Store[] = [
  {
    id: '1',
    city: 'Lyon',
    banner: 'SUPER',
    area: 'CENTRE-EST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 31.53,
  },
  {
    id: '2',
    city: 'Paris',
    banner: 'SUPER',
    area: 'REGION PARISIENNE',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 27.32,
  },
  {
    id: '3',
    city: 'La Gorgue',
    banner: 'HYPER',
    area: 'NORD',
    type: 'Franchisé',
    state: 'CLOSED',
    avgBasket: 0.0,
  },
  {
    id: '4',
    city: 'Béziers',
    banner: 'SUPER',
    area: 'SUD EST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 31.53,
  },
  {
    id: '5',
    city: 'Toulouse',
    banner: 'HYPER',
    area: 'SUD OUEST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 32.12,
  },
  {
    id: '6',
    city: 'Lyon Berliet',
    banner: 'HYPER',
    area: 'CENTRE-EST',
    type: 'Non franchisé',
    state: 'CLOSED',
    avgBasket: 0.0,
  },
  {
    id: '7',
    city: 'Pauillac',
    banner: 'HYPER',
    area: 'SUD OUEST',
    type: 'Non franchisé',
    state: 'OPEN',
    avgBasket: 24.72,
  },
  {
    id: '8',
    city: 'Marseille',
    banner: 'SUPER',
    area: 'SUD EST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 28.45,
  },
  {
    id: '9',
    city: 'Lille',
    banner: 'HYPER',
    area: 'NORD',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 29.87,
  },
  {
    id: '10',
    city: 'Bordeaux',
    banner: 'SUPER',
    area: 'SUD OUEST',
    type: 'Non franchisé',
    state: 'CLOSED',
    avgBasket: 0.0,
  },
  {
    id: '11',
    city: 'Nice',
    banner: 'HYPER',
    area: 'SUD EST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 33.21,
  },
  {
    id: '12',
    city: 'Nantes',
    banner: 'SUPER',
    area: 'OUEST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 26.54,
  },
  {
    id: '13',
    city: 'Strasbourg',
    banner: 'HYPER',
    area: 'EST',
    type: 'Non franchisé',
    state: 'OPEN',
    avgBasket: 30.12,
  },
  {
    id: '14',
    city: 'Montpellier',
    banner: 'SUPER',
    area: 'SUD EST',
    type: 'Franchisé',
    state: 'CLOSED',
    avgBasket: 0.0,
  },
  {
    id: '15',
    city: 'Rennes',
    banner: 'HYPER',
    area: 'OUEST',
    type: 'Franchisé',
    state: 'OPEN',
    avgBasket: 27.89,
  },
]

// Badge styles based on your screenshot
const areaBadgeStyles: Record<string, string> = {
  'CENTRE-EST': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300',
  'REGION PARISIENNE': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  'NORD': 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
  'SUD EST': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  'SUD OUEST': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  'OUEST': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  'EST': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
}

const bannerBadgeStyles: Record<string, string> = {
  'SUPER': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  'HYPER': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300',
}

const stateBadgeStyles: Record<string, string> = {
  'OPEN': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  'CLOSED': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
}

export function ModernTableClient() {
  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: 'city',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="City" />
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('city')}</div>,
    },
    {
      accessorKey: 'banner',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Banner" />
      ),
      cell: ({ row }) => {
        const banner = row.getValue('banner') as string
        return (
          <Badge variant="outline" className={bannerBadgeStyles[banner]}>
            {banner}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'area',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Area" />
      ),
      cell: ({ row }) => {
        const area = row.getValue('area') as string
        return (
          <Badge variant="outline" className={areaBadgeStyles[area]}>
            {area}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => <div>{row.getValue('type')}</div>,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'state',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="State" />
      ),
      cell: ({ row }) => {
        const state = row.getValue('state') as string
        return (
          <Badge variant="outline" className={stateBadgeStyles[state]}>
            {state === 'OPEN' ? '🟢' : '🔴'} {state}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'avgBasket',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Avg Basket" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('avgBasket'))
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const store = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(store.id)
                  toast.success('Store ID copied to clipboard')
                }}
              >
                Copy store ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info(`Editing ${store.city}`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.error(`Deleting ${store.city}`)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleExport = (data: Store[]) => {
    // Convert to CSV
    const headers = ['City', 'Banner', 'Area', 'Type', 'State', 'Avg Basket']
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [row.city, row.banner, row.area, row.type, row.state, row.avgBasket].join(',')
      ),
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'stores-export.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success(`Exported ${data.length} rows to CSV`)
  }

  return (
    <div className="rounded-lg border bg-white dark:bg-neutral-900 p-6">
      <DataTable
        columns={columns}
        data={sampleData}
        searchKey="city"
        searchPlaceholder="Search by city..."
        filterableColumns={[
          {
            id: 'area',
            title: 'Area',
            options: [
              { label: 'Centre-Est', value: 'CENTRE-EST' },
              { label: 'Region Parisienne', value: 'REGION PARISIENNE' },
              { label: 'Nord', value: 'NORD' },
              { label: 'Sud Est', value: 'SUD EST' },
              { label: 'Sud Ouest', value: 'SUD OUEST' },
              { label: 'Ouest', value: 'OUEST' },
              { label: 'Est', value: 'EST' },
            ],
          },
          {
            id: 'banner',
            title: 'Banner',
            options: [
              { label: 'Super', value: 'SUPER' },
              { label: 'Hyper', value: 'HYPER' },
            ],
          },
          {
            id: 'type',
            title: 'Type',
            options: [
              { label: 'Franchisé', value: 'Franchisé' },
              { label: 'Non franchisé', value: 'Non franchisé' },
            ],
          },
          {
            id: 'state',
            title: 'State',
            options: [
              { label: 'Open', value: 'OPEN' },
              { label: 'Closed', value: 'CLOSED' },
            ],
          },
        ]}
        onExport={handleExport}
      />
    </div>
  )
}

