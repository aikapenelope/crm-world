'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'

type InventoryRow = {
  id: string
  product_id: string
  warehouse_code: string
  quantity_available: number
  reorder_point: number
  reorder_quantity: number
  unit_cost: string
  currency: string
}

export default function InventoryAlertsPage() {
  const [items, setItems] = React.useState<InventoryRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: InventoryRow[] }>(
        '/api/dist-inventory/items?pageSize=200',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        const all = call.result?.items ?? []
        setItems(all.filter((i) => i.reorder_point > 0 && i.quantity_available <= i.reorder_point))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<InventoryRow>[] = [
    {
      accessorKey: 'product_id',
      header: 'Producto',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.product_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'warehouse_code',
      header: 'Bodega',
    },
    {
      accessorKey: 'quantity_available',
      header: 'Stock Actual',
      cell: ({ row }) => (
        <span className="font-bold text-destructive">{row.original.quantity_available}</span>
      ),
    },
    {
      accessorKey: 'reorder_point',
      header: 'Mínimo',
    },
    {
      accessorKey: 'reorder_quantity',
      header: 'Pedir',
      cell: ({ row }) => row.original.reorder_quantity > 0 ? row.original.reorder_quantity : '—',
    },
    {
      id: 'deficit',
      header: 'Déficit',
      cell: ({ row }) => {
        const deficit = row.original.reorder_point - row.original.quantity_available
        return <Badge variant="destructive">{deficit > 0 ? `-${deficit}` : '0'}</Badge>
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Alertas de Stock</h1>
            <p className="text-sm text-muted-foreground">Productos con stock por debajo del mínimo configurado</p>
          </div>
        </div>

        {items.length === 0 && !isLoading ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No hay productos con stock bajo mínimo.</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            searchPlaceholder="Buscar producto..."
          />
        )}
      </PageBody>
    </Page>
  )
}
