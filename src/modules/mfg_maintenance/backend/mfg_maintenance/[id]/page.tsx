'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { ArrowLeft, Plus, Wrench } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type PageState = 'loading' | 'notFound' | 'ready'
type WoRow = { id: string; wo_number: string; work_type: string; priority: string; status: string; description: string; scheduled_date: string | null; actual_duration_hrs: string | null; total_parts_cost_usd: string }
type PlanRow = { id: string; plan_name: string; trigger_type: string; trigger_interval: string; next_due_date: string | null; requires_shutdown: boolean; status: string }

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { operational: 'success', under_maintenance: 'warning', breakdown: 'error', retired: 'neutral' }
const STATUS_LABEL: Record<string, string> = { operational: 'Operativo', under_maintenance: 'En mantenimiento', breakdown: 'Avería', retired: 'Retirado' }
const CRIT_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = { critical: 'error', high: 'warning', medium: 'info', low: 'neutral' }
const WO_STATUS_VARIANT: Record<string, 'warning' | 'error' | 'success' | 'neutral'> = { open: 'warning', in_progress: 'error', completed: 'success', cancelled: 'neutral' }
const WO_STATUS_LABEL: Record<string, string> = { open: 'Abierta', in_progress: 'En progreso', completed: 'Completada', cancelled: 'Cancelada' }
const TRIGGER_LABEL: Record<string, string> = { hours: 'horas', days: 'días', cycles: 'ciclos', calendar: 'calendario' }

