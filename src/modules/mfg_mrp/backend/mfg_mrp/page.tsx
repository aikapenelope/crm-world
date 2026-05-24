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
import { Play, AlertTriangle, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type PlanRow  = { id: string; plan_number: string; period_start: string; period_end: string; status: string; last_run_summary: any }
type ReqRow   = { id: string; requisition_number: string; material_code: string; material_name: string; quantity: string; uom: string; required_by_date: string; suggested_po_date: string; is_imported: boolean; status: string }
type ReqmtRow = { id: string; material_code: string; material_name: string; gross_requirement: string; stock_on_hand: string; net_requirement: string; uom: string; required_by_date: string; suggested_po_date: string; lead_time_days: number; is_imported: boolean; status: string }

const PLAN_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = { draft: 'neutral', running: 'warning', completed: 'success', active: 'info' }
const PLAN_STATUS_LABEL:   Record<string, string> = { draft: 'Borrador', running: 'Ejecutando…', completed: 'Completado', active: 'Activo' }
const REQ_STATUS_VARIANT:  Record<string, 'warning' | 'success' | 'info' | 'neutral'> = { pending: 'warning', approved: 'info', po_created: 'success', cancelled: 'neutral' }
const REQ_STATUS_LABEL:    Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', po_created: 'OC creada', cancelled: 'Cancelada' }

export default function MfgMrpPage() {
  const { runMutation } = useGuardedMutation()
  const [plans, setPlans]            = React.useState<PlanRow[]>([])
  const [activePlan, setActivePlan]  = React.useState<PlanRow | null>(null)
  const [requirements, setReqs]      = React.useState<ReqmtRow[]>([])
  const [requisitions, setReqns]     = React.useState<ReqRow[]>([])
  const [isLoading, setLoading]      = React.useState(true)
  const [isRunning, setIsRunning]    = React.useState(false)
  const [reqFilter, setReqFilter]    = React.useState<'all' | 'imported' | 'risk'>('risk')
  const [showPlanForm, setPlanForm]  = React.useState(false)

  const load = React.useCallback(async (planId?: string) => {
    setLoading(true)
    const planRes = await apiCall<{ items: PlanRow[] }>('/api/mfg-mrp/production-plans?pageSize=20', undefined, { fallback: { items: [] } })
    const allPlans = planRes.result?.items ?? []
    setPlans(allPlans)

    const active = planId ? allPlans.find((p) => p.id === planId) : allPlans.find((p) => p.status === 'completed') ?? allPlans[0]
    if (active) {
      setActivePlan(active)
      const [reqmtRes, reqnRes] = await Promise.all([
        apiCall<{ items: ReqmtRow[] }>(`/api/mfg-mrp/mrp-requirements?plan_id=${active.id}&pageSize=500`, undefined, { fallback: { items: [] } }),
        apiCall<{ items: ReqRow[] }>(`/api/mfg-mrp/purchase-requisitions?pageSize=200`, undefined, { fallback: { items: [] } }),
      ])
      setReqs(reqmtRes.result?.items ?? [])
      setReqns(reqnRes.result?.items ?? [])
    }
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleRunMrp = async (plan: PlanRow) => {
    setIsRunning(true)
    try {
      const res = await apiCallOrThrow<any>(`/api/mfg-mrp/run-mrp?plan_id=${plan.id}`, { method: 'POST', body: '{}' })
      const s = res.result?.data
      flash(`MRP completado: ${s?.materials_analyzed ?? 0} materiales · ${s?.requisitions_created ?? 0} requisiciones · ${s?.at_risk_materials?.length ?? 0} en riesgo`, s?.at_risk_materials?.length > 0 ? 'warning' : 'success')
      load(plan.id)
    } catch {
      flash('Error ejecutando MRP', 'error')
    }
    setIsRunning(false)
  }

  const handleApproveReq = (req: ReqRow) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_mrp.requisition', recordId: req.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-mrp/purchase-requisitions', { method: 'PUT', body: JSON.stringify({ id: req.id, status: 'approved' }) })
        flash(`Requisición ${req.requisition_number} aprobada`, 'success')
        load(activePlan?.id)
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const filteredReqs = requirements.filter((r) => {
    if (reqFilter === 'imported') return r.is_imported
    if (reqFilter === 'risk') return r.suggested_po_date <= in7 && Number(r.net_requirement) > 0
    return true
  })

  const overdueCount = requirements.filter((r) => r.suggested_po_date < today && Number(r.net_requirement) > 0).length
  const urgentCount  = requirements.filter((r) => r.suggested_po_date >= today && r.suggested_po_date <= in7 && Number(r.net_requirement) > 0).length

  const reqmtColumns: ColumnDef<ReqmtRow>[] = [
    { accessorKey: 'material_code', header: 'Material', cell: ({ row }) => (
      <div>
        <span className="font-mono font-semibold text-sm">{row.original.material_code}</span>
        {row.original.is_imported && <StatusBadge variant="warning" className="ml-1 text-xs">Importado</StatusBadge>}
        <div className="text-xs text-muted-foreground">{row.original.material_name}</div>
      </div>
    )},
    { id: 'reqs', header: 'Bruto / Stock / Neto', cell: ({ row }) => {
      const r = row.original
      const net = Number(r.net_requirement)
      return (
        <div className="text-sm">
          <span className="text-muted-foreground">{Number(r.gross_requirement).toFixed(2)} {r.uom}</span>
          <span className="text-muted-foreground mx-1">-</span>
          <span>{Number(r.stock_on_hand).toFixed(2)}</span>
          <span className="mx-1">=</span>
          <span className={`font-bold ${net > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>{net.toFixed(2)} {r.uom}</span>
        </div>
      )
    }},
    { id: 'dates', header: 'Fechas (lead time)', cell: ({ row }) => {
      const r = row.original
      const isOverdue = r.suggested_po_date < today
      const isUrgent  = r.suggested_po_date >= today && r.suggested_po_date <= in7
      return (
        <div className="text-xs">
          <div>Necesario: {new Date(r.required_by_date).toLocaleDateString('es-VE')}</div>
          <div className={isOverdue ? 'text-status-error-text font-semibold' : isUrgent ? 'text-status-warning-text font-semibold' : ''}>
            OC sugerida: {new Date(r.suggested_po_date).toLocaleDateString('es-VE')}
            {isOverdue ? ' ⚠ VENCIDA' : isUrgent ? ' ⚡ Esta semana' : ''}
          </div>
          <div className="text-muted-foreground">Lead time: {r.lead_time_days}d</div>
        </div>
      )
    }},
  ]

  const reqnColumns: ColumnDef<ReqRow>[] = [
    { accessorKey: 'requisition_number', header: 'Requisición', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.requisition_number}</span> },
    { accessorKey: 'material_code', header: 'Material', cell: ({ row }) => (
      <div><span className="font-semibold text-sm">{row.original.material_code}</span>
      <div className="text-xs text-muted-foreground">{row.original.material_name}</div></div>
    )},
    { id: 'qty', header: 'Cantidad / Fecha', cell: ({ row }) => (
      <div><span className="font-semibold">{Number(row.original.quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })} {row.original.uom}</span>
      <div className="text-xs text-muted-foreground">Necesario: {new Date(row.original.required_by_date).toLocaleDateString('es-VE')}</div></div>
    )},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        <StatusBadge variant={REQ_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{REQ_STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge>
        {row.original.is_imported && <StatusBadge variant="warning">Importado</StatusBadge>}
      </div>
    )},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        ...(row.original.status === 'pending' ? [{ id: 'approve', label: 'Aprobar requisición', onSelect: () => handleApproveReq(row.original) }] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageHeader
        title="Motor MRP — Planificación de Materiales"
        description={activePlan ? `Plan ${activePlan.plan_number} · ${overdueCount > 0 ? `${overdueCount} OCs vencidas` : urgentCount > 0 ? `${urgentCount} urgentes esta semana` : 'Sin alertas'}` : 'Sin plan activo'}
        actions={
          <div className="flex items-center gap-2">
            <Select value={activePlan?.id ?? ''} onValueChange={(id) => load(id)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
              <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.plan_number}</SelectItem>)}</SelectContent>
            </Select>
            {activePlan && (
              <Button type="button" disabled={isRunning} onClick={() => handleRunMrp(activePlan)}>
                <Play className="size-4 mr-2" /> {isRunning ? 'Ejecutando…' : 'Correr MRP'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setPlanForm(!showPlanForm)}>
              <Plus className="size-4 mr-2" /> Nuevo Plan
            </Button>
          </div>
        }
      />
      <PageBody>
        {(overdueCount > 0 || urgentCount > 0) && (
          <div className="mb-4 space-y-2">
            {overdueCount > 0 && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
                <span className="text-sm text-status-error-text font-semibold">
                  {overdueCount} OC(s) de importación VENCIDAS — emitir urgentemente para no detener producción.
                </span>
              </div>
            )}
            {urgentCount > 0 && (
              <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-warning-icon shrink-0" />
                <span className="text-sm text-status-warning-text">
                  {urgentCount} OC(s) a emitir esta semana según el lead time de importación.
                </span>
              </div>
            )}
          </div>
        )}

        {showPlanForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Crear Plan de Producción</h3>
            <CrudForm entityId="mfg_mrp.plan" apiPath="/api/mfg-mrp/production-plans" mode="create"
              fields={[
                { type: 'text' as const,  id: 'plan_number',  label: 'Número de Plan (PLAN-2026-XX)', required: true },
                { type: 'date' as const,  id: 'period_start', label: 'Inicio del período', required: true },
                { type: 'date' as const,  id: 'period_end',   label: 'Fin del período', required: true },
                { type: 'textarea' as const, id: 'notes',     label: 'Notas' },
              ]}
              onSuccess={() => { flash('Plan creado — ejecuta el MRP para calcular necesidades', 'success'); setPlanForm(false); load() }}
            />
          </div>
        )}

        {activePlan?.last_run_summary && (
          <div className="mb-4 p-3 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground">
              Última corrida: {new Date((activePlan.last_run_summary as any).run_at).toLocaleString('es-VE')}
              {' · '}{(activePlan.last_run_summary as any).orders_exploded} órdenes
              {' · '}{(activePlan.last_run_summary as any).materials_analyzed} materiales
              {' · '}{(activePlan.last_run_summary as any).requisitions_created} requisiciones generadas
            </div>
          </div>
        )}

        {/* Requirements section */}
        {activePlan && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Necesidades de Materiales ({filteredReqs.length})</h3>
              <div className="flex gap-1">
                {([['risk', '⚠ En riesgo'], ['imported', 'Importados'], ['all', 'Todos']] as const).map(([v, l]) => (
                  <Button key={v} type="button" size="sm" variant={reqFilter === v ? 'default' : 'outline'} onClick={() => setReqFilter(v)}>{l}</Button>
                ))}
              </div>
            </div>
            <DataTable entityId="mfg_mrp.requirement" extensionTableId="mfg-mrp-requirements" data={filteredReqs} columns={reqmtColumns} isLoading={isLoading}
              emptyState={{ title: reqFilter === 'risk' ? 'Sin materiales en riesgo' : 'Sin necesidades', description: 'Ejecuta el MRP para calcular las necesidades.' }} />
          </div>
        )}

        {/* Requisitions section */}
        {requisitions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Requisiciones de Compra ({requisitions.length})</h3>
            <DataTable entityId="mfg_mrp.requisition" extensionTableId="mfg-mrp-requisitions" data={requisitions} columns={reqnColumns} isLoading={isLoading}
              emptyState='Sin requisiciones' stickyActionsColumn />
          </div>
        )}
      </PageBody>
    </Page>
  )
}
