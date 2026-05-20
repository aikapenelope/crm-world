'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'

type DeadStockRow = {
  id: string
  branch_id: string
  product_id: string
  closing_stock: number
  days_of_stock: number
  last_movement_at: string | null
}

export default function DeadStockPage() {
  const [items, setItems] = React.useState<DeadStockRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: DeadStockRow[] }>(
        '/api/retail-inventory/rotation?is_dead_stock=true&pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setItems(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<DeadStockRow>[] = [
    {
      accessorKey: 'product_id',
      header: 'Producto',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.product_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'branch_id',
      header: 'Sucursal',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.branch_id}</span>,
    },
    {
      accessorKey: 'closing_stock',
      header: 'Unidades',
      cell: ({ row }) => <span className="font-bold">{row.original.closing_stock}</span>,
    },
    {
      accessorKey: 'last_movement_at',
      header: 'Último Movimiento',
      cell: ({ row }) => (
        <span className="text-sm text-destructive">
          {row.original.last_movement_at
            ? new Date(row.original.last_movement_at).toLocaleDateString('es-VE')
            : 'Nunca'}
        </span>
      ),
    },
    {
      accessorKey: 'days_of_stock',
      header: 'Días Sin Venta',
      cell: ({ row }) => (
        <Badge variant="destructive">
          <AlertTriangle className="size-3 mr-1" />
          {row.original.days_of_stock >= 999 ? '∞' : `${row.original.days_of_stock}d`}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <h1 className="text-2xl font-bold">Productos Sin Movimiento</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Productos con 90+ días sin ninguna venta — considerar liquidación o reubicación
          </p>
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
        />
      </PageBody>
    </Page>
  )
}
