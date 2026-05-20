'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Settings, Share2 } from 'lucide-react'

type OrderRow = {
  id: string
  order_number: string
  guest_name: string | null
  customer_id: string | null
  status: string
  payment_status: string
  delivery_type: string
  total: string
  currency: string
  source: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivering: 'En Camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'secondary',
  preparing: 'secondary',
  ready: 'default',
  delivering: 'default',
  delivered: 'default',
  cancelled: 'destructive',
}

const paymentVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  failed: 'destructive',
}

export default function RetailEcommercePage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: OrderRow[] }>(
        '/api/retail-ecommerce/orders?pageSize=100',
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

  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length
  const todayCount = orders.filter((o) => {
    const d = new Date(o.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).length

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: 'order_number',
      header: 'Pedido',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.order_number}</span>,
    },
    {
      accessorKey: 'guest_name',
      header: 'Cliente',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.guest_name ?? (row.original.customer_id ? row.original.customer_id.slice(0, 8) : 'Anónimo')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'outline'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'payment_status',
      header: 'Pago',
      cell: ({ row }) => (
        <Badge variant={paymentVariants[row.original.payment_status] ?? 'outline'}>
          {row.original.payment_status === 'confirmed' ? 'Pagado' : row.original.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}
        </Badge>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.currency} {Number(row.original.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Canal',
      cell: ({ row }) => <Badge variant="outline">{row.original.source}</Badge>,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('es-VE')}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">E-commerce</h1>
              <p className="text-sm text-muted-foreground">
                {todayCount} pedido{todayCount !== 1 ? 's' : ''} hoy · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_ecommerce/storefront')}>
              <Settings className="mr-2 size-4" />
              Configurar
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_ecommerce/publish')}>
              <Share2 className="mr-2 size-4" />
              Publicar
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_ecommerce/orders/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
