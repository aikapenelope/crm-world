'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, AlertTriangle } from 'lucide-react'

type PartRow = {
  id: string
  code: string
  name: string
  brand: string | null
  category: string
  cost_price: string
  sell_price: string
  currency: string
  quantity_in_stock: number
  reorder_point: number
  location: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  brakes: 'Frenos', engine: 'Motor', electrical: 'Eléctrico', suspension: 'Suspensión',
  filters: 'Filtros', fluids: 'Fluidos', body: 'Carrocería', other: 'Otro',
}

export default function AutoPartsPage() {
  const router = useRouter()
  const [parts, setParts] = React.useState<PartRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PartRow[] }>('/api/auto-parts/parts?pageSize=100', undefined, { fallback: { items: [] } })
      if (call.ok) { setParts(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [])

  const lowStock = parts.filter((p) => p.reorder_point > 0 && p.quantity_in_stock <= p.reorder_point).length

  const columns: ColumnDef<PartRow>[] = [
    { accessorKey: 'code', header: 'Código', cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'brand', header: 'Marca', cell: ({ row }) => row.original.brand ?? '—' },
    { accessorKey: 'category', header: 'Categoría', cell: ({ row }) => CATEGORY_LABELS[row.original.category] ?? row.original.category },
    {
      accessorKey: 'quantity_in_stock', header: 'Stock',
      cell: ({ row }) => {
        const isLow = row.original.reorder_point > 0 && row.original.quantity_in_stock <= row.original.reorder_point
        return <span className={`font-bold ${isLow ? 'text-destructive' : ''}`}>{row.original.quantity_in_stock}{isLow && <AlertTriangle className="inline ml-1 size-3" />}</span>
      },
    },
    { accessorKey: 'cost_price', header: 'Costo', cell: ({ row }) => `${row.original.currency} ${Number(row.original.cost_price).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` },
    { accessorKey: 'sell_price', header: 'Venta', cell: ({ row }) => `${row.original.currency} ${Number(row.original.sell_price).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` },
    { accessorKey: 'location', header: 'Ubicación', cell: ({ row }) => row.original.location ?? '—' },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repuestos</h1>
          <div className="flex gap-2">
            {lowStock > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="size-3" /> {lowStock} bajo mínimo
              </Badge>
            )}
            <Button type="button" onClick={() => router.push('/backend/auto_parts/create')}>
              <Plus className="mr-2 size-4" />Agregar
            </Button>
          </div>
        </div>
        <DataTable columns={columns} data={parts} isLoading={isLoading} searchPlaceholder="Buscar repuesto..." />
      </PageBody>
    </Page>
  )
}
