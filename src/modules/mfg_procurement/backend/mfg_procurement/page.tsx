'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, AlertTriangle, Ship } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type PoRow = {
  id: string; po_number: string; supplier_name: string; po_type: string; status: string
  subtotal_fob: string; total_cif_cost: string; currency: string; incoterm: string | null
  estimated_warehouse_arrival: string | null; dau_number: string | null
}

const PO_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', sent: 'info', confirmed: 'info', in_transit: 'warning',
  at_customs: 'warning', delivered: 'success', cancelled: 'error',
}
const PO_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', confirmed: 'Confirmada',
  in_transit: 'En tránsito', at_customs: 'En aduana VE', delivered: 'Recibida', cancelled: 'Cancelada',
}
const PO_STATUS_FLOW = ['draft', 'sent', 'confirmed', 'in_transit', 'at_customs', 'delivered']

function StatusPipeline({ status }: { status: string }) {
  const currentIdx = PO_STATUS_FLOW.indexOf(status)
  return (
    <div className="flex items-center gap-0.5">
      {PO_STATUS_FLOW.map((s, i) => (
        <div key={s} className={`h-1.5 w-6 rounded-full ${i <= currentIdx ? 'bg-primary' : 'bg-muted'}`} title={PO_STATUS_LABEL[s] ?? s} />
      ))}
    </div>
  )
}

