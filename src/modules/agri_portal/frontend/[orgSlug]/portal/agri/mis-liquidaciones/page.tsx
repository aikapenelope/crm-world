'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

type Props = { params: { orgSlug: string } }

type Settlement = {
  id: string; cycle_start_date: string; cycle_end_date: string
  actual_fca: string; actual_avg_weight_kg: string; actual_mortality_pct: string
  target_fca: string; base_payment_usd: string; fca_bonus_usd: string
  fca_penalty_usd: string; total_payment_usd: string; status: string; payment_date: string | null
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  calculated: { label: 'En revisión', color: 'bg-status-info-bg text-status-info-text' },
  approved:   { label: 'Aprobada', color: 'bg-status-warning-bg text-status-warning-text' },
  paid:       { label: 'Pagada', color: 'bg-status-success-bg text-status-success-text' },
}

export default function MisLiquidacionesPage({ params }: Props) {
  void params
  const [settlements, setSettlements] = React.useState<Settlement[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    apiCall<{ data: Settlement[] }>('/api/agri-portal/my-settlements?pageSize=20')
      .then(res => { if (res.ok && res.result?.data) setSettlements(res.result.data) })
      .finally(() => setLoading(false))
  }, [])

  const totalEarned = settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.total_payment_usd), 0)
  const pendingAmount = settlements.filter(s => s.status === 'approved').reduce((sum, s) => sum + Number(s.total_payment_usd), 0)

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Cargando liquidaciones...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Liquidaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial de pagos por ciclo de producción</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-status-success-bg border border-status-success-border rounded-xl p-4">
          <div className="text-xs text-status-success-text mb-1">Total cobrado</div>
          <div className="text-2xl font-bold text-status-success-text">USD {totalEarned.toFixed(2)}</div>
        </div>
        <div className="bg-status-warning-bg border border-status-warning-border rounded-xl p-4">
          <div className="text-xs text-status-warning-text mb-1">Pendiente por cobrar</div>
          <div className="text-2xl font-bold text-status-warning-text">USD {pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Settlements list */}
      {settlements.length === 0 ? (
        <div className="p-6 bg-muted/20 rounded-xl text-center text-sm text-muted-foreground">
          Aún no tienes liquidaciones registradas. Aparecerán aquí al finalizar tu primer ciclo de producción.
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map(s => {
            const badge = STATUS_BADGE[s.status] ?? { label: s.status, color: 'bg-muted text-muted-foreground' }
            const fcaVsTarget = Number(s.actual_fca) <= Number(s.target_fca)
            return (
              <div key={s.id} className="border border-border rounded-xl p-4 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Ciclo</div>
                    <div className="font-semibold text-sm">
                      {new Date(s.cycle_start_date).toLocaleDateString('es-VE')} — {new Date(s.cycle_end_date).toLocaleDateString('es-VE')}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <div className="text-xs text-muted-foreground">FCA real</div>
                    <div className={`font-semibold ${fcaVsTarget ? 'text-status-success-text' : 'text-status-warning-text'}`}>
                      {s.actual_fca} {fcaVsTarget ? '✓' : '↑'}
                    </div>
                    <div className="text-xs text-muted-foreground">objetivo: {s.target_fca}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Peso promedio</div>
                    <div className="font-semibold">{s.actual_avg_weight_kg} kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mortalidad</div>
                    <div className="font-semibold">{s.actual_mortality_pct}%</div>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Base: USD {s.base_payment_usd}
                    {Number(s.fca_bonus_usd) > 0 && <span className="text-status-success-text ml-2">+USD {s.fca_bonus_usd} bonus</span>}
                    {Number(s.fca_penalty_usd) > 0 && <span className="text-status-error-text ml-2">-USD {s.fca_penalty_usd}</span>}
                  </div>
                  <div className="text-lg font-bold">USD {s.total_payment_usd}</div>
                </div>

                {s.status === 'paid' && s.payment_date && (
                  <div className="mt-2 text-xs text-status-success-text">
                    Pagado el {new Date(s.payment_date).toLocaleDateString('es-VE')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
