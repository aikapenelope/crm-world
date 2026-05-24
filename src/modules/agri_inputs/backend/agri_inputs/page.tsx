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
import { Input } from '@open-mercato/ui/primitives/input'
import { Plus, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type InputRow = {
  id: string
  name: string
  input_type: string
  category: string | null
  unit: string
  quantity_available: string
  min_stock: string
  expiry_date: string | null
  insai_registry: string | null
  lot_number: string | null
  manufacturer: string | null
  is_active: boolean
}

const TYPE_LABEL: Record<string, string> = {
  medication: 'Medicamento', vaccine: 'Vacuna', feed: 'Alimento',
  agrochemical: 'Agroquímico', material: 'Material',
}

export default function AgriInputsPage() {
  const { runMutation } = useGuardedMutation()
  const [items, setItems]        = React.useState<InputRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [editing, setEditing]    = React.useState<InputRow | null>(null)
  const [showAdjustId, setAdjust] = React.useState<string | null>(null)
  const [typeFilter, setType]    = React.useState('')

  const today = new Date().toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '200' })
    if (typeFilter) params.set('input_type', typeFilter)
    const res = await apiCall<{ items: InputRow[] }>(`/api/agri-inputs/items?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setItems(res.result?.items ?? [])
    setLoading(false)
  }, [typeFilter])

  React.useEffect(() => { load() }, [load])

  const handleAdjust = (itemId: string, qty: string) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_inputs.item', recordId: itemId },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-inputs/movements', {
          method: 'POST',
          body: JSON.stringify({
            input_item_id: itemId,
            movement_type: 'adjustment',
            quantity: qty,
            reference_type: 'manual',
          }),
        })
        flash('Stock ajustado', 'success')
        setAdjust(null)
        load()
      },
    })
  }

  const lowStockCount    = items.filter(i => Number(i.quantity_available) <= Number(i.min_stock)).length
  const expiringCount    = items.filter(i => i.expiry_date && i.expiry_date <= in30Days && i.expiry_date >= today).length

  const formFields = [
    { type: 'text' as const,   id: 'name',              label: 'Nombre',                    required: true },
    { type: 'select' as const, id: 'input_type',        label: 'Tipo de Insumo',             required: true,
      options: [
        { value: 'medication',   label: 'Medicamento Veterinario' },
        { value: 'vaccine',      label: 'Vacuna' },
        { value: 'feed',         label: 'Alimento Balanceado' },
        { value: 'agrochemical', label: 'Agroquímico' },
        { value: 'material',     label: 'Material de Granja' },
      ]},
    { type: 'text' as const,   id: 'category',          label: 'Categoría (libre)' },
    { type: 'select' as const, id: 'unit',              label: 'Unidad de Medida',
      options: [
        { value: 'doses', label: 'Dosis' }, { value: 'ml', label: 'Mililitros' },
        { value: 'liters', label: 'Litros' }, { value: 'kg', label: 'Kilogramos' },
        { value: 'g', label: 'Gramos' }, { value: 'units', label: 'Unidades' },
      ]},
    { type: 'text' as const,   id: 'insai_registry',    label: 'Registro INSAI' },
    { type: 'text' as const,   id: 'active_ingredient', label: 'Principio Activo' },
    { type: 'text' as const,   id: 'manufacturer',      label: 'Fabricante' },
    { type: 'text' as const,   id: 'lot_number',        label: 'Número de Lote' },
    { type: 'date' as const,   id: 'expiry_date',       label: 'Fecha de Vencimiento' },
    { type: 'text' as const,   id: 'storage_temp_min',  label: 'Temp. Mín. Almacenamiento (°C)' },
    { type: 'text' as const,   id: 'storage_temp_max',  label: 'Temp. Máx. Almacenamiento (°C)' },
    { type: 'text' as const,   id: 'min_stock',         label: 'Stock Mínimo' },
    { type: 'text' as const,   id: 'reorder_quantity',  label: 'Cantidad de Reposición' },
    { type: 'text' as const,   id: 'unit_cost_usd',     label: 'Costo Unitario (USD)' },
    { type: 'textarea' as const, id: 'notes',           label: 'Notas' },
  ]

  const columns: ColumnDef<InputRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'input_type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABEL[row.original.input_type] ?? row.original.input_type,
    },
    {
      accessorKey: 'quantity_available',
      header: 'Stock Actual',
      cell: ({ row }) => {
        const qty = Number(row.original.quantity_available)
        const min = Number(row.original.min_stock)
        const isLow = qty <= min
        return (
          <div>
            <span className={`font-semibold ${isLow ? 'text-status-error-text' : ''}`}>
              {qty.toFixed(1)} {row.original.unit}
            </span>
            {isLow && <div className="text-xs text-status-error-text">⚠ Stock bajo</div>}
          </div>
        )
      },
    },
    {
      accessorKey: 'expiry_date',
      header: 'Vencimiento',
      cell: ({ row }) => {
        const d = row.original.expiry_date
        if (!d) return '—'
        const isExpiring = d <= in30Days && d >= today
        const isExpired  = d < today
        return (
          <span className={isExpired ? 'text-status-error-text font-semibold' : isExpiring ? 'text-status-warning-text font-semibold' : ''}>
            {new Date(d).toLocaleDateString('es-VE')}
            {isExpired && ' (Vencido)'}
            {isExpiring && !isExpired && ' (Próximo)'}
          </span>
        )
      },
    },
    {
      accessorKey: 'lot_number',
      header: 'Lote',
      cell: ({ row }) => row.original.lot_number ?? '—',
    },
    {
      accessorKey: 'insai_registry',
      header: 'Reg. INSAI',
      cell: ({ row }) => row.original.insai_registry
        ? <StatusBadge variant="success">{row.original.insai_registry}</StatusBadge>
        : <StatusBadge variant="neutral">Sin registro</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            { id: 'edit',   label: 'Editar',         onSelect: () => { setEditing(row.original); setShowForm(true) } },
            { id: 'adjust', label: 'Ajustar stock',  onSelect: () => setAdjust(row.original.id) },
          ]}
        />
      ),
    },
  ]

  const TYPE_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'medication', label: 'Medicamentos' },
    { value: 'vaccine',    label: 'Vacunas' },
    { value: 'feed',       label: 'Alimento' },
    { value: 'agrochemical', label: 'Agroquímicos' },
    { value: 'material',   label: 'Materiales' },
  ]

  return (
    <Page>
      <PageHeader
        title="Inventario de Insumos"
        description={[
          lowStockCount > 0 && `${lowStockCount} con stock bajo`,
          expiringCount > 0 && `${expiringCount} próximos a vencer`,
        ].filter(Boolean).join(' · ') || `${items.length} ítems registrados`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TYPE_FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm"
                  variant={typeFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setType(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => { setEditing(null); setShowForm(true) }}>
              <Plus className="size-4 mr-2" /> Nuevo Insumo
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* Alert banner */}
        {(lowStockCount > 0 || expiringCount > 0) && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-warning-icon shrink-0" />
            <span className="text-sm text-status-warning-text">
              {[
                lowStockCount > 0 && `${lowStockCount} insumo(s) con stock bajo`,
                expiringCount > 0 && `${expiringCount} insumo(s) próximos a vencer (≤ 30 días)`,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}

        {/* Stock adjustment inline form */}
        {showAdjustId && (
          <div className="mb-4 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Ajustar Stock</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Ingresa una cantidad positiva para entrada o negativa para salida.
            </p>
            <AdjustForm
              onSubmit={(qty) => handleAdjust(showAdjustId, qty)}
              onCancel={() => setAdjust(null)}
            />
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">{editing ? `Editar — ${editing.name}` : 'Nuevo Insumo'}</h3>
            <CrudForm
              entityId="agri_inputs.item"
              apiPath="/api/agri-inputs/items"
              mode={editing ? 'edit' : 'create'}
              initial={editing ?? undefined}
              fields={formFields}
              groups={[
                { id: 'general',     title: 'General',          fields: ['name', 'input_type', 'category', 'unit'] },
                { id: 'regulatory',  title: 'Datos Regulatorios', fields: ['insai_registry', 'active_ingredient', 'manufacturer', 'lot_number', 'expiry_date'] },
                { id: 'storage',     title: 'Almacenamiento',   fields: ['storage_temp_min', 'storage_temp_max'] },
                { id: 'stock',       title: 'Stock',            fields: ['min_stock', 'reorder_quantity', 'unit_cost_usd'] },
                { id: 'notes',       title: 'Notas',            fields: ['notes'] },
              ]}
              onSuccess={() => { flash(editing ? 'Insumo actualizado' : 'Insumo registrado', 'success'); setShowForm(false); setEditing(null); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_inputs.item"
          extensionTableId="agri-inputs-items-list"
          data={items}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin insumos registrados', description: 'Registra medicamentos, vacunas y materiales para gestionar el inventario.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}

// Small inline component for stock adjustment
function AdjustForm({ onSubmit, onCancel }: { onSubmit: (qty: string) => void; onCancel: () => void }) {
  const [qty, setQty] = React.useState('')
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="any"
        value={qty}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)}
        placeholder="Ej: 100 o -10"
        className="w-40"
      />
      <Button type="button" size="sm" onClick={() => qty && onSubmit(qty)}>Aplicar</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancelar</Button>
    </div>
  )
}
