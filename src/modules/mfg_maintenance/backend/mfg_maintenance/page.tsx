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
import { Plus, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type EqRow  = { id: string; equipment_code: string; name: string; criticality: string; status: string; next_maintenance_date: string | null; work_center_name: string | null; replacement_cost_usd: string | null }
type WoRow  = { id: string; wo_number: string; equipment_code: string; equipment_name: string; work_type: string; priority: string; status: string; scheduled_date: string | null; description: string }
type SpRow  = { id: string; part_code: string; part_name: string; current_stock: string; reorder_point: string; safety_stock: string; uom: string; is_imported: boolean; lead_time_days: number; unit_cost_usd: string | null }

const EQ_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { operational: 'success', under_maintenance: 'warning', breakdown: 'error', retired: 'neutral' }
const EQ_STATUS_LABEL: Record<string, string> = { operational: 'Operativo', under_maintenance: 'En mantenimiento', breakdown: 'Avería', retired: 'Retirado' }
const CRIT_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = { critical: 'error', high: 'warning', medium: 'info', low: 'neutral' }
const WO_STATUS_VARIANT: Record<string, 'warning' | 'error' | 'success' | 'neutral'> = { open: 'warning', in_progress: 'error', completed: 'success', cancelled: 'neutral' }
const WO_TYPE_LABEL: Record<string, string> = { preventive: 'Preventivo', corrective: 'Correctivo', predictive: 'Predictivo' }

export default function MfgMaintenancePage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [equipment, setEq]    = React.useState<EqRow[]>([])
  const [workOrders, setWos]  = React.useState<WoRow[]>([])
  const [spareParts, setSps]  = React.useState<SpRow[]>([])
  const [isLoading, setLoad]  = React.useState(true)
  const [isChecking, setCheck] = React.useState(false)
  const [showWoForm, setWoForm] = React.useState(false)
  const [activeTab, setTab]   = React.useState<'equipment' | 'work_orders' | 'spare_parts'>('work_orders')

  const load = React.useCallback(async () => {
    setLoad(true)
    const [eqRes, woRes, spRes] = await Promise.all([
      apiCall<{ items: EqRow[] }>('/api/mfg-maintenance/equipment?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: WoRow[] }>('/api/mfg-maintenance/work-orders-maint?status=open&pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: SpRow[] }>('/api/mfg-maintenance/spare-parts?pageSize=200', undefined, { fallback: { items: [] } }),
    ])
    if (eqRes.ok) setEq(eqRes.result?.items ?? [])
    if (woRes.ok) setWos(woRes.result?.items ?? [])
    if (spRes.ok) setSps(spRes.result?.items ?? [])
    setLoad(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleRunCheck = async () => {
    setCheck(true)
    try {
      const res = await apiCallOrThrow<any>('/api/mfg-maintenance/check-maintenance-due', { method: 'POST', body: '{}' })
      const d = res.result?.data
      flash(`Check mantenimiento: ${d?.work_orders_created ?? 0} WOs creadas · ${d?.overdue_plans ?? 0} planes vencidos · ${d?.spare_part_alerts ?? 0} alertas repuestos`, d?.overdue_plans > 0 ? 'warning' : 'success')
      load()
    } catch { flash('Error ejecutando check de mantenimiento', 'error') }
    setCheck(false)
  }

  const handleStartWo = (wo: WoRow) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_maintenance.wo', recordId: wo.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-maintenance/work-orders-maint', { method: 'PUT', body: JSON.stringify({ id: wo.id, status: 'in_progress', started_at: new Date().toISOString() }) })
        flash(`WO ${wo.wo_number} iniciada`, 'success')
        load()
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const in7   = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const overdueEq        = equipment.filter((e) => e.next_maintenance_date && e.next_maintenance_date < today)
  const breakdownEq      = equipment.filter((e) => e.status === 'breakdown')
  const lowStockParts    = spareParts.filter((p) => Number(p.current_stock) <= Number(p.reorder_point))
  const importedLowStock = lowStockParts.filter((p) => p.is_imported)
  const criticalWos      = workOrders.filter((w) => w.priority === 'critical')

  const eqCols: ColumnDef<EqRow>[] = [
    { id: 'code', header: 'Equipo', cell: ({ row }) => (
      <div><span className="font-mono font-semibold text-sm">{row.original.equipment_code}</span>
      <div className="text-xs text-muted-foreground">{row.original.name}</div></div>
    )},
    { accessorKey: 'criticality', header: 'Criticidad', cell: ({ row }) => <StatusBadge variant={CRIT_VARIANT[row.original.criticality] ?? 'neutral'}>{row.original.criticality}</StatusBadge> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <StatusBadge variant={EQ_STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{EQ_STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge> },
    { id: 'next_maint', header: 'Próximo mantenimiento', cell: ({ row }) => {
      const d = row.original.next_maintenance_date
      if (!d) return <span className="text-xs text-muted-foreground">Sin plan activo</span>
      const isOverdue = d < today
      const isDue    = d <= in7 && !isOverdue
      return <span className={`text-sm ${isOverdue ? 'text-status-error-text font-semibold' : isDue ? 'text-status-warning-text font-semibold' : ''}`}>{new Date(d).toLocaleDateString('es-VE')}{isOverdue ? ' ⚠ VENCIDO' : isDue ? ' ⚡ Esta semana' : ''}</span>
    }},
    { id: 'actions', cell: ({ row }) => <RowActions items={[{ id: 'view', label: 'Ver equipo / historial', onSelect: () => router.push(`/backend/mfg-maintenance/${row.original.id}`) }]} /> },
  ]

  const woCols: ColumnDef<WoRow>[] = [
    { accessorKey: 'wo_number', header: 'WO', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.wo_number}</span> },
    { id: 'equip', header: 'Equipo', cell: ({ row }) => (
      <div><span className="font-semibold text-sm">{row.original.equipment_code}</span>
      <div className="text-xs text-muted-foreground truncate max-w-32">{row.original.description}</div></div>
    )},
    { id: 'type_prio', header: 'Tipo / Prioridad', cell: ({ row }) => (
      <div className="flex gap-1 flex-wrap">
        <span className="text-xs">{WO_TYPE_LABEL[row.original.work_type] ?? row.original.work_type}</span>
        <StatusBadge variant={CRIT_VARIANT[row.original.priority] ?? 'neutral'}>{row.original.priority}</StatusBadge>
      </div>
    )},
    { accessorKey: 'scheduled_date', header: 'Fecha plan', cell: ({ row }) => row.original.scheduled_date ? new Date(row.original.scheduled_date).toLocaleDateString('es-VE') : '—' },
    { id: 'actions', cell: ({ row }) => <RowActions items={[
      { id: 'start', label: 'Iniciar WO', onSelect: () => handleStartWo(row.original) },
      { id: 'view', label: 'Ver equipo', onSelect: () => router.push(`/backend/mfg-maintenance/${row.original.equipment_id ?? ''}`) },
    ]} /> },
  ]

  const spCols: ColumnDef<SpRow>[] = [
    { id: 'part', header: 'Repuesto', cell: ({ row }) => (
      <div><span className="font-mono font-semibold text-sm">{row.original.part_code}</span>
      {row.original.is_imported && <StatusBadge variant="warning" className="ml-1 text-xs">Importado</StatusBadge>}
      <div className="text-xs text-muted-foreground">{row.original.part_name}</div></div>
    )},
    { id: 'stock', header: 'Stock / Mínimo', cell: ({ row }) => {
      const atRisk = Number(row.original.current_stock) <= Number(row.original.reorder_point)
      return (
        <div>
          <span className={`font-semibold ${atRisk ? 'text-status-error-text' : ''}`}>{row.original.current_stock} {row.original.uom}</span>
          <div className="text-xs text-muted-foreground">Reorden: {row.original.reorder_point} · Seg: {row.original.safety_stock}</div>
          {row.original.is_imported && <div className="text-xs text-muted-foreground">Lead: {row.original.lead_time_days}d</div>}
        </div>
      )
    }},
    { id: 'cost', header: 'Costo unit', cell: ({ row }) => row.original.unit_cost_usd ? `USD ${Number(row.original.unit_cost_usd).toFixed(2)}` : '—' },
  ]

  const TABS = [{ id: 'work_orders' as const, label: `WOs Abiertas (${workOrders.length})` }, { id: 'equipment' as const, label: `Equipos (${equipment.length})` }, { id: 'spare_parts' as const, label: `Repuestos (${spareParts.length})` }]

  return (
    <Page>
      <PageHeader
        title="Mantenimiento Industrial (GMAO)"
        description={[
          breakdownEq.length > 0 && `${breakdownEq.length} avería(s) activa(s)`,
          criticalWos.length > 0 && `${criticalWos.length} WO crítica(s)`,
          importedLowStock.length > 0 && `${importedLowStock.length} repuesto(s) importado(s) bajo mínimo`,
        ].filter(Boolean).join(' · ') || `${workOrders.length} WOs abiertas`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => load()}><RefreshCw className="size-4 mr-2" /> Actualizar</Button>
            <Button type="button" disabled={isChecking} onClick={handleRunCheck}>{isChecking ? 'Verificando…' : 'Verificar mantenimientos'}</Button>
            <Button type="button" onClick={() => setWoForm(!showWoForm)}><Plus className="size-4 mr-2" /> Nueva WO</Button>
          </div>
        }
      />
      <PageBody>
        {/* Critical alerts */}
        {(breakdownEq.length > 0 || importedLowStock.length > 0 || overdueEq.length > 0) && (
          <div className="mb-4 space-y-2">
            {breakdownEq.length > 0 && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-error-icon shrink-0" />
                <span className="text-sm text-status-error-text font-semibold">
                  Averías activas: {breakdownEq.map((e) => e.equipment_code).join(', ')}
                </span>
              </div>
            )}
            {importedLowStock.length > 0 && (
              <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg flex items-center gap-2">
                <Package className="size-4 text-status-warning-icon shrink-0" />
                <span className="text-sm text-status-warning-text">
                  <strong>{importedLowStock.length} repuesto(s) importado(s)</strong> bajo el punto de reorden — iniciar compra urgente (lead time {importedLowStock[0]?.lead_time_days}d+).
                </span>
              </div>
            )}
          </div>
        )}

        {/* WO quick create */}
        {showWoForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3">Crear Orden de Trabajo de Mantenimiento</h3>
            <CrudForm entityId="mfg_maintenance.wo" apiPath="/api/mfg-maintenance/work-orders-maint" mode="create"
              fields={[
                { type: 'text' as const,   id: 'wo_number',       label: 'Número WO (WO-MAINT-2026-XXX)', required: true },
                { type: 'text' as const,   id: 'equipment_code',  label: 'Código de Equipo', required: true },
                { type: 'text' as const,   id: 'equipment_name',  label: 'Nombre del Equipo', required: true },
                { type: 'select' as const, id: 'work_type',       label: 'Tipo', required: true, options: [{ value: 'preventive', label: 'Preventivo' }, { value: 'corrective', label: 'Correctivo' }, { value: 'predictive', label: 'Predictivo' }] },
                { type: 'select' as const, id: 'priority',        label: 'Prioridad', required: true, options: [{ value: 'critical', label: 'Crítico' }, { value: 'high', label: 'Alta' }, { value: 'medium', label: 'Media' }, { value: 'low', label: 'Baja' }] },
                { type: 'textarea' as const, id: 'description',   label: 'Descripción de la tarea', required: true },
                { type: 'textarea' as const, id: 'fault_description', label: 'Descripción de la falla (si es correctivo)' },
                { type: 'date' as const,   id: 'scheduled_date',  label: 'Fecha programada' },
              ]}
              groups={[
                { id: 'basic', title: 'Identificación', fields: ['wo_number', 'equipment_code', 'equipment_name', 'work_type', 'priority'] },
                { id: 'desc',  title: 'Descripción',    fields: ['description', 'fault_description', 'scheduled_date'] },
              ]}
              onSuccess={() => { flash('Orden de trabajo creada', 'success'); setWoForm(false); load() }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {TABS.map((t) => (
            <Button key={t.id} type="button" size="sm" variant={activeTab === t.id ? 'default' : 'outline'} onClick={() => setTab(t.id)}>{t.label}</Button>
          ))}
        </div>

        {activeTab === 'work_orders' && (
          <DataTable entityId="mfg_maintenance.wo" extensionTableId="mfg-maintenance-wos" data={workOrders} columns={woCols} isLoading={isLoading}
            emptyState='Sin órdenes de trabajo abiertas'
            stickyActionsColumn />
        )}
        {activeTab === 'equipment' && (
          <DataTable entityId="mfg_maintenance.equipment" extensionTableId="mfg-maintenance-equipment" data={equipment} columns={eqCols} isLoading={isLoading}
            emptyState='Sin equipos registrados'
            stickyActionsColumn />
        )}
        {activeTab === 'spare_parts' && (
          <DataTable entityId="mfg_maintenance.spare_part" extensionTableId="mfg-maintenance-spares" data={spareParts} columns={spCols} isLoading={isLoading}
            emptyState='Sin repuestos registrados' />
        )}
      </PageBody>
    </Page>
  )
}
