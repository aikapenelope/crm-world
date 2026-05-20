'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ShoppingBag, CreditCard, Users } from 'lucide-react'

type OrderRow = {
  id: string
  order_number: string
  supplier_id: string
  status: string
  origin: string
  currency: string
  total: string
  expected_delivery_date: string | null
  created_at: string
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  partially_received: 'Parcial',
  received: 'Recibida',
  cancelled: 'Cancelada',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  sent: 'secondary',
  partially_received: 'secondary',
  received: 'default',
  cancelled: 'destructive',
}

export default function RetailPurchasingPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: OrderRow[] }>(
        '/api/retail-purchasing/orders?pageSize=100',
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

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: 'order_number',
      header: 'Orden',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{row.original.order_number}</span>
          {row.original.origin === 'auto_reorder' && (
            <Badge variant="outline" className="text-xs">Auto</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'supplier_id',
      header: 'Proveedor',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.supplier_id.slice(0, 8)}...</span>,
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
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.currency} {Number(row.original.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
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
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Compras</h1>
              <p className="text-sm text-muted-foreground">Órdenes de compra y gestión de proveedores</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_purchasing/suppliers')}>
              <Users className="mr-2 size-4" />
              Proveedores
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_purchasing/payables')}>
              <CreditCard className="mr-2 size-4" />
              Cuentas por Pagar
            </Button>
            <Button type="button" onClick={() => router.push('/backend/retail_purchasing/orders/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Orden
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_purchasing/orders/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
