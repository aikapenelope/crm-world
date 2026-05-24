'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { ArrowLeft, Plus, Zap } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'
import type { ColumnDef } from '@tanstack/react-table'

type PageState = 'loading' | 'notFound' | 'ready'
type OpRow = {
  id: string; operation_number: number; operation_name: string
  work_center_name: string | null; planned_duration_hrs: string
  actual_duration_hrs: string | null; status: string
}
type DowntimeRow = {
  id: string; cause_category: string; cause_description: string
  started_at: string; ended_at: string | null; duration_hrs: string | null; is_force_majeure: boolean
}

const OP_STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success'> = {
  pending: 'neutral', in_progress: 'warning', completed: 'success', skipped: 'neutral',
}
const OP_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En proceso', completed: 'Completada', skipped: 'Omitida',
}
const DOWNTIME_LABEL: Record<string, string> = {
  electrical_cut:    '⚡ Corte eléctrico (CORPOELEC)',
  mechanical_failure: 'Falla mecánica',
  material_shortage: 'Falta de material',
  quality_hold:      'Retención QC',
  format_change:     'Cambio de formato',
  maintenance:       'Mantenimiento',
  operator_absence:  'Ausencia operador',
  other:             'Otro',
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { runMutation } = useGuardedMutation()

  const [state, setState]       = React.useState<PageState>('loading')
  const [order, setOrder]       = React.useState<any>(null)
  const [operations, setOps]    = React.useState<OpRow[]>([])
  const [downtimes, setDowntimes] = React.useState<DowntimeRow[]>([])
  const [showOpForm, setOpForm]  = React.useState(false)
  const [showDtForm, setDtForm]  = React.useState(false)
  const [wcOptions, setWcOptions] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setState('loading')
    const [ordRes, opsRes, dtsRes, wcRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/mfg-orders/production-orders?id=${params.id}`),
      apiCall<{ items: OpRow[] }>(`/api/mfg-orders/order-operations?order_id=${params.id}&pageSize=200`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: DowntimeRow[] }>(`/api/mfg-orders/downtimes?order_id=${params.id}&pageSize=100`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-orders/work-centers?pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    const o = (ordRes.result?.items ?? [])[0] ?? null
    if (!o) { setState('notFound'); return }
    setOrder(o)
    setOps(((opsRes.result?.items ?? []) as OpRow[]).sort((a, b) => a.operation_number - b.operation_number))
    setDowntimes((dtsRes.result?.items ?? []) as DowntimeRow[])
    setWcOptions((wcRes.result?.items ?? []).map((w: any) => ({ value: w.id, label: `${w.code} — ${w.name}` })))
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const handleStartOp = (op: OpRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'mfg_orders.operation', recordId: op.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-orders/order-operations', {
          method: 'PUT',
          body: JSON.stringify({ id: op.id, status: 'in_progress', actual_start: new Date().toISOString() }),
        })
        flash(`Operación ${op.operation_name} iniciada`, 'success')
        load()
      },
    })
  }

  const handleCompleteOp = (op: OpRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'mfg_orders.operation', recordId: op.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-orders/order-operations', {
          method: 'PUT',
          body: JSON.stringify({ id: op.id, status: 'completed', actual_end: new Date().toISOString() }),
        })
        flash(`Operación ${op.operation_name} completada`, 'success')
        load()
      },
    })
  }

  const handleEndDowntime = (dt: DowntimeRow) => {
    const durationMs = Date.now() - new Date(dt.started_at).getTime()
    const durationHrs = (durationMs / 3600000).toFixed(4)
    runMutation({
      operation: 'update',
      context: { entityId: 'mfg_orders.downtime', recordId: dt.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-orders/downtimes', {
          method: 'PUT',
          body: JSON.stringify({ id: dt.id, ended_at: new Date().toISOString(), duration_hrs: durationHrs }),
        })
        flash('Paro registrado', 'success')
        load()
      },
    })
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando orden..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-orders')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Órdenes
      </Button>
      <ErrorMessage message="Orden de producción no encontrada." />
    </PageBody></Page>
  )

  const totalPlannedHrs   = operations.reduce((s, op) => s + Number(op.planned_duration_hrs), 0)
  const totalActualHrs    = operations.reduce((s, op) => s + Number(op.actual_duration_hrs ?? 0), 0)
  const electricalPct     = downtimes.length > 0
    ? (downtimes.filter((d) => d.is_force_majeure).reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0) /
       Math.max(0.001, downtimes.reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0))) * 100
    : 0
  const activeDowntime    = downtimes.find((d) => !d.ended_at)

  const opColumns: ColumnDef<OpRow>[] = [
    { accessorKey: 'operation_number', header: '#', cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.operation_number}</span> },
    { accessorKey: 'operation_name',   header: 'Operación' },
    { accessorKey: 'work_center_name', header: 'Centro de Trabajo', cell: ({ row }) => row.original.work_center_name ?? '—' },
    {
      id: 'time',
      header: 'Tiempo (plan vs. real)',
      cell: ({ row }) => {
        const op = row.original
        const eff = op.actual_duration_hrs && Number(op.planned_duration_hrs) > 0
          ? ((Number(op.planned_duration_hrs) / Number(op.actual_duration_hrs)) * 100).toFixed(0)
          : null
        return (
          <div className="text-sm">
            <span>{op.planned_duration_hrs}h plan</span>
            {op.actual_duration_hrs && (
              <span className={`ml-2 font-semibold ${Number(eff) >= 100 ? 'text-status-success-text' : 'text-status-warning-text'}`}>
                → {op.actual_duration_hrs}h real {eff && `(${eff}%)`}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={OP_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {OP_STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          ...(row.original.status === 'pending' ? [{ id: 'start', label: 'Iniciar operación', onSelect: () => handleStartOp(row.original) }] : []),
          ...(row.original.status === 'in_progress' ? [{ id: 'done', label: 'Marcar completada', onSelect: () => handleCompleteOp(row.original) }] : []),
        ]} />
      ),
    },
  ]

  const dtColumns: ColumnDef<DowntimeRow>[] = [
    {
      id: 'cause',
      header: 'Causa',
      cell: ({ row }) => (
        <div>
          <span className={`text-sm font-medium ${row.original.is_force_majeure ? 'text-status-error-text' : ''}`}>
            {DOWNTIME_LABEL[row.original.cause_category] ?? row.original.cause_category}
          </span>
          <div className="text-xs text-muted-foreground">{row.original.cause_description}</div>
        </div>
      ),
    },
    {
      id: 'time_range',
      header: 'Inicio / Fin',
      cell: ({ row }) => {
        const dt = row.original
        const start = new Date(dt.started_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        const end   = dt.ended_at ? new Date(dt.ended_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '—'
        return <span className="text-sm">{start} → {end}</span>
      },
    },
    {
      accessorKey: 'duration_hrs',
      header: 'Duración',
      cell: ({ row }) => row.original.duration_hrs ? `${row.original.duration_hrs}h` : <StatusBadge variant="error" dot>Activo</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => !row.original.ended_at ? (
        <RowActions items={[{ id: 'end', label: 'Registrar fin del paro', onSelect: () => handleEndDowntime(row.original) }]} />
      ) : null,
    },
  ]

  return (
    <Page>
      <PageHeader
        title={`Orden ${order.order_number}`}
        description={`${order.product_code} — ${order.product_name} · ${order.planned_quantity} ${order.uom}`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-orders')}>
              <ArrowLeft className="mr-2 size-4" /> Órdenes
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* Active downtime alert */}
        {activeDowntime && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
            <Zap className="size-4 text-status-error-icon shrink-0" />
            <span className="text-sm text-status-error-text font-semibold">
              Paro activo en curso: {DOWNTIME_LABEL[activeDowntime.cause_category] ?? activeDowntime.cause_category}
            </span>
          </div>
        )}

        {/* KPI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Cantidad planificada</div>
            <div className="text-2xl font-bold">{Number(order.planned_quantity).toLocaleString('es-VE')} <span className="text-sm font-normal">{order.uom}</span></div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Horas plan vs. real</div>
            <div className="text-2xl font-bold">{totalPlannedHrs.toFixed(1)}h <span className="text-sm font-normal text-muted-foreground">→ {totalActualHrs.toFixed(1)}h</span></div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Paros registrados</div>
            <div className={`text-2xl font-bold ${downtimes.length > 0 ? 'text-status-warning-text' : ''}`}>{downtimes.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Paros CORPOELEC</div>
            <div className={`text-2xl font-bold ${electricalPct > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>{electricalPct.toFixed(0)}%</div>
          </div>
        </div>

        {/* Operations / Routing */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Routing — Operaciones ({operations.length})</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpForm(!showOpForm)}>
              <Plus className="size-4 mr-1" /> Agregar operación
            </Button>
          </div>
          {showOpForm && (
            <div className="mb-4 border border-border rounded-lg p-4 bg-background">
              <CrudForm
                entityId="mfg_orders.operation"
                apiPath="/api/mfg-orders/order-operations"
                mode="create"
                initial={{ order_id: params.id, operation_number: operations.length + 1 }}
                fields={[
                  { type: 'number' as const, id: 'operation_number',     label: 'N° de secuencia', required: true },
                  { type: 'text' as const,   id: 'operation_name',       label: 'Nombre de la operación', required: true },
                  { type: 'select' as const, id: 'work_center_id',       label: 'Centro de trabajo / línea', options: wcOptions },
                  { type: 'text' as const,   id: 'planned_duration_hrs', label: 'Tiempo estándar (horas)', required: true },
                ]}
                onSubmit={async (values) => {
                  await apiCallOrThrow('/api/mfg-orders/order-operations', {
                    method: 'POST',
                    body: JSON.stringify({ ...values, order_id: params.id }),
                  })
                  flash('Operación agregada', 'success')
                  setOpForm(false)
                  load()
                }}
              />
            </div>
          )}
          <DataTable
            entityId="mfg_orders.operation"
            extensionTableId="mfg-order-operations"
            data={operations}
            columns={opColumns}
            isLoading={false}
            emptyState={{ label: 'Sin operaciones', description: 'Agrega las operaciones del routing para ejecutar esta orden.' }}
            stickyActionsColumn
          />
        </div>

        {/* Downtimes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Registro de Paros ({downtimes.length})</h3>
            <Button type="button" size="sm" variant="outline" onClick={() => setDtForm(!showDtForm)}>
              <Zap className="size-4 mr-1" /> Registrar paro
            </Button>
          </div>
          {showDtForm && (
            <div className="mb-4 border border-border rounded-lg p-4 bg-background">
              <CrudForm
                entityId="mfg_orders.downtime"
                apiPath="/api/mfg-orders/downtimes"
                mode="create"
                initial={{ order_id: params.id, started_at: new Date().toISOString().slice(0, 16) }}
                fields={[
                  { type: 'select' as const, id: 'cause_category', label: 'Categoría del paro', required: true,
                    options: [
                      { value: 'electrical_cut',    label: '⚡ Corte eléctrico externo (CORPOELEC)' },
                      { value: 'mechanical_failure', label: 'Falla mecánica' },
                      { value: 'material_shortage', label: 'Falta de material' },
                      { value: 'quality_hold',      label: 'Retención por calidad' },
                      { value: 'format_change',     label: 'Cambio de formato' },
                      { value: 'maintenance',       label: 'Mantenimiento programado' },
                      { value: 'operator_absence',  label: 'Ausencia de operador' },
                      { value: 'other',             label: 'Otro motivo' },
                    ]},
                  { type: 'textarea' as const, id: 'cause_description', label: 'Descripción de la causa', required: true },
                  { type: 'datetime-local' as const, id: 'started_at', label: 'Hora de inicio', required: true },
                ]}
                onSubmit={async (values) => {
                  const isForceMajeure = values.cause_category === 'electrical_cut'
                  await apiCallOrThrow('/api/mfg-orders/downtimes', {
                    method: 'POST',
                    body: JSON.stringify({ ...values, order_id: params.id, is_force_majeure: isForceMajeure }),
                  })
                  flash('Paro registrado', isForceMajeure ? 'info' : 'success')
                  setDtForm(false)
                  load()
                }}
              />
            </div>
          )}
          {downtimes.length > 0 ? (
            <DataTable
              entityId="mfg_orders.downtime"
              extensionTableId="mfg-order-downtimes"
              data={downtimes}
              columns={dtColumns}
              isLoading={false}
              emptyState={{ label: 'Sin paros registrados' }}
              stickyActionsColumn
            />
          ) : (
            <p className="text-sm text-muted-foreground p-4 bg-muted/10 rounded-lg">Sin paros registrados para esta orden.</p>
          )}
        </div>

        {/* Workflow escalación de paro — aparece si hay un paro activo (sin ended_at) */}
        {activeDowntime && (
          <WorkflowApprovalWidget
            workflowId="downtime_escalation_v1"
            entityId={activeDowntime.id}
            entityType="MfgProductionDowntime"
            title="Escalación de Paro Prolongado"
            startLabel="Escalar a gerencia — paro activo sin resolución"
            startContext={{
              downtime_id:       activeDowntime.id,
              order_number:      order.order_number,
              product_code:      order.product_code,
              cause_category:    activeDowntime.cause_category,
              cause_description: activeDowntime.cause_description,
              started_at:        activeDowntime.started_at,
              is_force_majeure:  activeDowntime.is_force_majeure,
            }}
            decisions={[
              { value: 'resolved_fully',    label: 'Resuelto — producción reiniciada',        variant: 'default' },
              { value: 'resolved_partial',  label: 'Resuelto parcialmente — capacidad reducida', variant: 'outline' },
              { value: 'escalated_external', label: 'Escalado a servicio técnico externo',    variant: 'destructive' },
            ]}
            onCompleted={() => load()}
          />
        )}
      </PageBody>
    </Page>
  )
}