export default function EquipmentDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_maintenance.page' })

  const [state, setState]   = React.useState<PageState>('loading')
  const [eq, setEq]         = React.useState<any>(null)
  const [plans, setPlans]   = React.useState<PlanRow[]>([])
  const [wos, setWos]       = React.useState<WoRow[]>([])
  const [showPlanForm, setPF] = React.useState(false)
  const [showWoForm, setWF]  = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [eqRes, planRes, woRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/mfg-maintenance/equipment?id=${params.id}`),
      apiCall<{ items: PlanRow[] }>(`/api/mfg-maintenance/maintenance-plans?equipment_id=${params.id}&pageSize=50`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: WoRow[] }>(`/api/mfg-maintenance/work-orders-maint?equipment_id=${params.id}&pageSize=50`, undefined, { fallback: { items: [] } }),
    ])
    const e = (eqRes.result?.items ?? [])[0] ?? null
    if (!e) { setState('notFound'); return }
    setEq(e)
    setPlans(planRes.result?.items ?? [])
    setWos(woRes.result?.items ?? [])
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const handleComplete = (wo: WoRow) => {
    runMutation({
      context: { entityId: 'mfg_maintenance.wo', recordId: wo.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-maintenance/work-orders-maint', {
          method: 'PUT',
          body: JSON.stringify({ id: wo.id, status: 'completed', completed_at: new Date().toISOString() }),
        })
        flash(`WO ${wo.wo_number} completada`, 'success')
        load()
      },
    })
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando equipo..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-maintenance')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Mantenimiento
      </Button>
      <ErrorMessage label="Equipo no encontrado." />
    </PageBody></Page>
  )

  const openWos  = wos.filter((w) => w.status !== 'completed' && w.status !== 'cancelled')
  const totalWos = wos.length
  const totalPartsCost = wos.filter((w) => w.status === 'completed').reduce((s, w) => s + Number(w.total_parts_cost_usd), 0)

  const planCols: ColumnDef<PlanRow>[] = [
    { accessorKey: 'plan_name', header: 'Plan' },
    { id: 'trigger', header: 'Frecuencia', cell: ({ row }) => <span className="text-sm">Cada {row.original.trigger_interval} {TRIGGER_LABEL[row.original.trigger_type] ?? row.original.trigger_type}</span> },
    { id: 'next_due', header: 'Próxima vez', cell: ({ row }) => {
      const d = row.original.next_due_date
      const today = new Date().toISOString().split('T')[0]
      if (!d) return '—'
      return <span className={d < today ? 'text-status-error-text font-semibold' : ''}>{new Date(d).toLocaleDateString('es-VE')}{d < today ? ' ⚠' : ''}</span>
    }},
    { id: 'flags', header: 'Flags', cell: ({ row }) => (
      <div className="flex gap-1">
        {row.original.requires_shutdown && <StatusBadge variant="warning">Para equipo</StatusBadge>}
        {row.original.status === 'overdue' && <StatusBadge variant="error">Vencido</StatusBadge>}
      </div>
    )},
  ]

  const woCols: ColumnDef<WoRow>[] = [
    { accessorKey: 'wo_number', header: 'WO', cell: ({ row }) => <span className="font-mono text-sm">{row.original.wo_number}</span> },
    { accessorKey: 'work_type', header: 'Tipo', cell: ({ row }) => row.original.work_type === 'corrective' ? <StatusBadge variant="error">Correctivo</StatusBadge> : <StatusBadge variant="info">Preventivo</StatusBadge> },
    { accessorKey: 'description', header: 'Tarea', meta: { truncate: true, maxWidth: 200 } },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <StatusBadge variant={WO_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{WO_STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge> },
    { id: 'cost', header: 'Costo piezas', cell: ({ row }) => Number(row.original.total_parts_cost_usd) > 0 ? `USD ${Number(row.original.total_parts_cost_usd).toFixed(2)}` : '—' },
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        ...(row.original.status === 'open' || row.original.status === 'in_progress' ? [{ id: 'complete', label: 'Marcar completada', onSelect: () => handleComplete(row.original) }] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-maintenance')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> Mantenimiento
        </Button>

        <div className="max-w-4xl space-y-6">
          {/* Equipment header */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="size-5" />
                  <span className="font-mono">{eq.equipment_code}</span> — {eq.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {[eq.brand, eq.model].filter(Boolean).join(' ')}
                  {eq.serial_number && ` · S/N: ${eq.serial_number}`}
                  {eq.work_center_name && ` · ${eq.work_center_name}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge variant={CRIT_VARIANT[eq.criticality] ?? 'neutral'}>
                  {eq.criticality}
                </StatusBadge>
                <StatusBadge variant={STATUS_VARIANT[eq.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[eq.status] ?? eq.status}
                </StatusBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Horas acumuladas</p>
                <p className="text-xl font-bold">{Number(eq.accumulated_hours).toLocaleString('es-VE')}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WOs abiertas</p>
                <p className={`text-xl font-bold ${openWos.length > 0 ? 'text-status-warning-text' : ''}`}>{openWos.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total WOs</p>
                <p className="text-xl font-bold">{totalWos}</p>
              </div>
              {eq.replacement_cost_usd && (
                <div>
                  <p className="text-xs text-muted-foreground">Costo reposición</p>
                  <p className="text-xl font-bold">USD {Number(eq.replacement_cost_usd).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                </div>
              )}
            </div>

            {totalPartsCost > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Costo total de repuestos en WOs completadas: USD {totalPartsCost.toFixed(2)}
              </p>
            )}
          </div>

          {/* Maintenance plans */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Planes de Mantenimiento ({plans.length})</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setPF(!showPlanForm)}>
                <Plus className="size-4 mr-1" /> Agregar plan
              </Button>
            </div>
            {showPlanForm && (
              <div className="mb-4 border border-border rounded-lg p-4 bg-background">
                <CrudForm
                  initialValues={{ equipment_id: params.id, equipment_code: eq.equipment_code }}
                  fields={[
                    { type: 'text' as const,   id: 'plan_name',           label: 'Nombre del plan (ej: Cambio de aceite cada 500h)', required: true },
                    { type: 'select' as const, id: 'trigger_type',        label: 'Tipo de trigger', required: true, options: [{ value: 'days', label: 'Días calendario' }, { value: 'hours', label: 'Horas de operación' }, { value: 'cycles', label: 'Ciclos de producción' }] },
                    { type: 'text' as const,   id: 'trigger_interval',    label: 'Intervalo (ej: 30, 500, 2000)', required: true },
                    { type: 'text' as const,   id: 'estimated_duration_hrs', label: 'Duración estimada (horas)' },
                    { type: 'text' as const,   id: 'required_technician_skill', label: 'Perfil técnico requerido (ej: Electricista)' },
                  ]}
                  cancelHref={`/backend/mfg_maintenance/${params.id}`}
                  onSubmit={async (values) => {
                    await createCrud('mfg-maintenance/maintenance-plans', { ...values, equipment_id: params.id })
                    flash('Plan de mantenimiento agregado', 'success')
                    setPF(false)
                    load()
                  }}
                />
              </div>
            )}
            <DataTable entityId="mfg_maintenance.plan" data={plans} columns={planCols} isLoading={false}
              emptyState="Sin planes de mantenimiento" />
          </div>

          {/* Work orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Historial de Órdenes de Trabajo ({totalWos})</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setWF(!showWoForm)}>
                <Plus className="size-4 mr-1" /> Nueva WO correctiva
              </Button>
            </div>
            {showWoForm && (
              <div className="mb-4 border border-border rounded-lg p-4 bg-background">
                <CrudForm
                  initialValues={{ equipment_id: params.id, equipment_code: eq.equipment_code, equipment_name: eq.name, work_type: 'corrective', priority: 'high' }}
                  fields={[
                    { type: 'text' as const,     id: 'wo_number',        label: 'N° WO (WO-MAINT-2026-XXX)', required: true },
                    { type: 'textarea' as const, id: 'description',      label: 'Descripción de la tarea', required: true },
                    { type: 'textarea' as const, id: 'fault_description', label: 'Descripción de la falla reportada', required: true },
                    { type: 'select' as const,   id: 'priority',         label: 'Prioridad', options: [{ value: 'critical', label: 'Crítico' }, { value: 'high', label: 'Alta' }, { value: 'medium', label: 'Media' }] },
                  ]}
                  cancelHref={`/backend/mfg_maintenance/${params.id}`}
                  onSubmit={async (values) => {
                    await createCrud('mfg-maintenance/work-orders-maint', { ...values, equipment_id: params.id })
                    flash('WO correctiva creada', 'success')
                    setWF(false)
                    load()
                  }}
                />
              </div>
            )}
            <DataTable entityId="mfg_maintenance.wo" data={wos} columns={woCols} isLoading={false}
              emptyState="Sin órdenes de trabajo" stickyActionsColumn />
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
