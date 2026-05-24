'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Input } from '@open-mercato/ui/primitives/input'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Search, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type RecallRow = {
  id: string; recall_number: string; lot_number: string; recall_class: string
  detection_source: string; initiated_date: string; status: string; public_announcement: boolean
}

type TraceResult = {
  trace: {
    product_lot:     { id: string; lot_number: string; quantity_kg: string; processing_date: string; expiry_date: string | null; status: string }
    slaughter_batch: { batch_number: string; slaughter_date: string; birds_processed: number; yield_pct: string | null; microbiological_result: string } | null
    flock:           { flock_number: string; species: string; genetic_line: string | null; start_date: string; farm_unit: { name: string } | null } | null
    feed:            { allocations: any[]; batches: any[] }
    veterinary:      { vaccinations: any[]; medications: any[]; withdrawal_check: { compliant: boolean; active_withdrawals_at_slaughter: any[] } }
  }
}

const RECALL_STATUS: Record<string, 'error' | 'warning' | 'neutral' | 'success'> = {
  investigating: 'error', executing: 'warning', completed: 'success', closed: 'neutral',
}
const RECALL_STATUS_LABEL: Record<string, string> = {
  investigating: 'Investigando', executing: 'En ejecución', completed: 'Completado', closed: 'Cerrado',
}
const SOURCE_LABEL: Record<string, string> = {
  customer_complaint: 'Reclamo cliente', insai_alert: 'Alerta INSAI',
  internal_analysis: 'Análisis interno', supplier_notification: 'Proveedor', regulatory_audit: 'Auditoría',
}

