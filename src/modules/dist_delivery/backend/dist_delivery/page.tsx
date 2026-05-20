'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type DeliveryOrderRow = {
  id: string
  route_id: string | null
  driver_id: string | null
  vehicle_plate: string | null
  dispatch_date: string
  status: string
  total_items: number
  delivered_items: number
  returned_items: number
}

const STATUS_LABELS: Record<string, string> = {
  preparing: 'Preparando',
  dispatched: 'Despachado',
  in_transit: 'En Tránsito',
  completed: 'Completado',
  partial: 'Parcial',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  preparing: 'outline',
  dispatched: 'secondary',
  in_transit: 'secondary',
  completed: 'default',
  partial: 'destructive',
}

export default function DistDeliveryPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<DeliveryOrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: DeliveryOrderRow[] }>(
        '/api/dist-delivery/orders?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setOrders(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const summary = React.useMemo(() => {
    const preparing = orders.filter((o) => o.status === 'preparing').length
    const inTransit = orders.filter((o) => o.status === 'dispatched' || o.status === 'in_transit').length
    const completed = orders.filter((o) => o.status === 'completed').length
    return { preparing, inTransit, completed, total: orders.length }
  }, [orders])

  const columns: ColumnDef<DeliveryOrderRow>[] = [
    {
      accessorKey: 'dispatch_date',
      header: 'Fecha Despacho',
      cell: ({ row }) => new Date(row.original.dispatch_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'total_items',
      header: 'Items',
    },
    {
      accessorKey: 'delivered_items',
      header: 'Entregados',
      cell: ({ row }) => (
        <span className={row.original.delivered_items === row.original.total_items ? 'text-primary font-medium' : ''}>
          {row.original.delivered_items}/{row.original.total_items}
        </span>
      ),
    },
    {
      accessorKey: 'returned_items',
      header: 'Devueltos',
      cell: ({ row }) => row.original.returned_items > 0
        ? <span className="text-destructive font-medium">{row.original.returned_items}</span>
        : '—',
    },
    {
      accessorKey: 'vehicle_plate',
      header: 'Vehículo',
      cell: ({ row }) => row.original.vehicle_plate ?? '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Despachos</h1>
          <Button type="button" onClick={() => router.push('/backend/dist_delivery/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo Despacho
          </Button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Preparando</p>
            <p className="text-lg font-bold">{summary.preparing}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">En Tránsito</p>
            <p className="text-lg font-bold">{summary.inTransit}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Completados</p>
            <p className="text-lg font-bold text-primary">{summary.completed}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{summary.total}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          searchPlaceholder="Buscar despacho..."
        />
      </PageBody>
    </Page>
  )
}