export default function MfgProcurementPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_procurement.page' })
  const [orders, setOrders]      = React.useState<PoRow[]>([])
  const [isLoading, setLoad]     = React.useState(true)
  const [statusFilter, setSF]    = React.useState('in_transit')
  const [showForm, setForm]      = React.useState(false)
  const [supplierOptions, setSOs] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoad(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [poRes, supRes] = await Promise.all([
      apiCall<{ items: PoRow[] }>(`/api/mfg-procurement/purchase-orders?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-procurement/suppliers?pageSize=100', undefined, { fallback: { items: [] } }),
    ])
    if (poRes.ok) setOrders(poRes.result?.items ?? [])
    if (supRes.ok) setSOs((supRes.result?.items ?? []).map((s: any) => ({ value: s.id, label: `${s.supplier_code} — ${s.name}` })))
    setLoad(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleAdvance = (po: PoRow) => {
    const currentIdx = PO_STATUS_FLOW.indexOf(po.status)
    if (currentIdx < 0 || currentIdx >= PO_STATUS_FLOW.length - 1) return
    const nextStatus = PO_STATUS_FLOW[currentIdx + 1]
    runMutation({
      context: { entityId: 'mfg_procurement.po', recordId: po.id },
      operation: async () => {
        const updateData: Record<string, any> = { id: po.id, status: nextStatus }
        if (nextStatus === 'at_customs') updateData.actual_arrival_port = new Date().toISOString().split('T')[0]
        if (nextStatus === 'delivered') updateData.actual_warehouse_arrival = new Date().toISOString().split('T')[0]
        await apiCallOrThrow('/api/mfg-procurement/purchase-orders', { method: 'PUT', body: JSON.stringify(updateData) })
        flash(`OC ${po.po_number} → ${PO_STATUS_LABEL[nextStatus]}`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const delayedOrders = orders.filter((o) =>
    ['in_transit', 'at_customs'].includes(o.status) &&
    o.estimated_warehouse_arrival && o.estimated_warehouse_arrival < today
  )

  const totalCif = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_cif_cost), 0)

  const STATUS_FILTERS = [
    { value: 'in_transit', label: 'En tránsito' },
    { value: 'at_customs', label: 'En aduana' },
    { value: '',           label: 'Todas' },
  ]

  const columns: ColumnDef<PoRow>[] = [
    { accessorKey: 'po_number', header: 'OC', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.po_number}</span> },
    { id: 'supplier', header: 'Proveedor', cell: ({ row }) => (
      <div><span className="font-semibold text-sm">{row.original.supplier_name}</span>
      <div className="text-xs text-muted-foreground">{row.original.incoterm ?? '—'} · {row.original.po_type === 'international' ? '🌍 Import.' : '🏭 Nacional'}</div></div>
    )},
    { id: 'amounts', header: 'FOB / CIF Total', cell: ({ row }) => (
      <div className="text-sm">
        <div className="text-muted-foreground">FOB: {row.original.currency} {Number(row.original.subtotal_fob).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        <div className="font-semibold">CIF: {row.original.currency} {Number(row.original.total_cif_cost).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
      </div>
    )},
    { id: 'pipeline', header: 'Progreso', cell: ({ row }) => (
      <div>
        <StatusPipeline status={row.original.status} />
        <div className="text-xs text-muted-foreground mt-1">{PO_STATUS_LABEL[row.original.status] ?? row.original.status}</div>
      </div>
    )},
    { id: 'eta', header: 'ETA almacén', cell: ({ row }) => {
      const d = row.original.estimated_warehouse_arrival
      if (!d) return '—'
      const isLate = d < today && !['delivered', 'cancelled'].includes(row.original.status)
      return <span className={`text-sm ${isLate ? 'text-status-error-text font-semibold' : ''}`}>{new Date(d).toLocaleDateString('es-VE')}{isLate ? ' ⚠' : ''}</span>
    }},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        { id: 'view',   label: 'Ver detalle / CIF',    onSelect: () => router.push(`/backend/mfg-procurement/${row.original.id}`) },
        ...(PO_STATUS_FLOW.includes(row.original.status) && row.original.status !== 'delivered' ? [
          { id: 'advance', label: `→ ${PO_STATUS_LABEL[PO_STATUS_FLOW[PO_STATUS_FLOW.indexOf(row.original.status) + 1]] ?? 'Siguiente'}`, onSelect: () => handleAdvance(row.original) },
        ] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageHeader
        title="Compras Industriales"
        description={delayedOrders.length > 0 ? `${delayedOrders.length} OC(s) con retraso · CIF total activo: USD ${totalCif.toFixed(0)}` : `${orders.length} OC(s) · CIF: USD ${totalCif.toFixed(0)}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm" variant={statusFilter === f.value ? 'default' : 'outline'} onClick={() => setSF(f.value)}>{f.label}</Button>
              ))}
            </div>
            <Button type="button" onClick={() => setForm(!showForm)}><Plus className="size-4 mr-2" /> Nueva OC</Button>
          </div>
        }
      />
      <PageBody>
        {delayedOrders.length > 0 && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
            <span className="text-sm text-status-error-text font-semibold">
              {delayedOrders.length} OC(s) con fecha ETA vencida: {delayedOrders.map((o) => o.po_number).join(', ')} — verificar con agente de aduana.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Ship className="size-4" /> Crear Orden de Compra</h3>
            <CrudForm{...({} as any)} entityId="mfg_procurement.po" apiPath="/api/mfg-procurement/purchase-orders" mode="create"
              fields={[
                { type: 'text' as const,   id: 'po_number',          label: 'Número OC (PO-IMP-2026-XXX)', required: true },
                { type: 'select' as const, id: 'supplier_id',        label: 'Proveedor', required: true, options: supplierOptions },
                { type: 'text' as const,   id: 'supplier_name',      label: 'Nombre del proveedor', required: true },
                { type: 'select' as const, id: 'po_type',            label: 'Tipo', required: true, options: [{ value: 'national', label: 'Nacional' }, { value: 'international', label: 'Internacional (importación)' }] },
                { type: 'text' as const,   id: 'subtotal_fob',       label: 'Valor FOB (USD)', required: true },
                { type: 'select' as const, id: 'incoterm',           label: 'Incoterm', options: [{ value: 'FOB', label: 'FOB' }, { value: 'CIF', label: 'CIF' }, { value: 'EXW', label: 'EXW' }, { value: 'DAP', label: 'DAP' }] },
                { type: 'text' as const,   id: 'country_of_origin',  label: 'País de origen' },
                { type: 'date' as const,   id: 'estimated_ship_date', label: 'Fecha embarque estimada' },
                { type: 'date' as const,   id: 'estimated_warehouse_arrival', label: 'ETA almacén estimada' },
                { type: 'text' as const,   id: 'bcv_rate_at_order',  label: 'Tasa BCV al hacer la OC (Bs/USD)' },
              ]}
              onSuccess={() => { flash('OC creada', 'success'); setForm(false); load() }}
            />
          </div>
        )}

        <DataTable entityId="mfg_procurement.po" data={orders} columns={columns} isLoading={isLoading}
          emptyState="Sin órdenes de compra"
          stickyActionsColumn />
      </PageBody>
    </Page>
  )
}