export default function AgriTraceabilityPage() {
  const router = useRouter()
  const [recalls, setRecalls]     = React.useState<RecallRow[]>([])
  const [isLoading, setLoading]   = React.useState(true)
  const [searchLot, setSearchLot] = React.useState('')
  const [traceResult, setTrace]   = React.useState<TraceResult | null>(null)
  const [tracing, setTracing]     = React.useState(false)

  const loadRecalls = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: RecallRow[] }>('/api/agri-traceability/recalls?pageSize=50', undefined, { fallback: { items: [] } })
    if (res.ok) setRecalls(res.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { loadRecalls() }, [loadRecalls])

  const handleTrace = async () => {
    if (!searchLot.trim()) return
    setTracing(true)
    setTrace(null)
    const res = await apiCall<TraceResult>(`/api/agri-traceability/trace?product_lot=${encodeURIComponent(searchLot.trim())}`)
    if (res.ok && res.result) {
      setTrace(res.result)
    } else {
      flash(`Lote "${searchLot}" no encontrado`, 'error')
    }
    setTracing(false)
  }

  const activeRecalls = recalls.filter(r => r.status === 'investigating' || r.status === 'executing').length

  const recallColumns: ColumnDef<RecallRow>[] = [
    { accessorKey: 'recall_number', header: 'N° Recall', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.recall_number}</span> },
    { accessorKey: 'lot_number', header: 'Lote Afectado', cell: ({ row }) => <span className="font-mono">{row.original.lot_number}</span> },
    { accessorKey: 'recall_class', header: 'Clase', cell: ({ row }) => <span className="font-bold">Clase {row.original.recall_class}</span> },
    { accessorKey: 'detection_source', header: 'Origen', cell: ({ row }) => SOURCE_LABEL[row.original.detection_source] ?? row.original.detection_source },
    { accessorKey: 'initiated_date', header: 'Iniciado', cell: ({ row }) => new Date(row.original.initiated_date).toLocaleDateString('es-VE') },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={RECALL_STATUS[row.original.status] ?? 'neutral'} dot>
          {RECALL_STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            { id: 'open', label: 'Ver detalle / Workflow', onSelect: () => router.push(`/backend/agri-traceability/recalls/${row.original.id}`) },
          ]}
        />
      ),
    },
  ]

  const t = traceResult?.trace

  return (
    <Page>
      <PageHeader
        title="Trazabilidad Alimentaria"
        description={activeRecalls > 0 ? `${activeRecalls} recall(s) activo(s)` : 'Consulta la cadena completa de cualquier lote de producto'}
      />
      <PageBody>
        {/* Trace Search */}
        <div className="mb-6 border border-border rounded-lg p-4 bg-background">
          <h3 className="text-sm font-semibold mb-3">Consultar Trazabilidad de Lote</h3>
          <div className="flex items-center gap-2">
            <Input
              value={searchLot}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchLot(e.target.value)}
              placeholder="N° de lote (ej: PROD-2026-001)"
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleTrace()}
              className="max-w-sm"
            />
            <Button type="button" onClick={handleTrace} disabled={tracing}>
              <Search className="size-4 mr-2" /> {tracing ? 'Consultando...' : 'Trazar'}
            </Button>
          </div>

          {t && (
            <div className="mt-4 space-y-4">
              {/* Compliance alert */}
              {!t.veterinary.withdrawal_check.compliant && (
                <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
                  <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
                  <span className="text-sm text-status-error-text font-semibold">
                    ⚠ Este lote fue beneficiado durante un período de retiro activo. Ver medicamentos.
                  </span>
                </div>
              )}

              {/* Product lot */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Producto Terminado</div>
                  <div className="font-mono font-bold">{t.product_lot.lot_number}</div>
                  <div>{t.product_lot.quantity_kg} kg · {new Date(t.product_lot.processing_date).toLocaleDateString('es-VE')}</div>
                  {t.product_lot.expiry_date && <div className="text-xs text-muted-foreground">Vence: {new Date(t.product_lot.expiry_date).toLocaleDateString('es-VE')}</div>}
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Beneficio</div>
                  {t.slaughter_batch ? (
                    <>
                      <div className="font-mono font-bold">{t.slaughter_batch.batch_number}</div>
                      <div>{new Date(t.slaughter_batch.slaughter_date).toLocaleDateString('es-VE')} · {t.slaughter_batch.birds_processed?.toLocaleString('es-VE')} aves</div>
                      <div className="text-xs text-muted-foreground">Rendimiento: {t.slaughter_batch.yield_pct ? `${parseFloat(t.slaughter_batch.yield_pct).toFixed(2)}%` : '—'}</div>
                    </>
                  ) : <div className="text-muted-foreground text-xs">Sin datos</div>}
                </div>

                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Flock de Origen</div>
                  {t.flock ? (
                    <>
                      <div className="font-mono font-bold">{t.flock.flock_number}</div>
                      <div>{t.flock.species} {t.flock.genetic_line ? `· ${t.flock.genetic_line}` : ''}</div>
                      <div className="text-xs text-muted-foreground">{t.flock.farm_unit?.name ?? '—'}</div>
                    </>
                  ) : <div className="text-muted-foreground text-xs">Sin datos</div>}
                </div>
              </div>

              {/* Feed batches */}
              {t.feed.batches.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Lotes de Alimento Consumido ({t.feed.batches.length})</div>
                  <div className="space-y-1">
                    {(t.feed.batches as any[]).map((b: any) => (
                      <div key={b.id} className="text-sm p-2 bg-muted/20 rounded flex items-center gap-2">
                        <span className="font-mono">{b.batch_number}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{new Date(b.batch_date).toLocaleDateString('es-VE')}</span>
                        {b.supplier_lot_number && <span className="text-xs text-muted-foreground">Prov: {b.supplier_lot_number}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {t.veterinary.medications.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Medicamentos Aplicados ({t.veterinary.medications.length})</div>
                  <div className="space-y-1">
                    {(t.veterinary.medications as any[]).map((m: any) => (
                      <div key={m.id} className={`text-sm p-2 rounded flex items-center gap-2 ${t.veterinary.withdrawal_check.active_withdrawals_at_slaughter.some((a: any) => a.id === m.id) ? 'bg-status-error-bg border border-status-error-border' : 'bg-muted/20'}`}>
                        <span className="font-semibold">{m.medication_name}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs">Retiro hasta: {m.withdrawal_end_date ? new Date(m.withdrawal_end_date).toLocaleDateString('es-VE') : '—'}</span>
                        {m.medication_lot_number && <span className="text-xs text-muted-foreground">Lote: {m.medication_lot_number}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recalls list */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Recalls Activos e Histórico</h3>
          {activeRecalls > 0 && (
            <div className="mb-3 p-3 bg-status-error-bg border border-status-error-border rounded-lg">
              <span className="text-sm text-status-error-text font-semibold">
                🚨 {activeRecalls} recall(s) en curso — acción urgente requerida.
              </span>
            </div>
          )}
          <DataTable
            entityId="agri_traceability.recall"
            data={recalls}
            columns={recallColumns}
            isLoading={isLoading}
            emptyState="Sin recalls registrados"
          />
        </div>
      </PageBody>
    </Page>
  )
}
