'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, Truck } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type SoRow = {
  id: string; order_number: string; customer_name: string; status: string
  total_usd: string; currency: string; scheduled_dispatch_date: string | null
  requires_coa: boolean; requires_temperature_control: boolean
}

const SO_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', confirmed: 'info', in_preparation: 'warning', dispatched: 'warning',
  invoiced: 'success', cancelled: 'error',
}
const SO_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', confirmed: 'Confirmado', in_preparation: 'En preparación',
  dispatched: 'Despachado', invoiced: 'Facturado', cancelled: 'Cancelado',
}

export default function MfgDispatchPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_dispatch.page' })
  const [orders, setOrders]    = React.useState<SoRow[]>([])
  const [isLoading, setLoad]   = React.useState(true)
  const [statusFilter, setSF]  = React.useState('confirmed')
  const [showForm, setForm]    = React.useState(false)

  const load = React.useCallback(async () => {
    setLoad(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: SoRow[] }>(`/api/mfg-dispatch/sale-orders?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setOrders(res.result?.items ?? [])
    setLoad(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleConfirm = (so: SoRow) => {
    runMutation({
      context: { entityId: 'mfg_dispatch.sale_order', recordId: so.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-dispatch/sale-orders', { method: 'PUT', body: JSON.stringify({ id: so.id, status: 'confirmed' }) })
        flash(`Pedido ${so.order_number} confirmado — lotes reservados`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  const urgentDispatches = orders.filter((o) =>
    ['confirmed', 'in_preparation'].includes(o.status) &&
    o.scheduled_dispatch_date && o.scheduled_dispatch_date <= in3Days
  )

  const STATUS_FILTERS = [
    { value: 'confirmed',    label: 'Confirmados' },
    { value: 'in_preparation', label: 'En preparación' },
    { value: '',             label: 'Todos' },
  ]

  const columns: ColumnDef<SoRow>[] = [
    { accessorKey: 'order_number', header: 'Pedido', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.order_number}</span> },
    { id: 'customer', header: 'Cliente', cell: ({ row }) => (
      <div>
        <span className="font-semibold text-sm">{row.original.customer_name}</span>
        <div className="flex gap-1 mt-0.5">
          {row.original.requires_coa && <StatusBadge variant="info">CoA requerido</StatusBadge>}
          {row.original.requires_temperature_control && <StatusBadge variant="warning">🌡 Frío</StatusBadge>}
        </div>
      </div>
    )},
    { id: 'total', header: 'Total', cell: ({ row }) => (
      <span className="font-semibold">USD {Number(row.original.total_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
    )},
    { id: 'dispatch_date', header: 'Fecha despacho', cell: ({ row }) => {
      const d = row.original.scheduled_dispatch_date
      if (!d) return '—'
      const isUrgent = d <= in3Days && d >= today
      const isLate   = d < today
      return <span className={`text-sm ${isLate ? 'text-status-error-text font-semibold' : isUrgent ? 'text-status-warning-text font-semibold' : ''}`}>
        {new Date(d).toLocaleDateString('es-VE')}{isLate ? ' ⚠' : isUrgent ? ' ⚡' : ''}
      </span>
    }},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      <StatusBadge variant={SO_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
        {SO_STATUS_LABEL[row.original.status] ?? row.original.status}
      </StatusBadge>
    )},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        { id: 'view',    label: 'Ver / Emitir guía',   onSelect: () => router.push(`/backend/mfg-dispatch/${row.original.id}`) },
        ...(row.original.status === 'draft' ? [
          { id: 'confirm', label: 'Confirmar pedido', onSelect: () => handleConfirm(row.original) },
        ] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageHeader
        title="Despacho de Producto Terminado"
        description={urgentDispatches.length > 0 ? `${urgentDispatches.length} despacho(s) urgente(s) en los próximos 3 días` : `${orders.length} pedidos activos`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm" variant={statusFilter === f.value ? 'default' : 'outline'} onClick={() => setSF(f.value)}>{f.label}</Button>
              ))}
            </div>
            <Button type="button" onClick={() => setForm(!showForm)}>
              <Plus className="size-4 mr-2" /> Nuevo pedido
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Truck className="size-4" /> Nuevo Pedido Industrial</h3>
            <CrudForm entityId="mfg_dispatch.sale_order" apiPath="/api/mfg-dispatch/sale-orders" mode="create"
              initial={{ currency: 'USD', iva_pct: '16.00' }}
              fields={[
                { type: 'text' as const,   id: 'order_number',           label: 'Número de Pedido (SO-MFG-2026-XXX)', required: true },
                { type: 'text' as const,   id: 'customer_name',          label: 'Nombre del Cliente', required: true },
                { type: 'text' as const,   id: 'customer_rif',           label: 'RIF del Cliente (J-12345678-9)' },
                { type: 'select' as const, id: 'currency',               label: 'Moneda', options: [{ value: 'USD', label: 'USD (Dólares)' }, { value: 'VES', label: 'VES (Bolívares)' }] },
                { type: 'select' as const, id: 'payment_method',         label: 'Método de pago', options: [{ value: 'zelle', label: 'Zelle' }, { value: 'binance', label: 'Binance Pay' }, { value: 'efectivo_usd', label: 'Efectivo USD' }, { value: 'transferencia', label: 'Transferencia' }, { value: 'pago_movil', label: 'Pago Móvil' }] },
                { type: 'date' as const,   id: 'scheduled_dispatch_date', label: 'Fecha de despacho solicitada' },
                { type: 'text' as const,   id: 'delivery_address',       label: 'Dirección de entrega' },
                { type: 'textarea' as const, id: 'notes',                label: 'Notas' },
              ]}
              onSuccess={() => { flash('Pedido creado', 'success'); setForm(false); load() }}
            />
          </div>
        )}

        <DataTable entityId="mfg_dispatch.sale_order" data={orders} columns={columns} isLoading={isLoading}
          emptyState="Sin pedidos industriales"
          stickyActionsColumn />
      </PageBody>
    </Page>
  )
}
