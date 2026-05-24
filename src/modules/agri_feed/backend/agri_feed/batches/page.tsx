'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type BatchRow = {
  id: string
  batch_number: string
  formula_id: string
  batch_date: string
  quantity_tons: string
  source_type: string
  aflatoxin_ppb: string | null
  protein_result_pct: string | null
  status: string
  cost_per_ton_usd: string | null
}

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  pending_analysis: 'warning', approved: 'success',
  rejected: 'error', consumed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  pending_analysis: 'Análisis pendiente', approved: 'Aprobado',
  rejected: 'Rechazado', consumed: 'Consumido',
}

export default function FeedBatchesPage() {
  const { runMutation } = useGuardedMutation({ contextId: 'agri_feed.page' })
  const [batches, setBatches]   = React.useState<BatchRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [formulas, setFormulas] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const [batchRes, formulaRes] = await Promise.all([
      apiCall<{ items: BatchRow[] }>('/api/agri-feed/batches?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-feed/formulas?pageSize=100&is_active=true', undefined, { fallback: { items: [] } }),
    ])
    if (batchRes.ok)   setBatches(batchRes.result?.items ?? [])
    if (formulaRes.ok) setFormulas((formulaRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.name })))
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleApprove = (batch: BatchRow) => {
    runMutation({
      context: { entityId: 'agri_feed.batch', recordId: batch.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-feed/batches', {
          method: 'PUT',
          body: JSON.stringify({ id: batch.id, status: 'approved' }),
        })
        flash('Lote aprobado', 'success')
        load()
      },
    })
  }

  const handleReject = (batch: BatchRow) => {
    runMutation({
      context: { entityId: 'agri_feed.batch', recordId: batch.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-feed/batches', {
          method: 'PUT',
          body: JSON.stringify({ id: batch.id, status: 'rejected' }),
        })
        flash('Lote rechazado', 'warning')
        load()
      },
    })
  }

  const columns: ColumnDef<BatchRow>[] = [
    {
      accessorKey: 'batch_number',
      header: 'N° Lote',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.batch_number}</span>,
    },
    {
      accessorKey: 'batch_date',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.batch_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'quantity_tons',
      header: 'Cantidad',
      cell: ({ row }) => `${row.original.quantity_tons} t`,
    },
    {
      accessorKey: 'source_type',
      header: 'Origen',
      cell: ({ row }) =>
        row.original.source_type === 'own_production' ? 'Producción propia' : 'Comprado',
    },
    {
      accessorKey: 'protein_result_pct',
      header: 'Proteína real',
      cell: ({ row }) => row.original.protein_result_pct ? `${row.original.protein_result_pct}%` : '—',
    },
    {
      accessorKey: 'aflatoxin_ppb',
      header: 'Aflatoxinas (ppb)',
      cell: ({ row }) => {
        const val = row.original.aflatoxin_ppb
        if (!val) return '—'
        const n = parseFloat(val)
        return (
          <span className={n > 20 ? 'text-status-error-text font-semibold' : ''}>
            {val} {n > 20 && '⚠ > 20 ppb'}
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
        <RowActions
          items={[
            ...(row.original.status === 'pending_analysis' ? [
              { id: 'approve', label: 'Aprobar lote',  onSelect: () => handleApprove(row.original) },
              { id: 'reject',  label: 'Rechazar lote'as const, onSelect: () => handleReject(row.original) },
            ] : []),
            { id: 'edit', label: 'Editar', onSelect: () => {} },
          ]}
        />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Lotes de Alimento"
        description={`${batches.filter(b => b.status === 'pending_analysis').length} pendientes de análisis`}
        actions={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" /> Nuevo Lote
          </Button>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Lote de Alimento</h3>
            <CrudForm
              fields={[
                { type: 'text' as const,   id: 'batch_number',        label: 'Número de Lote',         required: true },
                { type: 'select' as const, id: 'formula_id',          label: 'Fórmula',                required: true, options: formulas },
                { type: 'date' as const,   id: 'batch_date',          label: 'Fecha',                  required: true },
                { type: 'text' as const,   id: 'quantity_tons',       label: 'Cantidad (toneladas)',    required: true },
                { type: 'select' as const, id: 'source_type',         label: 'Origen',
                  options: [
                    { value: 'purchased',       label: 'Comprado a terceros' },
                    { value: 'own_production',  label: 'Producción propia' },
                  ]},
                { type: 'text' as const,   id: 'supplier_invoice',    label: 'Factura del Proveedor' },
                { type: 'text' as const,   id: 'supplier_lot_number', label: 'Lote del Proveedor' },
                { type: 'text' as const,   id: 'protein_result_pct',  label: 'Proteína Real (%)' },
                { type: 'text' as const,   id: 'moisture_result_pct', label: 'Humedad (%)' },
                { type: 'text' as const,   id: 'aflatoxin_ppb',       label: 'Aflatoxinas (ppb) — Límite: 20 ppb' },
                { type: 'text' as const,   id: 'cost_per_ton_usd',    label: 'Costo Real (USD/ton)' },
                { type: 'textarea' as const, id: 'notes',             label: 'Observaciones' },
              ]}
              groups={[
                { id: 'general',   title: 'General',     fields: ['batch_number', 'formula_id', 'batch_date', 'quantity_tons', 'source_type'] },
                { id: 'supplier',  title: 'Proveedor',   fields: ['supplier_invoice', 'supplier_lot_number'] },
                { id: 'analysis',  title: 'Análisis QC', fields: ['protein_result_pct', 'moisture_result_pct', 'aflatoxin_ppb'] },
                { id: 'cost',      title: 'Costo',       fields: ['cost_per_ton_usd', 'notes'] },
              ]}
              cancelHref="/backend/agri_feed/batches"
              onSubmit={async (values) => {
                await createCrud('agri-feed/batches', values)
                flash('Lote registrado', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_feed.batch"
          data={batches}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin lotes de alimento"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
