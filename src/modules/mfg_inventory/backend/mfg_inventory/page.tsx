'use client'

import * as React from 'react'
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
import { Plus, Package, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type LotRow = {
  id: string; lot_number: string; material_code: string; material_name: string
  material_type: string; quantity: string; uom: string; status: string
  expiry_date: string | null; entry_date: string; unit_cost_usd: string | null
}

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
  quarantine: 'warning', available: 'success', reserved: 'info',
  consumed: 'neutral', expired: 'error', rejected: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  quarantine: 'Cuarentena', available: 'Disponible', reserved: 'Reservado',
  consumed: 'Consumido', expired: 'Vencido', rejected: 'Rechazado',
}
const MATERIAL_TYPE_LABEL: Record<string, string> = {
  raw_material: 'Materia Prima', packaging: 'Empaque', wip: 'WIP', finished_goods: 'PT',
}

export default function MfgInventoryPage() {
  const { runMutation } = useGuardedMutation()
  const [lots, setLots]          = React.useState<LotRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [statusFilter, setFilter] = React.useState('available')
  const [typeFilter, setType]     = React.useState('')
  const [showReceive, setReceive] = React.useState(false)
  const [locationOptions, setLocations] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '200' })
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('material_type', typeFilter)
    const [lotRes, locRes] = await Promise.all([
      apiCall<{ items: LotRow[] }>(`/api/mfg-inventory/stock-lots?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-inventory/warehouse-locations?pageSize=100', undefined, { fallback: { items: [] } }),
    ])
    if (lotRes.ok) setLots(lotRes.result?.items ?? [])
    if (locRes.ok) setLocations((locRes.result?.items ?? []).map((l: any) => ({ value: l.id, label: `${l.code} — ${l.name}` })))
    setLoading(false)
  }, [statusFilter, typeFilter])

  React.useEffect(() => { load() }, [load])

  const handleRelease = (lot: LotRow) => {
    runMutation({
      context: { entityId: 'mfg_inventory.lot', recordId: lot.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-inventory/stock-movements', {
          method: 'POST',
          body: JSON.stringify({ lot_id: lot.id, movement_type: 'quarantine_release', quantity: '0', reference_type: 'manual', reason: 'Liberado manualmente de cuarentena' }),
        })
        flash(`Lote ${lot.lot_number} liberado de cuarentena`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const quarantineCount = lots.filter((l) => l.status === 'quarantine').length
  const expiringCount   = lots.filter((l) => l.expiry_date && l.expiry_date <= in30Days && l.expiry_date >= today && l.status === 'available').length
  const totalAvailableKg = lots.filter((l) => l.status === 'available').reduce((s, l) => s + Number(l.quantity), 0)

  const columns: ColumnDef<LotRow>[] = [
    {
      accessorKey: 'lot_number',
      header: 'Lote',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.lot_number}</span>,
    },
    {
      accessorKey: 'material_code',
      header: 'Material',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-sm">{row.original.material_code}</span>
          <div className="text-xs text-muted-foreground">{row.original.material_name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'material_type',
      header: 'Tipo',
      cell: ({ row }) => <span className="text-xs">{MATERIAL_TYPE_LABEL[row.original.material_type] ?? row.original.material_type}</span>,
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => <span className="font-semibold">{Number(row.original.quantity).toFixed(3)} {row.original.uom}</span>,
    },
    {
      accessorKey: 'expiry_date',
      header: 'Vencimiento',
      cell: ({ row }) => {
        const d = row.original.expiry_date
        if (!d) return '—'
        const isExpired  = d < today
        const isExpiring = d <= in30Days && d >= today
        return (
          <span className={isExpired ? 'text-status-error-text font-semibold' : isExpiring ? 'text-status-warning-text font-semibold' : ''}>
            {new Date(d).toLocaleDateString('es-VE')}
            {isExpired && ' ⚠'}
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
          ...(row.original.status === 'quarantine' ? [
            { id: 'release', label: 'Liberar de cuarentena', onSelect: () => handleRelease(row.original) },
          ] : []),
        ]} />
      ),
    },
  ]

  const TYPE_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'raw_material', label: 'MP' },
    { value: 'packaging',    label: 'Empaque' },
    { value: 'wip',          label: 'WIP' },
    { value: 'finished_goods', label: 'PT' },
  ]
  const STATUS_FILTERS = [
    { value: 'available',  label: 'Disponible' },
    { value: 'quarantine', label: 'Cuarentena' },
    { value: '',           label: 'Todos' },
  ]

  return (
    <Page>
      <PageHeader
        title="Almacén de Manufactura"
        description={[
          quarantineCount > 0 && `${quarantineCount} lote(s) en cuarentena`,
          expiringCount > 0 && `${expiringCount} por vencer`,
        ].filter(Boolean).join(' · ') || `${totalAvailableKg.toFixed(0)} kg disponibles`}
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
            <Select value={typeFilter} onValueChange={setType}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={() => setReceive(!showReceive)}>
              <Plus className="size-4 mr-2" /> Recibir material
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* Alert banners */}
        {(quarantineCount > 0 || expiringCount > 0) && (
          <div className="mb-4 space-y-2">
            {quarantineCount > 0 && (
              <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
                <Package className="size-4 text-status-warning-icon shrink-0" />
                <span className="text-sm text-status-warning-text">
                  <strong>{quarantineCount} lote(s)</strong> en cuarentena esperando liberación por QC.
                </span>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
                <span className="text-sm text-status-error-text">
                  <strong>{expiringCount} lote(s)</strong> vencen en los próximos 30 días — revisar FEFO.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Receive form */}
        {showReceive && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Recibir Material en Almacén (GR)</h3>
            <CrudForm
              entityId="mfg_inventory.lot"
              apiPath="/api/mfg-inventory/stock-lots"
              mode="create"
              initial={{ status: 'quarantine', entry_date: new Date().toISOString().split('T')[0] }}
              fields={[
                { type: 'text' as const,   id: 'material_code',       label: 'Código del Material', required: true },
                { type: 'text' as const,   id: 'material_name',       label: 'Nombre del Material', required: true },
                { type: 'select' as const, id: 'material_type',       label: 'Tipo', required: true,
                  options: [
                    { value: 'raw_material', label: 'Materia Prima' },
                    { value: 'packaging',    label: 'Material de Empaque' },
                    { value: 'finished_goods', label: 'Producto Terminado' },
                  ]},
                { type: 'text' as const,   id: 'lot_number',          label: 'Número de Lote Interno', required: true },
                { type: 'text' as const,   id: 'supplier_lot_number', label: 'Lote del Proveedor (trazabilidad)' },
                { type: 'text' as const,   id: 'quantity',            label: 'Cantidad recibida', required: true },
                { type: 'text' as const,   id: 'uom',                 label: 'Unidad de Medida', required: true },
                { type: 'text' as const,   id: 'unit_cost_usd',       label: 'Costo Unitario (USD)' },
                { type: 'date' as const,   id: 'expiry_date',         label: 'Fecha de Vencimiento' },
                { type: 'select' as const, id: 'location_id',        label: 'Ubicación en Almacén',
                  options: locationOptions },
                { type: 'textarea' as const, id: 'notes',            label: 'Notas de recepción' },
              ]}
              groups={[
                { id: 'material', title: 'Material',     fields: ['material_code', 'material_name', 'material_type'] },
                { id: 'lot',      title: 'Lote',         fields: ['lot_number', 'supplier_lot_number', 'quantity', 'uom', 'unit_cost_usd'] },
                { id: 'storage',  title: 'Almacenamiento', fields: ['expiry_date', 'location_id', 'notes'] },
              ]}
              onSuccess={() => {
                flash('Material recibido en cuarentena — pendiente de inspección QC', 'info')
                setReceive(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="mfg_inventory.lot"
          extensionTableId="mfg-inventory-lots-list"
          data={lots}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin lotes de inventario"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
