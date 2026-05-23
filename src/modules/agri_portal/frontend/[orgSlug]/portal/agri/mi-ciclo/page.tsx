'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

type Props = { params: { orgSlug: string } }

type DashboardData = {
  has_active_cycle: boolean
  flock?: {
    flock_number: string; species: string; genetic_line: string | null
    start_date: string; initial_count: number; planned_end_date: string | null
  }
  farm_unit?: { name: string; location_address: string | null } | null
  days_in_cycle?: number
  kpis?: {
    fca: number | null; iep: number | null; viability_pct: number | null
    live_count: number; avg_body_weight_g: number | null
    cumulative_feed_kg: number | null; projected_weight_kg: number | null; week_number: number
  }
}

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollo de Engorde', layer: 'Gallina Ponedora', turkey: 'Pavo', swine: 'Cerdo',
}

function KpiCard({ label, value, unit, highlight }: { label: string; value: string | number | null; unit?: string; highlight?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
        {value != null ? value : '—'}
        {value != null && unit ? <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span> : null}
      </div>
    </div>
  )
}

export default function MiCicloPage({ params }: Props) {
  void params
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    apiCall<DashboardData>('/api/agri-portal/producer-dashboard')
      .then(res => { if (res.ok && res.result) setData(res.result) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted-foreground">Cargando datos del ciclo...</div>
      </div>
    )
  }

  if (!data?.has_active_cycle || !data.flock) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Mi Ciclo Actual</h1>
        <div className="p-6 bg-muted/30 rounded-xl text-center">
          <div className="text-4xl mb-3">🐔</div>
          <h3 className="text-lg font-semibold mb-2">Sin ciclo activo</h3>
          <p className="text-sm text-muted-foreground">
            No tienes un lote de aves activo en este momento. Cuando inicies un nuevo ciclo, los datos de producción aparecerán aquí.
          </p>
        </div>
      </div>
    )
  }

  const { flock, farm_unit, days_in_cycle, kpis } = data

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Ciclo Actual</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {SPECIES_LABEL[flock.species] ?? flock.species}
          {flock.genetic_line ? ` · ${flock.genetic_line}` : ''}
          {farm_unit ? ` · ${farm_unit.name}` : ''}
        </p>
      </div>

      {/* Flock info bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-xl text-sm">
        <div>
          <span className="text-muted-foreground">Lote: </span>
          <span className="font-mono font-semibold">{flock.flock_number}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Entrada: </span>
          <span>{new Date(flock.start_date).toLocaleDateString('es-VE')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Aves iniciales: </span>
          <span className="font-semibold">{flock.initial_count.toLocaleString('es-VE')}</span>
        </div>
        {flock.planned_end_date && (
          <div>
            <span className="text-muted-foreground">Cosecha estimada: </span>
            <span>{new Date(flock.planned_end_date).toLocaleDateString('es-VE')}</span>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      {kpis ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Indicadores del Ciclo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Días en ciclo"        value={days_in_cycle ?? null} />
            <KpiCard label="Semana actual"         value={kpis.week_number > 0 ? `Semana ${kpis.week_number}` : 'Sin registros'} />
            <KpiCard label="FCA acumulado"         value={kpis.fca}             highlight />
            <KpiCard label="IEP"                   value={kpis.iep}             highlight />
            <KpiCard label="Viabilidad"            value={kpis.viability_pct != null ? `${kpis.viability_pct.toFixed(2)}` : null} unit="%" />
            <KpiCard label="Aves vivas"            value={kpis.live_count.toLocaleString('es-VE')} />
            <KpiCard label="Peso promedio"         value={kpis.avg_body_weight_g} unit="g" />
            <KpiCard label="Peso proy. día 42"     value={kpis.projected_weight_kg != null ? kpis.projected_weight_kg.toFixed(3) : null} unit="kg" />
          </div>

          {/* FCA interpretation */}
          {kpis.fca != null && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${kpis.fca <= 1.9 ? 'bg-status-success-bg text-status-success-text' : kpis.fca <= 2.1 ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-error-bg text-status-error-text'}`}>
              {kpis.fca <= 1.9
                ? `✓ FCA ${kpis.fca} — Excelente eficiencia. Por encima de las metas del contrato.`
                : kpis.fca <= 2.1
                ? `⚠ FCA ${kpis.fca} — Eficiencia aceptable. Revisar programa de alimentación.`
                : `⚠ FCA ${kpis.fca} — Por encima del objetivo. Atención al programa de alimentación.`}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-muted/20 rounded-xl text-sm text-muted-foreground">
          El ciclo acaba de iniciar. Los KPIs estarán disponibles después del primer registro semanal.
        </div>
      )}
    </div>
  )
}
