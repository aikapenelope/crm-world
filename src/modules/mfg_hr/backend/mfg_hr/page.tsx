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
import { Plus, Award } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type WorkerRow = { id: string; employee_code: string; full_name: string; cedula: string | null; shift_type: string; work_center_name: string | null; is_active: boolean; hourly_rate_bs: string | null }
type BonusRow  = { id: string; bonus_number: string; work_center_name: string | null; shift_type: string | null; period_start: string; period_end: string; planned_quantity: string; actual_quantity: string; achievement_pct: string; bonus_amount_bs: string; workers_count: number; bonus_per_worker_bs: string; status: string; uom: string | null }

const SHIFT_LABEL: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche', rotating: 'Rotativo' }
const BONUS_STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success'> = { calculated: 'neutral', approved: 'warning', paid: 'success' }
const BONUS_STATUS_LABEL: Record<string, string> = { calculated: 'Calculado', approved: 'Aprobado', paid: 'Pagado' }

export default function MfgHrPage() {
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_hr.page' })
  const [workers, setWorkers]  = React.useState<WorkerRow[]>([])
  const [bonuses, setBonuses]  = React.useState<BonusRow[]>([])
  const [isLoading, setLoad]   = React.useState(true)
  const [showWorkerForm, setWF] = React.useState(false)
  const [showBonusForm, setBF]  = React.useState(false)
  const [activeTab, setTab]    = React.useState<'workers' | 'bonuses'>('workers')
  const [wcOptions, setWcOptions] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoad(true)
    const [wRes, bRes, wcRes] = await Promise.all([
      apiCall<{ items: WorkerRow[] }>('/api/mfg-hr/workers?pageSize=200', undefined, { fallback: { items: [] } }),
      apiCall<{ items: BonusRow[] }>('/api/mfg-hr/production-bonuses?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-orders/work-centers?pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    if (wRes.ok) setWorkers(wRes.result?.items ?? [])
    if (bRes.ok) setBonuses(bRes.result?.items ?? [])
    if (wcRes.ok) setWcOptions((wcRes.result?.items ?? []).map((w: any) => ({ value: w.id, label: `${w.code} — ${w.name}` })))
    setLoad(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleApproveBonus = (bonus: BonusRow) => {
    runMutation({
      context: { entityId: 'mfg_hr.bonus', recordId: bonus.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-hr/production-bonuses', { method: 'PUT', body: JSON.stringify({ id: bonus.id, status: 'approved' }) })
        flash(`Bono ${bonus.bonus_number} aprobado — Bs ${Number(bonus.bonus_per_worker_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} por operario`, 'success')
        load()
      },
    })
  }

  const pendingBonuses = bonuses.filter((b) => b.status === 'calculated').length
  const activeWorkers  = workers.filter((w) => w.is_active).length

  const workerCols: ColumnDef<WorkerRow>[] = [
    { id: 'worker', header: 'Operario', cell: ({ row }) => (
      <div>
        <span className="font-mono font-semibold text-sm">{row.original.employee_code}</span>
        <div className="text-xs text-muted-foreground">{row.original.full_name}{row.original.cedula && ` · CI: ${row.original.cedula}`}</div>
      </div>
    )},
    { id: 'assignment', header: 'Turno / Línea', cell: ({ row }) => (
      <div className="text-sm">
        <StatusBadge variant="neutral">{SHIFT_LABEL[row.original.shift_type] ?? row.original.shift_type}</StatusBadge>
        {row.original.work_center_name && <div className="text-xs text-muted-foreground mt-0.5">{row.original.work_center_name}</div>}
      </div>
    )},
    { id: 'rate', header: 'Tarifa Bs/h', cell: ({ row }) => row.original.hourly_rate_bs ? `Bs ${Number(row.original.hourly_rate_bs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—' },
    { id: 'status', header: 'Estado', cell: ({ row }) => (
      <StatusBadge variant={row.original.is_active ? 'success' : 'neutral'} dot>
        {row.original.is_active ? 'Activo' : 'Inactivo'}
      </StatusBadge>
    )},
  ]

  const bonusCols: ColumnDef<BonusRow>[] = [
    { accessorKey: 'bonus_number', header: 'Bono', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.bonus_number}</span> },
    { id: 'period', header: 'Período / Línea', cell: ({ row }) => (
      <div className="text-sm">
        <div>{new Date(row.original.period_start).toLocaleDateString('es-VE')} → {new Date(row.original.period_end).toLocaleDateString('es-VE')}</div>
        {row.original.work_center_name && <div className="text-xs text-muted-foreground">{row.original.work_center_name}{row.original.shift_type && ` · ${SHIFT_LABEL[row.original.shift_type] ?? row.original.shift_type}`}</div>}
      </div>
    )},
    { id: 'production', header: 'Logro', cell: ({ row }) => {
      const pct = Number(row.original.achievement_pct)
      return (
        <div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-bold ${pct >= 90 ? 'text-status-success-text' : 'text-status-warning-text'}`}>{pct.toFixed(1)}%</span>
            <span className="text-muted-foreground">{row.original.actual_quantity}/{row.original.planned_quantity} {row.original.uom}</span>
          </div>
          <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
            <div className={`h-full rounded-full ${pct >= 90 ? 'bg-status-success-bg' : 'bg-status-warning-bg'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )
    }},
    { id: 'bonus_amounts', header: 'Bono total / por operario', cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-semibold">Bs {Number(row.original.bonus_amount_bs).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</div>
        <div className="text-xs text-muted-foreground">÷ {row.original.workers_count} ops = Bs {Number(row.original.bonus_per_worker_bs).toLocaleString('es-VE', { minimumFractionDigits: 0 })}/c/u</div>
      </div>
    )},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      <StatusBadge variant={BONUS_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
        {BONUS_STATUS_LABEL[row.original.status] ?? row.original.status}
      </StatusBadge>
    )},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        ...(row.original.status === 'calculated' ? [{ id: 'approve', label: 'Aprobar bono', onSelect: () => handleApproveBonus(row.original) }] : []),
        ...(row.original.status === 'approved' ? [{ id: 'pay', label: 'Marcar pagado', onSelect: () =>
          runMutation({ context: { entityId: 'mfg_hr.bonus', recordId: row.original.id }, operation: async () => {
            await apiCallOrThrow('/api/mfg-hr/production-bonuses', { method: 'PUT', body: JSON.stringify({ id: row.original.id, status: 'paid' }) })
            flash(`Bono ${row.original.bonus_number} marcado como pagado`, 'success'); load()
          }}) }] : []),
      ]} />
    )},
  ]

  const TABS = [
    { id: 'workers' as const, label: `Operarios (${activeWorkers} activos)` },
    { id: 'bonuses' as const, label: `Bonos${pendingBonuses > 0 ? ` (${pendingBonuses} pend.)` : ` (${bonuses.length})`}` },
  ]

  return (
    <Page>
      <PageHeader
        title="RRHH Manufactura"
        description={`${activeWorkers} operarios activos${pendingBonuses > 0 ? ` · ${pendingBonuses} bono(s) por aprobar` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'workers' && (
              <Button type="button" onClick={() => setWF(!showWorkerForm)}>
                <Plus className="size-4 mr-2" /> Nuevo operario
              </Button>
            )}
            {activeTab === 'bonuses' && (
              <Button type="button" variant="outline" onClick={() => setBF(!showBonusForm)}>
                <Award className="size-4 mr-2" /> Calcular bono
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Worker form */}
        {showWorkerForm && activeTab === 'workers' && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Registrar Operario</h3>
            <CrudForm entityId="mfg_hr.worker" apiPath="/api/mfg-hr/workers" mode="create"
              fields={[
                { type: 'text' as const,   id: 'employee_code',       label: 'Código de empleado (OP-001)', required: true },
                { type: 'text' as const,   id: 'full_name',           label: 'Nombre completo', required: true },
                { type: 'text' as const,   id: 'cedula',              label: 'Cédula de identidad' },
                { type: 'select' as const, id: 'shift_type',          label: 'Turno asignado', required: true, options: [{ value: 'morning', label: 'Mañana (6-2)' }, { value: 'afternoon', label: 'Tarde (2-10)' }, { value: 'night', label: 'Noche (10-6) +30% LOTTT' }, { value: 'rotating', label: 'Rotativo' }] },
                { type: 'select' as const, id: 'work_center_id',      label: 'Línea / Centro principal', options: wcOptions },
                { type: 'text' as const,   id: 'hourly_rate_bs',      label: 'Tarifa por hora (Bs)' },
                { type: 'date' as const,   id: 'hire_date',           label: 'Fecha de ingreso' },
              ]}
              onSuccess={() => { flash('Operario registrado', 'success'); setWF(false); load() }}
            />
          </div>
        )}

        {/* Bonus form */}
        {showBonusForm && activeTab === 'bonuses' && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Award className="size-4" /> Calcular Bono de Producción</h3>
            <CrudForm entityId="mfg_hr.bonus" apiPath="/api/mfg-hr/production-bonuses" mode="create"
              initial={{ status: 'calculated' }}
              fields={[
                { type: 'text' as const,   id: 'bonus_number',       label: 'Número de bono (BONUS-2026-XXX)', required: true },
                { type: 'select' as const, id: 'work_center_id',     label: 'Línea / Centro', options: wcOptions },
                { type: 'select' as const, id: 'shift_type',         label: 'Turno', options: [{ value: 'morning', label: 'Mañana' }, { value: 'afternoon', label: 'Tarde' }, { value: 'night', label: 'Noche' }] },
                { type: 'date' as const,   id: 'period_start',       label: 'Inicio del período', required: true },
                { type: 'date' as const,   id: 'period_end',         label: 'Fin del período', required: true },
                { type: 'text' as const,   id: 'planned_quantity',   label: 'Producción planificada (cuota)', required: true },
                { type: 'text' as const,   id: 'actual_quantity',    label: 'Producción real lograda', required: true },
                { type: 'text' as const,   id: 'uom',                label: 'Unidad (kg, unidades...)' },
                { type: 'text' as const,   id: 'achievement_pct',    label: '% logrado (real/plan × 100)', required: true },
                { type: 'text' as const,   id: 'bonus_amount_bs',    label: 'Monto total del bono (Bs)', required: true },
                { type: 'number' as const, id: 'workers_count',      label: 'Número de operarios a repartir', required: true },
                { type: 'text' as const,   id: 'bonus_per_worker_bs', label: 'Bono por operario (Bs)', required: true },
                { type: 'textarea' as const, id: 'notes',            label: 'Notas / criterio del bono' },
              ]}
              onSuccess={() => { flash('Bono calculado — pendiente de aprobación', 'success'); setBF(false); load() }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {TABS.map((t) => (
            <Button key={t.id} type="button" size="sm" variant={activeTab === t.id ? 'default' : 'outline'} onClick={() => setTab(t.id)}>{t.label}</Button>
          ))}
        </div>

        {activeTab === 'workers' && (
          <DataTable entityId="mfg_hr.worker" extensionTableId="mfg-hr-workers" data={workers} columns={workerCols} isLoading={isLoading}
            emptyState="Sin operarios registrados" />
        )}
        {activeTab === 'bonuses' && (
          <DataTable entityId="mfg_hr.bonus" extensionTableId="mfg-hr-bonuses" data={bonuses} columns={bonusCols} isLoading={isLoading}
            emptyState="Sin bonos registrados"
            stickyActionsColumn />
        )}
      </PageBody>
    </Page>
  )
}
