'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { RefreshCw } from 'lucide-react'

type Kpi = {
  production:    { active_orders: number }
  quality:       { open_ncs: number; critical_ncs: number }
  inventory:     { quarantine_lots: number; expiring_lots: number }
  maintenance:   { breakdowns: number; open_wos: number; spare_alerts: number }
  procurement:   { active_imports: number }
  costs:         { total_variance_30d: string }
  subcontracting: { active_scs: number }
}

type KpiCardProps = {
  title:    string
  value:    string | number
  sub?:     string
  href?:    string
  severity?: 'ok' | 'warning' | 'critical' | 'neutral'
}

function KpiCard({ title, value, sub, href, severity = 'neutral' }: KpiCardProps) {
  const router = useRouter()
  const bg = severity === 'critical' ? 'bg-status-error-bg border-status-error-border' :
             severity === 'warning'  ? 'bg-status-warning-bg border-status-warning-border' :
             severity === 'ok'       ? 'bg-status-success-bg border-status-success-border' :
             'bg-card border-border'
  const textColor = severity === 'critical' ? 'text-status-error-text' :
                    severity === 'warning'  ? 'text-status-warning-text' :
                    severity === 'ok'       ? 'text-status-success-text' :
                    'text-foreground'

  return (
    <div
      className={`border rounded-xl p-4 ${bg} ${href ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={href ? () => router.push(href) : undefined}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default function MfgReportsPage() {
  const [kpi, setKpi]       = React.useState<Kpi | null>(null)
  const [isLoading, setLoad] = React.useState(true)
  const [lastRefresh, setLR] = React.useState<Date | null>(null)

  const load = React.useCallback(async () => {
    setLoad(true)
    const res = await apiCall<{ data: Kpi }>('/api/mfg-reports/kpi-summary', undefined, { fallback: null })
    if (res.ok && res.result?.data) {
      setKpi(res.result.data)
      setLR(new Date())
    }
    setLoad(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const costVariance = kpi ? Number(kpi.costs.total_variance_30d) : 0

  return (
    <Page>
      <PageHeader
        title="Dashboard KPIs — Manufactura Industrial"
        description={lastRefresh ? `Actualizado: ${lastRefresh.toLocaleTimeString('es-VE')}` : 'Cargando...'}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        }
      />
      <PageBody>
        {kpi ? (
          <div className="space-y-6">
            {/* Row 1: Production + Quality */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Producción y Calidad</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  title="Órdenes activas"
                  value={kpi.production.active_orders}
                  href="/backend/mfg-orders"
                  severity={kpi.production.active_orders > 0 ? 'ok' : 'neutral'}
                />
                <KpiCard
                  title="NCs abiertas"
                  value={kpi.quality.open_ncs}
                  sub={kpi.quality.critical_ncs > 0 ? `${kpi.quality.critical_ncs} crítica(s)` : undefined}
                  href="/backend/mfg-quality"
                  severity={kpi.quality.critical_ncs > 0 ? 'critical' : kpi.quality.open_ncs > 5 ? 'warning' : 'ok'}
                />
                <KpiCard
                  title="Lotes en cuarentena"
                  value={kpi.inventory.quarantine_lots}
                  href="/backend/mfg-inventory"
                  severity={kpi.inventory.quarantine_lots > 0 ? 'warning' : 'ok'}
                />
                <KpiCard
                  title="Lotes próx. vencer"
                  value={kpi.inventory.expiring_lots}
                  sub="En los próximos 30 días"
                  href="/backend/mfg-inventory"
                  severity={kpi.inventory.expiring_lots > 2 ? 'warning' : kpi.inventory.expiring_lots > 0 ? 'warning' : 'ok'}
                />
              </div>
            </div>

            {/* Row 2: Maintenance + Procurement */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Mantenimiento y Compras</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  title="Equipos en avería"
                  value={kpi.maintenance.breakdowns}
                  href="/backend/mfg-maintenance"
                  severity={kpi.maintenance.breakdowns > 0 ? 'critical' : 'ok'}
                />
                <KpiCard
                  title="WOs de mant. abiertas"
                  value={kpi.maintenance.open_wos}
                  href="/backend/mfg-maintenance"
                  severity={kpi.maintenance.open_wos > 5 ? 'warning' : 'neutral'}
                />
                <KpiCard
                  title="Repuestos bajo mínimo"
                  value={kpi.maintenance.spare_alerts}
                  href="/backend/mfg-maintenance"
                  severity={kpi.maintenance.spare_alerts > 0 ? 'warning' : 'ok'}
                />
                <KpiCard
                  title="Importaciones activas"
                  value={kpi.procurement.active_imports}
                  sub="En tránsito / en aduana"
                  href="/backend/mfg-procurement"
                  severity={kpi.procurement.active_imports > 0 ? 'warning' : 'neutral'}
                />
              </div>
            </div>

            {/* Row 3: Costs + Subcontracting */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Costos y Maquila</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard
                  title="Variación costos (30d)"
                  value={`${costVariance > 0 ? '+' : ''}USD ${costVariance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                  sub={costVariance > 0 ? 'Desfavorable' : 'Favorable'}
                  href="/backend/mfg-costs"
                  severity={costVariance > 1000 ? 'critical' : costVariance > 0 ? 'warning' : 'ok'}
                />
                <KpiCard
                  title="Maquilas activas"
                  value={kpi.subcontracting.active_scs}
                  href="/backend/mfg-subcontract"
                  severity={kpi.subcontracting.active_scs > 0 ? 'neutral' : 'neutral'}
                />
              </div>
            </div>

            {/* Navigation grid */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Módulos del sistema</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { label: 'BOM', href: '/backend/mfg-bom' },
                  { label: 'Inventario', href: '/backend/mfg-inventory' },
                  { label: 'Órdenes', href: '/backend/mfg-orders' },
                  { label: 'Calidad', href: '/backend/mfg-quality' },
                  { label: 'MRP', href: '/backend/mfg-mrp' },
                  { label: 'Piso Planta', href: '/backend/mfg-floor' },
                  { label: 'Planificación', href: '/backend/mfg-planning' },
                  { label: 'Costos', href: '/backend/mfg-costs' },
                  { label: 'Mantenimiento', href: '/backend/mfg-maintenance' },
                  { label: 'Compras', href: '/backend/mfg-procurement' },
                  { label: 'Maquila', href: '/backend/mfg-subcontract' },
                  { label: 'Energía', href: '/backend/mfg-energy' },
                  { label: 'Despacho', href: '/backend/mfg-dispatch' },
                  { label: 'RRHH', href: '/backend/mfg-hr' },
                  { label: 'Portal cliente', href: '/backend/mfg-portal' },
                ].map((m) => (
                  <Button key={m.href} type="button" size="sm" variant="outline" onClick={() => window.location.href = m.href} className="text-xs">
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-card animate-pulse">
                <div className="h-3 w-20 bg-muted rounded mb-3" />
                <div className="h-8 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
