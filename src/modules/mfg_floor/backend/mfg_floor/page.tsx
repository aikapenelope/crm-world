'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Zap, RefreshCw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type OrderRow = { id: string; order_number: string; product_code: string; planned_quantity: string; actual_quantity: string | null; uom: string; status: string; work_center_name: string | null; scheduled_end: string | null }
type OeeRow   = { work_center_name: string; work_center_code: string; oee_total_pct: string; oee_internal_pct: string; downtime_hrs_total: string; downtime_hrs_electrical: string; record_date: string }
type ShiftRow = { report_number: string; shift_type: string; shift_date: string; work_center_name: string | null; actual_production: string; oee_total_pct: string | null; oee_internal_pct: string | null; total_downtime_hrs: string; electrical_downtime_hrs: string }

const SHIFT_LABEL: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' }

function OeeMeter({ value, label, variant }: { value: number; label: string; variant: 'error' | 'warning' | 'success' }) {
  const colorClass = variant === 'success' ? 'bg-status-success-bg text-status-success-text' : variant === 'warning' ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-error-bg text-status-error-text'
  return (
    <div className={`rounded-lg p-4 ${colorClass}`}>
      <div className="text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-3xl font-bold">{value.toFixed(1)}%</div>
      <div className="text-xs mt-1">{value >= 85 ? 'World-class ✓' : value >= 65 ? 'Aceptable' : 'Requiere atención'}</div>
    </div>
  )
}

