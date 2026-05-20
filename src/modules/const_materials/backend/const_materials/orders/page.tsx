'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Plus } from 'lucide-react'

type OrderRow = {
  id: string; order_number: string; supplier_name: string; order_date: string
  expected_delivery: string | null; total_amount: string; currency: string; status: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', confirmed: 'Confirmada',
  partial_received: 'Parcial', received: 'Recibida', cancelled: 'Cancelada',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary', sent: 'outline', confirmed: 'outline',
  partial_received: 'default', received: 'default', cancelled: 'destructive',
}

export default function ConstMaterialOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: OrderRow[] }>('/api/const-materials/orders?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setOrders(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: 'order_number', header: 'OC #', cell: ({ row }) => <span className="font-mono font-bold">{row.original.order_number}</span> },
    { accessorKey: 'supplier_name', header: 'Proveedor' },
    { accessorKey: 'order_date', header: 'Fecha OC', cell: ({ row }) => <span className="font-mono text-xs">{row.original.order_date}</span> },
    { accessorKey: 'expected_delivery', header: 'Entrega Est.', cell: ({ row }) => <span className="font-mono text-xs">{row.original.expected_delivery ?? '—'}</span> },
    {
      accessorKey: 'total_amount',
      header: 'Monto',
      cell: ({ row }) => <span className="font-mono">{row.original.currency} {Number(row.original.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>{STATUS_LABELS[row.original.status] ?? row.original.status}</Badge>,
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_materials')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/const_materials/orders/create')}>
            <Plus className="mr-2 size-4" />
            Nueva OC
          </Button>
        </div>
        <DataTable columns={columns} data={orders} isLoading={isLoading} searchPlaceholder="Buscar orden..." />
      </PageBody>
    </Page>
  )
}
