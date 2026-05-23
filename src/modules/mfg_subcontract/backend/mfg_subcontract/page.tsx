'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type ScRow = {
  id: string; order_number: string; subcontractor_name: string; product_code: string; product_name: string
  quantity_ordered: string; quantity_received: string; uom: string; price_per_unit_usd: string
  total_maquila_fee_usd: string; status: string; scheduled_delivery: string | null
  standard_scrap_pct: string; actual_scrap_pct: string | null; scrap_exceeded: boolean
}

const SC_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', materials_sent: 'info', in_production: 'warning', completed: 'success', cancelled: 'error',
}
const SC_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', materials_sent: 'Mat. enviados', in_production: 'En producción',
  completed: 'Completado', cancelled: 'Cancelado',
}

const SC_STATUS_FLOW = ['draft', 'materials_sent', 'in_production', 'completed']

export default function MfgSubcontractPage() {
  const { runMutation } = useGuardedMutation()
  const [orders, setOrders]   = React.useState<ScRow[]>([])
  const [isLoading, setLoad]  = React.useState(true)
  const [statusFilter, setSF] = React.useState('in_production')
  const [showForm, setForm]   = React.useState(false)
  const [selectedOrder, setSelected] = React.useState<ScRow | null>(null)
  const [materials, setMaterials] = React.useState<any[]>([])
  const [showMatForm, setMatForm]  = React.useState(false)

  const load = React.useCallback(async () => {
    setLoad(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: ScRow[] }>(`/api/mfg-subcontract/subcontract-orders?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setOrders(res.result?.items ?? [])
    setLoad(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const loadMaterials = async (orderId: string) => {
    const res = await apiCall<{ items: any[] }>(`/api/mfg-subcontract/subcontract-materials?subcontract_order_id=${orderId}&pageSize=100`, undefined, { fallback: { items: [] } })
    setMaterials(res.result?.items ?? [])
  }

  const handleAdvance = (order: ScRow) => {
    const idx = SC_STATUS_FLOW.indexOf(order.status)
    if (idx < 0 || idx >= SC_STATUS_FLOW.length - 1) return
    const next = SC_STATUS_FLOW[idx + 1]
    runMutation({
      operation: 'update', context: { entityId: 'mfg_subcontract.order', recordId: order.id },
      mutationPayload: async () => {
        const update: Record<string, any> = { id: order.id, status: next }
        if (next === 'completed') {
          update.actual_delivery = new Date().toISOString().split('T')[0]
          update.total_maquila_fee_usd = (Number(order.quantity_received) * Number(order.price_per_unit_usd)).toFixed(2)
        }
        await apiCallOrThrow('/api/mfg-subcontract/subcontract-orders', { method: 'PUT', body: JSON.stringify(update) })
        flash(`SC ${order.order_number} → ${SC_STATUS_LABEL[next]}`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const scrapExceeded = orders.filter((o) => o.scrap_exceeded)
  const lateOrders    = orders.filter((o) => ['in_production', 'materials_sent'].includes(o.status) && o.scheduled_delivery && o.scheduled_delivery < today)

  const STATUS_FILTERS = [
    { value: 'in_production', label: 'En producción' },
    { value: 'materials_sent', label: 'Mat. enviados' },
    { value: '', label: 'Todas' },
  ]

  const columns: ColumnDef<ScRow>[] = [
    { accessorKey: 'order_number', header: 'SC', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.order_number}</span> },
    { id: 'product', header: 'Producto / Maquilador', cell: ({ row }) => (
      <div><span className="font-semibold text-sm">{row.original.product_code}</span>
      <div className="text-xs text-muted-foreground">{row.original.subcontractor_name}</div></div>
    )},
    { id: 'qty', header: 'Pedido / Recibido', cell: ({ row }) => {
      const pct = Number(row.original.quantity_ordered) > 0
        ? (Number(row.original.quantity_received) / Number(row.original.quantity_ordered) * 100).toFixed(0)
        : '0'
      return (
        <div className="text-sm">
          <span className="font-semibold">{Number(row.original.quantity_received).toFixed(2)}</span>
          <span className="text-muted-foreground"> / {Number(row.original.quantity_ordered).toFixed(2)} {row.original.uom} ({pct}%)</span>
        </div>
      )
    }},
    { id: 'scrap', header: 'Merma', cell: ({ row }) => {
      if (!row.original.actual_scrap_pct) return <span className="text-xs text-muted-foreground">Est. {row.original.standard_scrap_pct}%</span>
      const exceeded = row.original.scrap_exceeded
      return (
        <div>
          <span className={`text-sm font-semibold ${exceeded ? 'text-status-error-text' : 'text-status-success-text'}`}>
            Real: {row.original.actual_scrap_pct}%
          </span>
          <div className="text-xs text-muted-foreground">Est. contractual: {row.original.standard_scrap_pct}%{exceeded ? ' ⚠ EXCEDIDO' : ' ✓'}</div>
        </div>
      )
    }},
    { id: 'fee', header: 'Honorario maquila', cell: ({ row }) => (
      <div className="text-sm">
        <span className="font-semibold">USD {Number(row.original.total_maquila_fee_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        <div className="text-xs text-muted-foreground">@ USD {Number(row.original.price_per_unit_usd).toFixed(4)}/{row.original.uom}</div>
      </div>
    )},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      <StatusBadge variant={SC_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
        {SC_STATUS_LABEL[row.original.status] ?? row.original.status}
      </StatusBadge>
    )},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        { id: 'materials', label: 'Ver materiales', onSelect: () => { setSelected(row.original); loadMaterials(row.original.id) } },
        ...(SC_STATUS_FLOW.includes(row.original.status) && row.original.status !== 'completed' ? [
          { id: 'advance', label: `→ ${SC_STATUS_LABEL[SC_STATUS_FLOW[SC_STATUS_FLOW.indexOf(row.original.status) + 1]] ?? 'Siguiente'}`, onSelect: () => handleAdvance(row.original) },
        ] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageHeader
        title="Maquila y Subcontratación"
        description={[
          scrapExceeded.length > 0 && `${scrapExceeded.length} SC con merma excedida`,
          lateOrders.length > 0 && `${lateOrders.length} SC con retraso`,
        ].filter(Boolean).join(' · ') || `${orders.length} órdenes activas`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm" variant={statusFilter === f.value ? 'default' : 'outline'} onClick={() => setSF(f.value)}>{f.label}</Button>
              ))}
            </div>
            <Button type="button" onClick={() => setForm(!showForm)}><Plus className="size-4 mr-2" /> Nueva SC</Button>
          </div>
        }
      />
      <PageBody>
        {(scrapExceeded.length > 0 || lateOrders.length > 0) && (
          <div className="mb-4 space-y-2">
            {scrapExceeded.length > 0 && (
              <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-warning-icon shrink-0" />
                <span className="text-sm text-status-warning-text">
                  Maquila(s) con merma superior al estándar contractual: {scrapExceeded.map((o) => o.order_number).join(', ')} — revisar penalización.
                </span>
              </div>
            )}
            {lateOrders.length > 0 && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
                <span className="text-sm text-status-error-text">
                  {lateOrders.length} SC con fecha de entrega vencida: {lateOrders.map((o) => o.order_number).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Nueva Orden de Maquila</h3>
            <CrudForm entityId="mfg_subcontract.order" apiPath="/api/mfg-subcontract/subcontract-orders" mode="create"
              fields={[
                { type: 'text' as const,   name: 'order_number',       label: 'Número SC (SC-2026-XXX)', required: true },
                { type: 'text' as const,   name: 'subcontractor_name', label: 'Nombre del maquilador', required: true },
                { type: 'text' as const,   name: 'product_code',       label: 'Código del Producto a Fabricar', required: true },
                { type: 'text' as const,   name: 'product_name',       label: 'Nombre del Producto', required: true },
                { type: 'text' as const,   name: 'quantity_ordered',   label: 'Cantidad a producir', required: true },
                { type: 'text' as const,   name: 'uom',                label: 'Unidad', required: true },
                { type: 'text' as const,   name: 'price_per_unit_usd', label: 'Precio de maquila por unidad (USD)', required: true },
                { type: 'text' as const,   name: 'standard_scrap_pct', label: 'Merma contractual permitida (%)' },
                { type: 'date' as const,   name: 'scheduled_delivery', label: 'Fecha de entrega pactada' },
                { type: 'textarea' as const, name: 'notes',            label: 'Notas' },
              ]}
              onSuccess={() => { flash('Orden de maquila creada', 'success'); setForm(false); load() }}
            />
          </div>
        )}

        <DataTable entityId="mfg_subcontract.order" extensionTableId="mfg-subcontract-orders" data={orders} columns={columns} isLoading={isLoading}
          emptyState={{ title: 'Sin órdenes de maquila', description: 'Crea una SC cuando necesites subcontratar producción a un maquilador.' }}
          stickyActionsColumn />

        {/* Materials panel for selected order */}
        {selectedOrder && (
          <div className="mt-6 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Almacén Virtual — Materiales en {selectedOrder.order_number}</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setMatForm(!showMatForm)}>
                  <Plus className="size-4 mr-1" /> Registrar envío
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setSelected(null); setMaterials([]) }}>Cerrar</Button>
              </div>
            </div>

            {showMatForm && (
              <div className="mb-4 border border-border rounded-lg p-3 bg-background">
                <CrudForm entityId="mfg_subcontract.material" apiPath="/api/mfg-subcontract/subcontract-materials" mode="create"
                  initial={{ subcontract_order_id: selectedOrder.id, sent_date: new Date().toISOString().split('T')[0] }}
                  fields={[
                    { type: 'text' as const, name: 'material_code',  label: 'Código del material', required: true },
                    { type: 'text' as const, name: 'material_name',  label: 'Nombre del material', required: true },
                    { type: 'text' as const, name: 'quantity_sent',  label: 'Cantidad enviada', required: true },
                    { type: 'text' as const, name: 'uom',            label: 'Unidad', required: true },
                    { type: 'text' as const, name: 'unit_cost_usd',  label: 'Costo unitario (USD)' },
                    { type: 'text' as const, name: 'lot_number',     label: 'Número de lote' },
                  ]}
                  onSubmit={async (values) => {
                    await apiCallOrThrow('/api/mfg-subcontract/subcontract-materials', { method: 'POST', body: JSON.stringify({ ...values, subcontract_order_id: selectedOrder.id }) })
                    flash('Material enviado registrado', 'success')
                    setMatForm(false)
                    loadMaterials(selectedOrder.id)
                  }}
                />
              </div>
            )}

            {materials.length > 0 ? (
              <div className="space-y-2">
                {materials.map((m: any) => {
                  const sent     = Number(m.quantity_sent)
                  const returned = Number(m.quantity_returned)
                  const consumed = sent - returned
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                      <div>
                        <span className="font-mono font-medium">{m.material_code}</span>
                        <span className="text-muted-foreground ml-2">{m.material_name}</span>
                        {m.lot_number && <span className="text-xs text-muted-foreground ml-2">lote: {m.lot_number}</span>}
                      </div>
                      <div className="text-right text-xs">
                        <div>Enviado: <span className="font-semibold">{sent.toFixed(3)} {m.uom}</span></div>
                        {returned > 0 && <div className="text-muted-foreground">Devuelto: {returned.toFixed(3)}</div>}
                        <div>Consumido: <span className="font-semibold">{consumed.toFixed(3)}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin materiales registrados para esta SC.</p>
            )}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
