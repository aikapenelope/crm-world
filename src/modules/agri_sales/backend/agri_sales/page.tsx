'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type OrderRow = {
  id: string; order_number: string; order_date: string
  total_usd: string; payment_terms: string | null; status: string
}

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', confirmed: 'info', partially_dispatched: 'warning',
  fully_dispatched: 'info', invoiced: 'warning', paid: 'success', cancelled: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', confirmed: 'Confirmada', partially_dispatched: 'Parcialmente despachada',
  fully_dispatched: 'Despachada', invoiced: 'Facturada', paid: 'Pagada', cancelled: 'Cancelada',
}

export default function AgriSalesPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [orders, setOrders]     = React.useState<OrderRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [statusFilter, setFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: OrderRow[] }>(`/api/agri-sales/sale-orders?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setOrders(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleConfirm = (order: OrderRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_sales.order', recordId: order.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-sales/sale-orders', { method: 'PUT', body: JSON.stringify({ id: order.id, status: 'confirmed' }) })
        flash('Orden confirmada', 'success')
        load()
      },
    })
  }

  const pendingDispatch = orders.filter(o => o.status === 'confirmed' || o.status === 'partially_dispatched').length
  const pendingPayment  = orders.filter(o => o.status === 'invoiced').length

  const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: 'order_number', header: 'N° Orden', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.order_number}</span> },
    { accessorKey: 'order_date', header: 'Fecha', cell: ({ row }) => new Date(row.original.order_date).toLocaleDateString('es-VE') },
    { accessorKey: 'total_usd', header: 'Total', cell: ({ row }) => <span className="font-semibold">USD {row.original.total_usd}</span> },
    { accessorKey: 'payment_terms', header: 'Cond. de Pago', cell: ({ row }) => row.original.payment_terms ?? '—' },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/agri-sales/${row.original.id}`) },
          ...(row.original.status === 'draft' ? [{ id: 'confirm', label: 'Confirmar orden', onSelect: () => handleConfirm(row.original) }] : []),
        ]} />
      ),
    },
  ]

  const FILTERS = [
    { value: '', label: 'Todas' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'invoiced', label: 'Facturadas' },
    { value: 'paid', label: 'Pagadas' },
  ]

  const desc = [
    pendingDispatch > 0 && `${pendingDispatch} pendiente(s) de despacho`,
    pendingPayment > 0 && `${pendingPayment} por cobrar`,
  ].filter(Boolean).join(' · ')

  return (
    <Page>
      <PageHeader
        title="Órdenes de Venta"
        description={desc || undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => router.push('/backend/agri-sales/create')}>
              <Plus className="size-4 mr-2" /> Nueva Orden
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="agri_sales.order"
          extensionTableId="agri-sales-orders-list"
          data={orders}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin órdenes de venta', description: 'Registra la primera venta a un cliente industrial.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
