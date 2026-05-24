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
import { Plus, PlayCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type OrderRow = {
  id: string; order_number: string; product_code: string; product_name: string
  planned_quantity: string; actual_quantity: string | null; uom: string
  status: string; scheduled_start: string | null; scheduled_end: string | null
  work_center_name: string | null; planned_cost_usd: string | null
}

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  planned: 'neutral', released: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Planificada', released: 'Liberada', in_progress: 'En proceso', completed: 'Completada', cancelled: 'Cancelada',
}

export default function MfgOrdersPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [orders, setOrders]     = React.useState<OrderRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [statusFilter, setFilter] = React.useState('in_progress')
  const [showForm, setShowForm]  = React.useState(false)
  const [bomOptions, setBomOptions]   = React.useState<{ value: string; label: string }[]>([])
  const [wcOptions, setWcOptions]     = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [ordRes, bomRes, wcRes] = await Promise.all([
      apiCall<{ items: OrderRow[] }>(`/api/mfg-orders/production-orders?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-bom/bom-headers?status=active&pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-orders/work-centers?pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    if (ordRes.ok) setOrders(ordRes.result?.items ?? [])
    if (bomRes.ok) setBomOptions((bomRes.result?.items ?? []).map((b: any) => ({ value: b.id, label: `${b.product_code} — v${b.version}` })))
    if (wcRes.ok) setWcOptions((wcRes.result?.items ?? []).map((w: any) => ({ value: w.id, label: `${w.code} — ${w.name}` })))
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleRelease = (order: OrderRow) => {
    runMutation({
      context: { entityId: 'mfg_orders.production_order', recordId: order.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-orders/production-orders', {
          method: 'PUT',
          body: JSON.stringify({ id: order.id, status: 'released' }),
        })
        flash(`Orden ${order.order_number} liberada — materiales reservados`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString()
  const lateCount = orders.filter((o) => o.scheduled_end && o.scheduled_end < today && o.status !== 'completed').length

  const STATUS_FILTERS = [
    { value: 'in_progress', label: 'En proceso' },
    { value: 'released',    label: 'Liberadas' },
    { value: 'planned',     label: 'Planificadas' },
    { value: '',            label: 'Todas' },
  ]

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: 'order_number',
      header: 'N° Orden',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.order_number}</span>,
    },
    {
      accessorKey: 'product_code',
      header: 'Producto',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-sm">{row.original.product_code}</span>
          <div className="text-xs text-muted-foreground">{row.original.product_name}</div>
        </div>
      ),
    },
    {
      id: 'qty',
      header: 'Cantidad',
      cell: ({ row }) => {
        const o = row.original
        const pct = Number(o.planned_quantity) > 0
          ? Math.min(100, (Number(o.actual_quantity ?? 0) / Number(o.planned_quantity)) * 100).toFixed(0)
          : '0'
        return (
          <div>
            <span className="font-semibold">{Number(o.planned_quantity).toLocaleString('es-VE')} {o.uom}</span>
            {o.actual_quantity && Number(o.actual_quantity) > 0 && (
              <div className="text-xs text-muted-foreground">{pct}% producido</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'work_center_name',
      header: 'Línea',
      cell: ({ row }) => row.original.work_center_name ?? '—',
    },
    {
      accessorKey: 'scheduled_end',
      header: 'Fecha fin plan',
      cell: ({ row }) => {
        const d = row.original.scheduled_end
        if (!d) return '—'
        const isLate = d < today && row.original.status !== 'completed'
        return (
          <span className={isLate ? 'text-status-error-text font-semibold' : ''}>
            {new Date(d).toLocaleDateString('es-VE')}
            {isLate && ' ⚠'}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'view',    label: 'Ver detalle / piso', onSelect: () => router.push(`/backend/mfg-orders/${row.original.id}`) },
          ...(row.original.status === 'planned' ? [
            { id: 'release', label: 'Liberar orden', onSelect: () => handleRelease(row.original) },
          ] : []),
        ]} />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Órdenes de Producción"
        description={lateCount > 0 ? `${lateCount} orden(es) con retraso` : `${orders.length} órdenes activas`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4 mr-2" /> Nueva Orden
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Crear Orden de Producción</h3>
            <CrudForm
              entityId="mfg_orders.production_order"
              apiPath="/api/mfg-orders/production-orders"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'order_number',     label: 'Número de Orden (PO-2026-XXX)', required: true },
                { type: 'select' as const, id: 'bom_id',           label: 'BOM / Fórmula del Producto', required: true, options: bomOptions },
                { type: 'text' as const,   id: 'product_code',     label: 'Código del Producto', required: true },
                { type: 'text' as const,   id: 'product_name',     label: 'Nombre del Producto', required: true },
                { type: 'text' as const,   id: 'planned_quantity', label: 'Cantidad a Producir', required: true },
                { type: 'text' as const,   id: 'uom',              label: 'Unidad de Medida', required: true },
                { type: 'select' as const, id: 'work_center_id',   label: 'Línea / Centro de Trabajo', options: wcOptions },
                { type: 'datetime-local' as const, id: 'scheduled_start', label: 'Inicio Planificado' },
                { type: 'datetime-local' as const, id: 'scheduled_end',   label: 'Fin Planificado' },
                { type: 'text' as const,   id: 'planned_cost_usd', label: 'Costo Estándar Planificado (USD)' },
                { type: 'textarea' as const, id: 'notes',          label: 'Notas' },
              ]}
              groups={[
                { id: 'product',   title: 'Producto',    fields: ['order_number', 'bom_id', 'product_code', 'product_name'] },
                { id: 'qty',       title: 'Producción',  fields: ['planned_quantity', 'uom', 'work_center_id'] },
                { id: 'schedule',  title: 'Cronograma',  fields: ['scheduled_start', 'scheduled_end', 'planned_cost_usd', 'notes'] },
              ]}
              onSuccess={() => {
                flash('Orden de producción creada', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="mfg_orders.production_order"
          extensionTableId="mfg-orders-list"
          data={orders}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin órdenes de producción"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
