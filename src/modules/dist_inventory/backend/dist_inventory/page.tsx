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

type InventoryRow = {
  id: string
  product_id: string
  variant_id: string | null
  warehouse_code: string
  quantity_available: number
  quantity_committed: number
  quantity_in_transit: number
  reorder_point: number
  unit_cost: string
  currency: string
}

export default function DistInventoryPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<InventoryRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: InventoryRow[] }>(
        '/api/dist-inventory/items?pageSize=100',
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

  // Summary
  const summary = React.useMemo(() => {
    const lowStock = items.filter((i) => i.reorder_point > 0 && i.quantity_available <= i.reorder_point)
    const totalValue = items.reduce((sum, i) => sum + (i.quantity_available * Number(i.unit_cost)), 0)
    return {
      totalProducts: items.length,
      lowStockCount: lowStock.length,
      totalValue,
      totalUnits: items.reduce((sum, i) => sum + i.quantity_available, 0),
    }
  }, [items])

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
      header: 'Disponible',
      cell: ({ row }) => {
        const isLow = row.original.reorder_point > 0 && row.original.quantity_available <= row.original.reorder_point
        return (
          <span className={`font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
            {row.original.quantity_available}
            {isLow && <AlertTriangle className="inline ml-1 size-3 text-destructive" />}
          </span>
        )
      },
    },
    {
      accessorKey: 'quantity_committed',
      header: 'Comprometido',
      cell: ({ row }) => row.original.quantity_committed > 0 ? row.original.quantity_committed : '—',
    },
    {
      accessorKey: 'quantity_in_transit',
      header: 'En Tránsito',
      cell: ({ row }) => row.original.quantity_in_transit > 0 ? row.original.quantity_in_transit : '—',
    },
    {
      accessorKey: 'reorder_point',
      header: 'Mín.',
      cell: ({ row }) => row.original.reorder_point > 0 ? row.original.reorder_point : '—',
    },
    {
      accessorKey: 'unit_cost',
      header: 'Costo Unit.',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.unit_cost).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      id: 'value',
      header: 'Valor',
      cell: ({ row }) => {
        const value = row.original.quantity_available * Number(row.original.unit_cost)
        return `${row.original.currency} ${value.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inventario</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/dist_inventory/movement')}>
              Registrar Movimiento
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/dist_inventory/alerts')}>
              <AlertTriangle className="mr-2 size-4" />
              Alertas ({summary.lowStockCount})
            </Button>
            <Button type="button" onClick={() => router.push('/backend/dist_inventory/movement')}>
              <Plus className="mr-2 size-4" />
              Entrada
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Productos en Stock</p>
            <p className="text-lg font-bold">{summary.totalProducts}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Unidades Totales</p>
            <p className="text-lg font-bold">{summary.totalUnits.toLocaleString('es-VE')}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Valor del Inventario</p>
            <p className="text-lg font-bold">USD {summary.totalValue.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Stock Bajo Mínimo</p>
            <p className={`text-lg font-bold ${summary.lowStockCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {summary.lowStockCount}
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchPlaceholder="Buscar producto..."
        />
      </PageBody>
    </Page>
  )
}
