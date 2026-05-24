'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { ArrowLeft, Plus, CheckCircle } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'
import type { ColumnDef } from '@tanstack/react-table'

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  receiving: 'info', processing: 'info', chilling: 'warning',
  pending_qc: 'warning', approved: 'success', dispatched: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  receiving: 'Recibiendo', processing: 'En proceso', chilling: 'En frío',
  pending_qc: 'Pendiente QC', approved: 'Aprobado', dispatched: 'Despachado',
}
const LOT_STATUS_VARIANT: Record<string, 'success' | 'info' | 'neutral' | 'error'> = {
  in_stock: 'success', partially_dispatched: 'info', fully_dispatched: 'neutral', recalled: 'error',
}
const LOT_STATUS_LABEL: Record<string, string> = {
  in_stock: 'En stock', partially_dispatched: 'Parcial', fully_dispatched: 'Despachado', recalled: 'Recall',
}

function StatCard({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  )
}

export default function SlaughterBatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const batchId = params.id

  const [state, setState]      = React.useState<PageState>('loading')
  const [batch, setBatch]      = React.useState<any>(null)
  const [lots, setLots]        = React.useState<any[]>([])
  const [showLotForm, setLotForm] = React.useState(false)
  const [formulaOptions, setFormulas] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setState('loading')
    const [batchRes, lotsRes, formulasRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/agri-processing/slaughter-batches?id=${batchId}`),
      apiCall<{ items: any[] }>(`/api/agri-processing/processing-lots?slaughter_batch_id=${batchId}&pageSize=50`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-processing/processing-formulas?pageSize=100&is_active=true', undefined, { fallback: { items: [] } }),
    ])
    const b = (batchRes.result?.items ?? [])[0] ?? null
    if (!b) { setState('notFound'); return }
    setBatch(b)
    setLots(lotsRes.result?.items ?? [])
    setFormulas((formulasRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.name })))
    setState('ready')
  }, [batchId])

  React.useEffect(() => { load() }, [load])

  const handleApproveDispatch = () => {
    runMutation({
      context: { entityId: 'agri_processing.batch', recordId: batchId },
      operation: async () => {
        await apiCallOrThrow('/api/agri-processing/slaughter-batches', {
          method: 'PUT',
          body: JSON.stringify({ id: batchId, status: 'approved', dispatch_approved_at: new Date().toISOString() }),
        })
        flash('Despacho aprobado por calidad', 'success')
        load()
      },
    })
  }

  const lotsColumns: ColumnDef<any>[] = [
    { accessorKey: 'lot_number', header: 'N° Lote Producto', cell: ({ row }) => <span className="font-mono font-semibold">{(row.original as any).lot_number}</span> },
    { accessorKey: 'processing_date', header: 'Fecha', cell: ({ row }) => new Date((row.original as any).processing_date).toLocaleDateString('es-VE') },
    { accessorKey: 'quantity_kg', header: 'Cantidad (kg)', cell: ({ row }) => `${(row.original as any).quantity_kg} kg` },
    { accessorKey: 'expiry_date', header: 'Vencimiento', cell: ({ row }) => (row.original as any).expiry_date ? new Date((row.original as any).expiry_date).toLocaleDateString('es-VE') : '—' },
    { accessorKey: 'barcode', header: 'Código de Barras', cell: ({ row }) => (row.original as any).barcode ?? '—' },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={LOT_STATUS_VARIANT[(row.original as any).status] ?? 'neutral'} dot>
          {LOT_STATUS_LABEL[(row.original as any).status] ?? (row.original as any).status}
        </StatusBadge>
      ),
    },
  ]

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando lote de beneficio..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-processing')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Beneficios
      </Button>
      <ErrorMessage label="Lote de beneficio no encontrado." />
    </PageBody></Page>
  )

  return (
    <Page>
      <PageHeader
        title={batch.batch_number}
        description={`${new Date(batch.slaughter_date).toLocaleDateString('es-VE')} · ${batch.birds_processed.toLocaleString('es-VE')} aves procesadas`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-processing')}>
              <ArrowLeft className="mr-2 size-4" /> Beneficios
            </Button>
            <StatusBadge variant={STATUS_VARIANT[batch.status] ?? 'neutral'} dot>
              {STATUS_LABEL[batch.status] ?? batch.status}
            </StatusBadge>
            {batch.status === 'pending_qc' && (
              <Button type="button" onClick={handleApproveDispatch}>
                <CheckCircle className="size-4 mr-2" /> Aprobar Despacho
              </Button>
            )}
            {batch.status === 'approved' && (
              <Button type="button" onClick={() => setLotForm(true)}>
                <Plus className="size-4 mr-2" /> Registrar Producto
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Aves ingresadas"    value={batch.birds_in.toLocaleString('es-VE')} />
          <StatCard label="Aves beneficiadas"  value={batch.birds_processed.toLocaleString('es-VE')} />
          <StatCard label="Rendimiento canal"  value={batch.yield_pct ? `${parseFloat(batch.yield_pct).toFixed(2)}%` : '—'} sub="Ross 308 típico: 73-75%" />
          <StatCard label="Decomisos"          value={batch.condemned_count} />
          <StatCard label="Peso vivo (kg)"     value={batch.live_weight_kg} />
          <StatCard label="Canal frío (kg)"    value={batch.carcass_weight_cold_kg ?? '—'} />
          <StatCard label="Microbiología"      value={batch.microbiological_result === 'approved' ? 'Aprobada' : batch.microbiological_result === 'rejected' ? 'Rechazada' : 'Pendiente'} />
          <StatCard label="Lotes de producto"  value={lots.length} />
        </div>

        {/* Inline form to register a finished product lot */}
        {showLotForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Lote de Producto Terminado</h3>
            <CrudForm
              entityId="agri_processing.lot"
              apiPath="/api/agri-processing/processing-lots"
              mode="create"
              initial={{ slaughter_batch_id: batchId }}
              fields={[
                { type: 'text' as const,   id: 'lot_number',         label: 'N° Lote Producto (PROD-2026-XXX)', required: true },
                { type: 'select' as const, id: 'formula_id',         label: 'Fórmula de Procesamiento',        required: true, options: formulaOptions },
                { type: 'date' as const,   id: 'processing_date',    label: 'Fecha de Procesamiento',          required: true },
                { type: 'text' as const,   id: 'quantity_kg',        label: 'Cantidad producida (kg)',         required: true },
                { type: 'number' as const, id: 'unit_count',         label: 'Número de Unidades' },
                { type: 'number' as const, id: 'package_weight_g',   label: 'Peso por Unidad (g)' },
                { type: 'text' as const,   id: 'barcode',            label: 'Código de Barras (EAN-13)' },
                { type: 'date' as const,   id: 'expiry_date',        label: 'Fecha de Vencimiento' },
                { type: 'textarea' as const, id: 'notes',            label: 'Observaciones' },
              ]}
              groups={[
                { id: 'product',  title: 'Producto',     fields: ['lot_number', 'formula_id', 'processing_date', 'quantity_kg'] },
                { id: 'packing',  title: 'Empaque',      fields: ['unit_count', 'package_weight_g', 'barcode', 'expiry_date'] },
                { id: 'notes',    title: 'Notas',        fields: ['notes'] },
              ]}
              onSubmit={async (values) => {
                await apiCallOrThrow('/api/agri-processing/processing-lots', {
                  method: 'POST',
                  body: JSON.stringify({ ...values, slaughter_batch_id: batchId }),
                })
                flash('Lote de producto registrado', 'success')
                setLotForm(false)
                load()
              }}
            />
          </div>
        )}

        {/* Workflow de Despacho Sanitario — aparece cuando el lote llega a pending_qc */}
        {(batch.status === 'pending_qc' || batch.status === 'approved') && (
          <div className="mb-6">
            <WorkflowApprovalWidget
              workflowId="despacho_sanitario_v1"
              entityId={batchId}
              entityType="AgriSlaughterBatch"
              title="Despacho Sanitario"
              startLabel="Solicitar aprobación de calidad para despacho"
              startContext={{
                batch_id:               batchId,
                batch_number:           batch.batch_number,
                birds_processed:        batch.birds_processed,
                yield_pct:              batch.yield_pct,
                microbiological_result: batch.microbiological_result,
                condemned_count:        batch.condemned_count,
              }}
              decisions={[
                { value: 'approve', label: 'Aprobado — autorizar despacho',   variant: 'default' },
                { value: 'hold',    label: 'En espera — falta documentación', variant: 'outline' },
                { value: 'reject',  label: 'Rechazado — no cumple estándares', variant: 'destructive' },
              ]}
              onCompleted={() => load()}
            />
          </div>
        )}

        {/* Product lots table */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Lotes de Producto Terminado ({lots.length})</h3>
          <DataTable
            entityId="agri_processing.lot"
            extensionTableId="agri-processing-lots-by-batch"
            data={lots}
            columns={lotsColumns}
            isLoading={false}
            emptyState='Sin productos terminados'
          />
        </div>
      </PageBody>
    </Page>
  )
}
