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
import { Plus, ShieldAlert } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type BatchRow = {
  id: string; batch_number: string; flock_id: string; slaughter_date: string
  birds_in: number; birds_processed: number; live_weight_kg: string
  carcass_weight_cold_kg: string | null; yield_pct: string | null
  condemned_count: number; microbiological_result: string; status: string
}

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  receiving: 'info', processing: 'info', chilling: 'warning',
  pending_qc: 'warning', approved: 'success', dispatched: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  receiving: 'Recibiendo', processing: 'En proceso', chilling: 'En frío',
  pending_qc: 'Pendiente QC', approved: 'Aprobado', dispatched: 'Despachado',
}
const MICROBIO_VARIANT: Record<string, 'neutral' | 'success' | 'error'> = {
  pending: 'neutral', approved: 'success', rejected: 'error',
}
const MICROBIO_LABEL: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }

export default function AgriProcessingPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [batches, setBatches]   = React.useState<BatchRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [flockOptions, setFlocks] = React.useState<{ value: string; label: string }[]>([])
  const [statusFilter, setFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [batchRes, flockRes] = await Promise.all([
      apiCall<{ items: BatchRow[] }>(`/api/agri-processing/slaughter-batches?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-units/flocks?pageSize=100&status=active', undefined, { fallback: { items: [] } }),
    ])
    if (batchRes.ok)  setBatches(batchRes.result?.items ?? [])
    if (flockRes.ok)  setFlocks((flockRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.flock_number })))
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleAdvanceStatus = (batch: BatchRow) => {
    const nextStatus: Record<string, string> = {
      receiving: 'processing', processing: 'chilling',
      chilling: 'pending_qc', approved: 'dispatched',
    }
    const next = nextStatus[batch.status]
    if (!next) return
    runMutation({
      context: { entityId: 'agri_processing.batch', recordId: batch.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-processing/slaughter-batches', {
          method: 'PUT',
          body: JSON.stringify({ id: batch.id, status: next }),
        })
        flash(`Estado actualizado → ${STATUS_LABEL[next] ?? next}`, 'success')
        load()
      },
    })
  }

  const pendingQcCount = batches.filter(b => b.status === 'pending_qc').length

  const columns: ColumnDef<BatchRow>[] = [
    {
      accessorKey: 'batch_number',
      header: 'N° Lote',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.batch_number}</span>,
    },
    {
      accessorKey: 'slaughter_date',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.slaughter_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'birds_processed',
      header: 'Aves / Decomisos',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">{row.original.birds_processed.toLocaleString('es-VE')}</span>
          {row.original.condemned_count > 0 && (
            <span className="text-xs text-status-error-text ml-2">({row.original.condemned_count} dec.)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'yield_pct',
      header: 'Rendimiento',
      cell: ({ row }) => {
        const y = row.original.yield_pct
        if (!y) return '—'
        const n = parseFloat(y)
        return <span className={n < 72 ? 'text-status-warning-text font-semibold' : ''}>{n.toFixed(2)}%</span>
      },
    },
    {
      accessorKey: 'microbiological_result',
      header: 'Microbiología',
      cell: ({ row }) => (
        <StatusBadge variant={MICROBIO_VARIANT[row.original.microbiological_result] ?? 'neutral'} dot>
          {MICROBIO_LABEL[row.original.microbiological_result] ?? row.original.microbiological_result}
        </StatusBadge>
      ),
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
      cell: ({ row }) => {
        const next: Record<string, string> = {
          receiving: 'processing', processing: 'chilling',
          chilling: 'pending_qc', approved: 'dispatched',
        }
        const nextLabel: Record<string, string> = {
          receiving: '→ En proceso', processing: '→ En frío',
          chilling: '→ Pendiente QC', approved: '→ Despachar',
        }
        return (
          <RowActions items={[
            { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/agri-processing/${row.original.id}`) },
            ...(next[row.original.status] ? [{ id: 'advance', title: nextLabel[row.original.status] ?? 'Avanzar estado', onSelect: () => handleAdvanceStatus(row.original) }] : []),
          ]} />
        )
      },
    },
  ]

  const FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'processing', label: 'En proceso' },
    { value: 'pending_qc', label: 'Pendiente QC' },
    { value: 'approved', label: 'Aprobados' },
  ]

  return (
    <Page>
      <PageHeader
        title="Planta de Beneficio"
        description={pendingQcCount > 0 ? `${pendingQcCount} lote(s) pendiente(s) de aprobación QC` : undefined}
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
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" /> Nuevo Lote
            </Button>
          </div>
        }
      />
      <PageBody>
        {pendingQcCount > 0 && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
            <ShieldAlert className="size-4 text-status-warning-icon shrink-0" />
            <span className="text-sm text-status-warning-text">
              <strong>{pendingQcCount} lote(s)</strong> esperan aprobación del jefe de calidad antes de poder despacharse.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Lote de Beneficio</h3>
            <CrudForm
              entityId="agri_processing.slaughter_batch"
              apiPath="/api/agri-processing/slaughter-batches"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'batch_number',    label: 'N° Lote (BENEF-2026-XXX)', required: true },
                { type: 'select' as const, id: 'flock_id',        label: 'Lote de Aves',             required: true, options: flockOptions },
                { type: 'date' as const,   id: 'slaughter_date',  label: 'Fecha de Beneficio',       required: true },
                { type: 'number' as const, id: 'birds_in',        label: 'Aves Ingresadas',          required: true },
                { type: 'text' as const,   id: 'live_weight_kg',  label: 'Peso Vivo Total (kg)',     required: true },
                { type: 'number' as const, id: 'birds_processed', label: 'Aves Beneficiadas',        required: true },
                { type: 'number' as const, id: 'condemned_count', label: 'Decomisos' },
                { type: 'text' as const,   id: 'condemned_reason',label: 'Causa del Decomiso' },
                { type: 'textarea' as const, id: 'notes',         label: 'Observaciones' },
              ]}
              groups={[
                { id: 'counts', title: 'Conteos',   fields: ['batch_number', 'flock_id', 'slaughter_date', 'birds_in', 'live_weight_kg', 'birds_processed'] },
                { id: 'quality', title: 'Calidad',  fields: ['condemned_count', 'condemned_reason', 'notes'] },
              ]}
              onSuccess={() => { flash('Lote de beneficio registrado', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_processing.slaughter_batch"
          extensionTableId="agri-processing-batches-list"
          data={batches}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin lotes de beneficio'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
