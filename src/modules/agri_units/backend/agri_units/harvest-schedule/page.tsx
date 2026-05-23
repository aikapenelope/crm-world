'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'
import { RefreshCw } from 'lucide-react'

type Flock = {
  id: string; flock_number: string; farm_unit_id: string; species: string
  genetic_line: string | null; start_date: string; initial_count: number
  planned_end_date: string | null; status: string; mortality_threshold_pct: string
}

type Kpis = {
  fca: number | null; iep: number | null; viability_pct: number | null
  live_count: number; avg_body_weight_g: number | null
  projected_weight_kg: number | null; days_in_cycle: number; week_number: number
  has_weekly_records: boolean
}

type WithdrawalAlert = { medication_name: string; withdrawal_end_date: string }

type FlockWithKpis = Flock & {
  kpis: Kpis | null
  withdrawal_alerts: WithdrawalAlert[]
  farm_unit_name: string
  days_to_harvest: number | null
}

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Broiler', layer: 'Ponedora', turkey: 'Pavo', swine: 'Cerdo', bovine: 'Bovino',
}

function FcaBadge({ fca, targetFca = 2.0 }: { fca: number | null; targetFca?: number }) {
  if (fca == null) return <span className="text-muted-foreground text-sm">—</span>
  const isGood = fca <= targetFca
  const isExcellent = fca <= targetFca - 0.1
  return (
    <div>
      <span className={`font-bold text-lg ${isExcellent ? 'text-status-success-text' : isGood ? 'text-foreground' : 'text-status-warning-text'}`}>
        {fca.toFixed(3)}
      </span>
      <span className={`ml-1 text-xs ${isExcellent ? 'text-status-success-text' : isGood ? 'text-muted-foreground' : 'text-status-warning-text'}`}>
        {isExcellent ? '✓✓' : isGood ? '✓' : '↑ alto'}
      </span>
    </div>
  )
}

