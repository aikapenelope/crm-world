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
import { Plus, Zap, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type MpsRow = { id: string; schedule_number: string; product_code: string; product_name: string; planned_quantity: string; uom: string; work_center_name: string | null; status: string; planned_start: string | null; planned_end: string | null; priority: number }
type CapRow = { work_center_name: string; available_hrs: string; loaded_hrs: string; utilization_pct: string; overloaded: boolean }
type EnergyRow = { id: string; zone: string; day_of_week: number; hour_start: number; hour_end: number; restriction_type: string; reliability_pct: string }

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = { planned: 'neutral', confirmed: 'info', in_progress: 'warning', completed: 'success' }
const STATUS_LABEL: Record<string, string> = { planned: 'Planificado', confirmed: 'Confirmado', in_progress: 'En ejecución', completed: 'Completado' }
const ETYPE_VARIANT: Record<string, 'error' | 'warning' | 'success'> = { restriction: 'error', unstable: 'warning', reliable: 'success' }
const ETYPE_LABEL: Record<string, string> = { restriction: 'Corte previsto', unstable: 'Inestable', reliable: 'Confiable' }

// Get ISO week number
function getWeekStart(d: Date) {
  const date = new Date(d)
  const day = date.getDay() || 7
  if (day !== 1) date.setHours(-24 * (day - 1))
  return date.toISOString().split('T')[0]
}

export default function MfgPlanningPage() {
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_planning.page' })
  const [items, setItems]        = React.useState<MpsRow[]>([])
  const [capacity, setCapacity]  = React.useState<CapRow[]>([])
  const [energy, setEnergy]      = React.useState<EnergyRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [weekFilter, setWeek]    = React.useState(getWeekStart(new Date()))
  const [showForm, setForm]      = React.useState(false)
  const [showEnergyForm, setEF]  = React.useState(false)
  const [wcOptions, setWcOptions] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const [mpsRes, capRes, enRes, wcRes] = await Promise.all([
      apiCall<{ items: MpsRow[] }>(`/api/mfg-planning/master-schedule?week_start=${weekFilter}&pageSize=200`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: CapRow[] }>(`/api/mfg-planning/capacity-loads?week_start=${weekFilter}&pageSize=50`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: EnergyRow[] }>('/api/mfg-planning/energy-windows?pageSize=200', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-orders/work-centers?pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    if (mpsRes.ok) setItems(mpsRes.result?.items ?? [])
    if (capRes.ok) setCapacity(capRes.result?.items ?? [])
    if (enRes.ok) setEnergy(enRes.result?.items ?? [])
    if (wcRes.ok) setWcOptions((wcRes.result?.items ?? []).map((w: any) => ({ value: w.id, label: `${w.code} — ${w.name}` })))
    setLoading(false)
  }, [weekFilter])

  React.useEffect(() => { load() }, [load])

  const handleConfirm = (item: MpsRow) => {
    runMutation({
      context: { entityId: 'mfg_planning.schedule', recordId: item.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-planning/master-schedule', { method: 'PUT', body: JSON.stringify({ id: item.id, status: 'confirmed' }) })
        flash(`MPS ${item.schedule_number} confirmado`, 'success')
        load()
      },
    })
  }

  const overloadedLines = capacity.filter((c) => c.overloaded)
  const weekEnd = new Date(weekFilter)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const mpsCols: ColumnDef<MpsRow>[] = [
    { accessorKey: 'schedule_number', header: 'Item MPS', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.schedule_number}</span> },
    { id: 'product', header: 'Producto', cell: ({ row }) => (
      <div><span className="font-semibold text-sm">{row.original.product_code}</span>
      <div className="text-xs text-muted-foreground">{row.original.product_name}</div></div>
    )},
    { id: 'qty', header: 'Cantidad / Línea', cell: ({ row }) => (
      <div><span className="font-semibold">{Number(row.original.planned_quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })} {row.original.uom}</span>
      <div className="text-xs text-muted-foreground">{row.original.work_center_name ?? '—'} · prioridad {row.original.priority}</div></div>
    )},
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => (
      <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge>
    )},
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        ...(row.original.status === 'planned' ? [{ id: 'confirm', label: 'Confirmar MPS', onSelect: () => handleConfirm(row.original) }] : []),
      ]} />
    )},
  ]

  const capCols: ColumnDef<CapRow>[] = [
    { accessorKey: 'work_center_name', header: 'Línea / Centro' },
    { id: 'load', header: 'Carga vs. Capacidad', cell: ({ row }) => {
      const c = row.original
      const pct = Number(c.utilization_pct)
      const barColor = pct > 100 ? 'bg-status-error-bg' : pct > 80 ? 'bg-status-warning-bg' : 'bg-status-success-bg'
      return (
        <div className="w-40">
          <div className="flex justify-between text-xs mb-1">
            <span className={pct > 100 ? 'text-status-error-text font-bold' : ''}>{pct.toFixed(0)}%</span>
            <span className="text-muted-foreground">{c.loaded_hrs}h / {c.available_hrs}h</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )
    }},
    { id: 'flag', header: '', cell: ({ row }) => row.original.overloaded ? <StatusBadge variant="error">Sobrecargado</StatusBadge> : <StatusBadge variant="success">OK</StatusBadge> },
  ]

  // Energy heatmap: 7 days × 24 hours aggregated by restriction_type
  const restrictionMap: Map<string, string> = new Map()
  for (const ew of energy) {
    if (ew.restriction_type === 'restriction') {
      for (let h = ew.hour_start; h <= ew.hour_end; h++) {
        restrictionMap.set(`${ew.day_of_week}-${h}`, 'restriction')
      }
    }
  }

  return (
    <Page>
      <PageHeader
        title="Plan Maestro de Producción (MPS)"
        description={`Semana ${new Date(weekFilter).toLocaleDateString('es-VE')} → ${weekEnd.toLocaleDateString('es-VE')}${overloadedLines.length > 0 ? ` · ${overloadedLines.length} línea(s) sobrecargada(s)` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <input type="date" value={weekFilter} onChange={(e) => setWeek(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-background" />
            <Button type="button" variant="outline" onClick={() => setEF(!showEnergyForm)}>
              <Zap className="size-4 mr-2" /> Ventanas energía
            </Button>
            <Button type="button" onClick={() => setForm(!showForm)}>
              <Plus className="size-4 mr-2" /> Agregar al MPS
            </Button>
          </div>
        }
      />
      <PageBody>
        {overloadedLines.length > 0 && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
            <AlertTriangle className="size-4 text-status-warning-icon shrink-0" />
            <span className="text-sm text-status-warning-text">
              {overloadedLines.map((l) => l.work_center_name).join(', ')} sobrecargada(s) esta semana. Revisar el plan antes de confirmar.
            </span>
          </div>
        )}

        {/* Energy heatmap */}
        {energy.length > 0 && (
          <div className="mb-6 border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="size-4" /> Disponibilidad Eléctrica por Zona (heatmap)</h3>
            <div className="overflow-x-auto">
            {/* AGM Exception: raw <table> — energy heatmap visualization (24h × 7d grid), not a data records table. DataTable is unsuitable for a fixed-dimension visualization matrix. */}
            <table className="text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="w-12 text-left p-1">Hora</th>
                    {DAYS.map((d) => <th key={d} className="p-1 w-10 text-center">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, h) => (
                    <tr key={h}>
                      <td className="text-muted-foreground p-1">{h}:00</td>
                      {Array.from({ length: 7 }, (_, d) => {
                        const isRestriction = restrictionMap.get(`${d}-${h}`) === 'restriction'
                        return (
                          <td key={d} className={`w-10 h-5 border border-border/30 ${isRestriction ? 'bg-status-error-bg' : 'bg-muted/20'}`} title={isRestriction ? 'Corte previsto' : 'Disponible'} />
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-status-error-bg inline-block" /> Corte previsto (CORPOELEC)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted/20 inline-block" /> Disponible</span>
              </div>
            </div>
          </div>
        )}

        {/* Energy window form */}
        {showEnergyForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Registrar Ventana Energética (patrón CORPOELEC)</h3>
            <CrudForm{...({} as any)} entityId="mfg_planning.energy_window" apiPath="/api/mfg-planning/energy-windows" mode="create"
              fields={[
                { type: 'text' as const,   id: 'zone',             label: 'Zona / Municipio (ej: Zona Industrial Tejerías)', required: true },
                { type: 'select' as const, id: 'day_of_week',      label: 'Día de la semana', required: true, options: [{ value: '0', label: 'Lunes' }, { value: '1', label: 'Martes' }, { value: '2', label: 'Miércoles' }, { value: '3', label: 'Jueves' }, { value: '4', label: 'Viernes' }, { value: '5', label: 'Sábado' }, { value: '6', label: 'Domingo' }] },
                { type: 'number' as const, id: 'hour_start',       label: 'Hora inicio (0-23)', required: true },
                { type: 'number' as const, id: 'hour_end',         label: 'Hora fin (0-23)', required: true },
                { type: 'select' as const, id: 'restriction_type', label: 'Tipo', required: true, options: [{ value: 'restriction', label: 'Corte planificado' }, { value: 'unstable', label: 'Inestable' }, { value: 'reliable', label: 'Confiable' }] },
                { type: 'text' as const,   id: 'reliability_pct',  label: 'Confiabilidad histórica (%)' },
              ]}
              onSuccess={() => { flash('Ventana energética registrada', 'success'); setEF(false); load() }}
            />
          </div>
        )}

        {/* MPS form */}
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Agregar Ítem al MPS</h3>
            <CrudForm{...({} as any)} entityId="mfg_planning.schedule" apiPath="/api/mfg-planning/master-schedule" mode="create"
              initial={{ week_start: weekFilter, week_end: weekEnd.toISOString().split('T')[0] }}
              fields={[
                { type: 'text' as const,   id: 'schedule_number',  label: 'N° MPS (MPS-2026-W23-XXX)', required: true },
                { type: 'text' as const,   id: 'product_code',     label: 'Código de Producto', required: true },
                { type: 'text' as const,   id: 'product_name',     label: 'Nombre del Producto', required: true },
                { type: 'text' as const,   id: 'planned_quantity', label: 'Cantidad Planificada', required: true },
                { type: 'text' as const,   id: 'uom',              label: 'Unidad', required: true },
                { type: 'select' as const, id: 'work_center_id',   label: 'Línea / Centro de Trabajo', options: wcOptions },
                { type: 'number' as const, id: 'priority',         label: 'Prioridad (1-100)' },
                { type: 'datetime-local' as const, id: 'planned_start', label: 'Inicio planificado' },
                { type: 'datetime-local' as const, id: 'planned_end',   label: 'Fin planificado' },
              ]}
              onSuccess={() => { flash('Ítem MPS agregado', 'success'); setForm(false); load() }}
            />
          </div>
        )}

        {/* Capacity bars */}
        {capacity.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Carga de Capacidad — Semana</h3>
            <DataTable entityId="mfg_planning.capacity" data={capacity} columns={capCols} isLoading={isLoading}
              emptyState="Sin datos de capacidad" />
          </div>
        )}

        {/* MPS items */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Ítems del MPS ({items.length})</h3>
          <DataTable entityId="mfg_planning.schedule" data={items} columns={mpsCols} isLoading={isLoading}
            emptyState="Sin ítems en el MPS esta semana"
            stickyActionsColumn />
        </div>
      </PageBody>
    </Page>
  )
}
