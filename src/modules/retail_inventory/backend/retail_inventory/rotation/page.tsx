'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { TrendingUp, TrendingDown } from 'lucide-react'

type RotationRow = {
  id: string
  branch_id: string
  product_id: string
  period_month: string
  closing_stock: number
  total_sold: number
  rotation_index: string
  days_of_stock: number
  is_dead_stock: boolean
  last_movement_at: string | null
}

export default function RotationPage() {
  const [items, setItems] = React.useState<RotationRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: RotationRow[] }>(
        '/api/retail-inventory/rotation?pageSize=100',
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

  const columns: ColumnDef<RotationRow>[] = [
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
      header: 'Stock',
      cell: ({ row }) => <span className="font-bold">{row.original.closing_stock}</span>,
    },
    {
      accessorKey: 'total_sold',
      header: 'Vendido (mes)',
      cell: ({ row }) => <span>{row.original.total_sold}</span>,
    },
    {
      accessorKey: 'rotation_index',
      header: 'Rotación',
      cell: ({ row }) => {
        const idx = Number(row.original.rotation_index)
        return (
          <div className="flex items-center gap-1">
            {idx >= 1 ? (
              <TrendingUp className="size-3 text-primary" />
            ) : (
              <TrendingDown className="size-3 text-destructive" />
            )}
            <span className={idx >= 1 ? 'text-primary font-medium' : 'text-destructive font-medium'}>
              {idx.toFixed(2)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'days_of_stock',
      header: 'Días Stock',
      cell: ({ row }) => {
        const days = row.original.days_of_stock
        return (
          <span className={days > 90 ? 'text-destructive font-medium' : ''}>
            {days >= 999 ? '∞' : `${days}d`}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_dead_stock',
      header: 'Estado',
      cell: ({ row }) => (
        row.original.is_dead_stock
          ? <Badge variant="destructive">Sin movimiento</Badge>
          : <Badge variant="default">Activo</Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Rotación de Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Análisis de rotación por producto y sucursal — actualizado diariamente
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