export default function HarvestSchedulePage() {
  const router = useRouter()
  const [flocks, setFlocks]   = React.useState<FlockWithKpis[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)

    // 1. Fetch all active flocks
    const flockRes = await apiCall<{ items: Flock[] }>(
      '/api/agri-units/flocks?status=active&pageSize=100',
      undefined,
      { fallback: { items: [] } },
    )
    const rawFlocks = flockRes.result?.items ?? []

    if (rawFlocks.length === 0) { setFlocks([]); setLoading(false); return }

    // 2. Fetch KPIs + farm units + withdrawal alerts in parallel
    const [kpisResults, farmUnitsRes, withdrawalRes] = await Promise.all([
      Promise.all(rawFlocks.map((f) =>
        apiCall<Kpis>(`/api/agri-units/flock-kpis?flock_id=${f.id}`, undefined, { fallback: null })
          .then((r) => ({ flock_id: f.id, kpis: r.ok ? r.result : null })),
      )),
      apiCall<{ items: any[] }>('/api/agri-units/farm-units?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>(
        '/api/agri-vet/medication-records?resolved=false&pageSize=200',
        undefined,
        { fallback: { items: [] } },
      ),
    ])

    const farmMap = new Map<string, string>(
      (farmUnitsRes.result?.items ?? []).map((u: any) => [u.id, u.name]),
    )
    const today = new Date().toISOString().split('T')[0]
    const activeWithdrawals = (withdrawalRes.result?.items ?? []).filter(
      (m: any) => m.withdrawal_end_date >= today,
    )

    // 3. Assemble enriched flock data
    const assembled: FlockWithKpis[] = rawFlocks.map((f) => {
      const kpisEntry = kpisResults.find((k) => k.flock_id === f.id)
      const flockWithdrawals = activeWithdrawals
        .filter((m: any) => m.flock_id === f.id)
        .map((m: any) => ({ medication_name: m.medication_name, withdrawal_end_date: m.withdrawal_end_date }))

      let daysToHarvest: number | null = null
      if (f.planned_end_date) {
        const harvestDate = new Date(f.planned_end_date)
        const now = new Date()
        daysToHarvest = Math.floor((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        ...f,
        kpis: kpisEntry?.kpis ?? null,
        withdrawal_alerts: flockWithdrawals,
        farm_unit_name: farmMap.get(f.farm_unit_id ?? '') ?? '—',
        days_to_harvest: daysToHarvest,
      }
    })

    // Sort: soonest harvest first, then by start date
    assembled.sort((a, b) => {
      if (a.days_to_harvest != null && b.days_to_harvest != null) return a.days_to_harvest - b.days_to_harvest
      if (a.days_to_harvest != null) return -1
      if (b.days_to_harvest != null) return 1
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    })

    setFlocks(assembled)
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  // Real-time: refresh when any flock weekly record is saved
  useAppEvent('agri_units.flock.*', () => { load() }, [load])

  const readyToHarvest = flocks.filter((f) => (f.days_to_harvest ?? 999) <= 7).length
  const withWithdrawal = flocks.filter((f) => f.withdrawal_alerts.length > 0).length

  if (loading) {
    return (
      <Page>
        <PageBody>
          <div className="text-sm text-muted-foreground py-8 text-center">Cargando datos de producción...</div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Programa de Cosecha"
        description={`${flocks.length} lote${flocks.length !== 1 ? 's' : ''} activo${flocks.length !== 1 ? 's' : ''}${readyToHarvest > 0 ? ` · ${readyToHarvest} próximo(s) a cosechar` : ''}${withWithdrawal > 0 ? ` · ⚠ ${withWithdrawal} con retiro activo` : ''}`}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4 mr-2" /> Actualizar
          </Button>
        }
      />
      <PageBody>
        {flocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-3">🐔</div>
            <div className="text-sm">Sin lotes activos en este momento.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {flocks.map((f) => {
              const isUrgent   = f.days_to_harvest != null && f.days_to_harvest <= 7 && f.days_to_harvest >= 0
              const isOverdue  = f.days_to_harvest != null && f.days_to_harvest < 0
              const hasBlock   = f.withdrawal_alerts.length > 0
              const kpis       = f.kpis

              // Border color based on urgency/status
              const borderClass = hasBlock
                ? 'border-status-error-border'
                : isOverdue
                ? 'border-status-warning-border'
                : isUrgent
                ? 'border-status-info-border'
                : 'border-border'

              return (
                <div
                  key={f.id}
                  className={`border ${borderClass} rounded-xl p-4 bg-card cursor-pointer hover:shadow-sm transition-shadow`}
                  onClick={() => router.push(`/backend/agri-units/${f.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: identity */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold">{f.flock_number}</span>
                        <span className="text-muted-foreground text-sm">{SPECIES_LABEL[f.species] ?? f.species}{f.genetic_line ? ` · ${f.genetic_line}` : ''}</span>
                        <span className="text-xs text-muted-foreground">· {f.farm_unit_name}</span>
                      </div>

                      {/* Alerts row */}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {hasBlock && (
                          <span className="text-xs bg-status-error-bg text-status-error-text px-2 py-0.5 rounded-full">
                            🚫 Retiro activo — {f.withdrawal_alerts.map((a) => `${a.medication_name} hasta ${new Date(a.withdrawal_end_date).toLocaleDateString('es-VE')}`).join(', ')}
                          </span>
                        )}
                        {isUrgent && !hasBlock && (
                          <span className="text-xs bg-status-info-bg text-status-info-text px-2 py-0.5 rounded-full">
                            🗓 Cosecha en {f.days_to_harvest} días
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-xs bg-status-warning-bg text-status-warning-text px-2 py-0.5 rounded-full">
                            ⏰ Cosecha estimada hace {Math.abs(f.days_to_harvest!)} días
                          </span>
                        )}
                        {!kpis?.has_weekly_records && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-dashed">
                            Sin registros semanales aún
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: KPI grid */}
                    <div className="shrink-0 grid grid-cols-4 gap-3 text-right">
                      <div>
                        <div className="text-xs text-muted-foreground">Días</div>
                        <div className="font-bold">{kpis?.days_in_cycle ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">FCA</div>
                        <FcaBadge fca={kpis?.fca ?? null} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">IEP</div>
                        <div className={`font-bold ${kpis?.iep != null && kpis.iep >= 300 ? 'text-status-success-text' : kpis?.iep != null && kpis.iep >= 250 ? '' : kpis?.iep != null ? 'text-status-warning-text' : 'text-muted-foreground'}`}>
                          {kpis?.iep != null ? kpis.iep.toFixed(0) : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Viab.</div>
                        <div className="font-bold">
                          {kpis?.viability_pct != null ? `${kpis.viability_pct.toFixed(1)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: dates + count + weight */}
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Entrada: <span className="font-medium text-foreground">{new Date(f.start_date).toLocaleDateString('es-VE')}</span></span>
                    <span>Aves vivas: <span className="font-medium text-foreground">{(kpis?.live_count ?? f.initial_count).toLocaleString('es-VE')}</span></span>
                    {kpis?.avg_body_weight_g && (
                      <span>Peso prom.: <span className="font-medium text-foreground">{kpis.avg_body_weight_g.toLocaleString('es-VE')} g</span></span>
                    )}
                    {kpis?.projected_weight_kg && (
                      <span>Proyec. día 42: <span className="font-semibold text-primary">{kpis.projected_weight_kg.toFixed(3)} kg</span></span>
                    )}
                    {f.planned_end_date && (
                      <span className="ml-auto">
                        Cosecha: <span className="font-medium text-foreground">{new Date(f.planned_end_date).toLocaleDateString('es-VE')}</span>
                        {f.days_to_harvest != null && (
                          <span className={`ml-1 ${f.days_to_harvest < 0 ? 'text-status-warning-text' : f.days_to_harvest <= 7 ? 'text-status-info-text' : 'text-muted-foreground'}`}>
                            ({f.days_to_harvest < 0 ? `${Math.abs(f.days_to_harvest)}d atrasado` : `${f.days_to_harvest}d`})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-status-error-border bg-status-error-bg" /> Retiro activo (no puede beneficiarse)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-status-info-border bg-status-info-bg" /> Cosecha próxima (≤7 días)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-status-warning-border bg-status-warning-bg" /> Cosecha estimada pasada</span>
          <span className="flex items-center gap-1.5">IEP ≥ 300 = excelente · FCA ≤ 1.9 = excelente</span>
        </div>
      </PageBody>
    </Page>
  )
}