export default function MfgFloorPage() {
  const [activeOrders, setActive]  = React.useState<OrderRow[]>([])
  const [oeeHistory, setOee]       = React.useState<OeeRow[]>([])
  const [shiftReports, setShifts]  = React.useState<ShiftRow[]>([])
  const [isLoading, setLoading]    = React.useState(true)
  const [isClosing, setClosing]    = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const [ordRes, oeeRes, shiftRes] = await Promise.all([
      apiCall<{ items: OrderRow[] }>('/api/mfg-orders/production-orders?status=in_progress&pageSize=50', undefined, { fallback: { items: [] } }),
      apiCall<{ items: OeeRow[] }>('/api/mfg-floor/oee-history?pageSize=90', undefined, { fallback: { items: [] } }),
      apiCall<{ items: ShiftRow[] }>('/api/mfg-floor/shift-reports?pageSize=10', undefined, { fallback: { items: [] } }),
    ])
    if (ordRes.ok) setActive(ordRes.result?.items ?? [])
    if (oeeRes.ok) setOee(oeeRes.result?.items ?? [])
    if (shiftRes.ok) setShifts(shiftRes.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleCloseShift = async () => {
    setClosing(true)
    try {
      const res = await apiCallOrThrow<any>('/api/mfg-floor/close-shift', { method: 'POST', body: '{}' })
      flash(`Turno cerrado: ${res.result?.data?.reports_generated ?? 0} reportes generados`, 'success')
      load()
    } catch { flash('Error al cerrar turno', 'error') }
    setClosing(false)
  }

  // Aggregate latest OEE per work center
  const latestOeeByWc: Map<string, OeeRow> = new Map()
  for (const row of oeeHistory) {
    if (!latestOeeByWc.has(row.work_center_code)) latestOeeByWc.set(row.work_center_code, row)
  }
  const wcList = Array.from(latestOeeByWc.values())

  const avgOeeTotal    = wcList.length > 0 ? wcList.reduce((s, w) => s + Number(w.oee_total_pct), 0) / wcList.length : 0
  const avgOeeInternal = wcList.length > 0 ? wcList.reduce((s, w) => s + Number(w.oee_internal_pct), 0) / wcList.length : 0

  const today = new Date().toISOString().split('T')[0]
  const lateOrders = activeOrders.filter((o) => o.scheduled_end && o.scheduled_end.split('T')[0] < today)

  const orderCols: ColumnDef<OrderRow>[] = [
    { accessorKey: 'order_number', header: 'Orden', cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.order_number}</span> },
    { accessorKey: 'product_code', header: 'Producto', cell: ({ row }) => (
      <div><span className="font-semibold">{row.original.product_code}</span>
      <div className="text-xs text-muted-foreground">{row.original.work_center_name ?? '—'}</div></div>
    )},
    { id: 'progress', header: 'Avance', cell: ({ row }) => {
      const r = row.original
      const pct = Number(r.planned_quantity) > 0 ? Math.min(100, (Number(r.actual_quantity ?? 0) / Number(r.planned_quantity)) * 100) : 0
      const barColor = pct >= 75 ? 'bg-status-success-bg' : pct >= 40 ? 'bg-status-warning-bg' : 'bg-status-error-bg'
      return (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span>{pct.toFixed(0)}%</span>
            <span className="text-muted-foreground">{r.actual_quantity ?? 0}/{r.planned_quantity} {r.uom}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )
    }},
    { accessorKey: 'scheduled_end', header: 'Fin planificado', cell: ({ row }) => {
      const d = row.original.scheduled_end
      if (!d) return '—'
      const isLate = d.split('T')[0] < today
      return <span className={isLate ? 'text-status-error-text font-semibold' : ''}>{new Date(d).toLocaleDateString('es-VE')}{isLate ? ' ⚠' : ''}</span>
    }},
  ]

  const shiftCols: ColumnDef<ShiftRow>[] = [
    { accessorKey: 'report_number', header: 'Reporte', cell: ({ row }) => <span className="font-mono text-sm">{row.original.report_number}</span> },
    { id: 'turno', header: 'Turno', cell: ({ row }) => (
      <div><span className="font-semibold">{SHIFT_LABEL[row.original.shift_type] ?? row.original.shift_type}</span>
      <div className="text-xs text-muted-foreground">{new Date(row.original.shift_date).toLocaleDateString('es-VE')} · {row.original.work_center_name ?? '—'}</div></div>
    )},
    { id: 'oee', header: 'OEE total / interno', cell: ({ row }) => (
      <div className="text-sm">
        <span className={`font-bold ${Number(row.original.oee_total_pct) >= 65 ? 'text-status-success-text' : 'text-status-error-text'}`}>{row.original.oee_total_pct}%</span>
        <span className="text-muted-foreground mx-1">/</span>
        <span className="font-bold">{row.original.oee_internal_pct}%</span>
        <div className="text-xs text-muted-foreground">Paros: {row.original.total_downtime_hrs}h ({row.original.electrical_downtime_hrs}h CORPOELEC)</div>
      </div>
    )},
    { accessorKey: 'actual_production', header: 'Producción real', cell: ({ row }) => <span className="font-semibold">{Number(row.original.actual_production).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span> },
  ]

  return (
    <Page>
      <PageHeader
        title="Dashboard de Piso de Planta"
        description={`${activeOrders.length} órdenes en proceso${lateOrders.length > 0 ? ` · ${lateOrders.length} con retraso` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="size-4 mr-2" /> Actualizar
            </Button>
            <Button type="button" disabled={isClosing} onClick={handleCloseShift}>
              <Zap className="size-4 mr-2" /> {isClosing ? 'Cerrando…' : 'Cerrar turno'}
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* OEE Summary cards */}
        {wcList.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">OEE por Línea — Último turno registrado</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <OeeMeter value={avgOeeTotal}    label="OEE Total (promedio)" variant={avgOeeTotal >= 85 ? 'success' : avgOeeTotal >= 65 ? 'warning' : 'error'} />
              <OeeMeter value={avgOeeInternal} label="OEE Interno (sin CORPOELEC)" variant={avgOeeInternal >= 85 ? 'success' : avgOeeInternal >= 65 ? 'warning' : 'error'} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {wcList.map((wc) => (
                <div key={wc.work_center_code} className="border border-border rounded-lg p-3">
                  <div className="font-semibold text-sm mb-1">{wc.work_center_name}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span>
                      <span className={`font-bold ${Number(wc.oee_total_pct) >= 65 ? 'text-status-success-text' : 'text-status-error-text'}`}>{wc.oee_total_pct}%</span>
                      <span className="text-muted-foreground ml-1 text-xs">total</span>
                    </span>
                    <span>
                      <span className="font-bold">{wc.oee_internal_pct}%</span>
                      <span className="text-muted-foreground ml-1 text-xs">interno</span>
                    </span>
                  </div>
                  {Number(wc.downtime_hrs_electrical) > 0 && (
                    <div className="text-xs text-status-warning-text mt-1">⚡ {wc.downtime_hrs_electrical}h CORPOELEC</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active orders */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Órdenes Activas en Planta ({activeOrders.length})</h3>
          <DataTable entityId="mfg_floor.active_order" data={activeOrders} columns={orderCols} isLoading={isLoading}
            emptyState="Sin órdenes en proceso" />
        </div>

        {/* Recent shift reports */}
        {shiftReports.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Últimos Reportes de Turno</h3>
            <DataTable entityId="mfg_floor.shift_report" data={shiftReports} columns={shiftCols} isLoading={isLoading}
              emptyState="Sin reportes de turno" />
          </div>
        )}
      </PageBody>
    </Page>
  )
}
