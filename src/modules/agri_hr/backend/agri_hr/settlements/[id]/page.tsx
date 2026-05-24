'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'

type PageState = 'loading' | 'notFound' | 'ready'

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'neutral'> = {
  calculated: 'info', approved: 'success', paid: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  calculated: 'Calculada — pendiente de aprobación',
  approved: 'Aprobada — pendiente de pago',
  paid: 'Pagada',
}

function Row({ label, value, highlight }: { label: string; value: string | number | null; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function SettlementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState]          = React.useState<PageState>('loading')
  const [settlement, setSettlement] = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(
      `/api/agri-hr/producer-settlements?id=${params.id}`,
    )
    const item = (res.result?.items ?? [])[0] ?? null
    if (!item) { setState('notFound'); return }
    setSettlement(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando liquidación..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-hr/settlements')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Liquidaciones
      </Button>
      <ErrorMessage message="Liquidación no encontrada." />
    </PageBody></Page>
  )

  const s = settlement

  // Calculate viability from birds
  const viabilityPct = s.initial_birds > 0
    ? ((s.final_birds / s.initial_birds) * 100).toFixed(2)
    : null

  // FCA comparison
  const fcaActual = Number(s.actual_fca)
  const fcaTarget = Number(s.target_fca)
  const fcaGood   = fcaActual <= fcaTarget

  // Weight comparison
  const weightActual = Number(s.actual_avg_weight_kg)
  const weightTarget = Number(s.target_weight_kg)
  const weightGood   = weightActual >= weightTarget

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-hr/settlements')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> Liquidaciones
        </Button>

        <div className="max-w-2xl space-y-4">
          {/* Header */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold">Liquidación — Ciclo</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(s.cycle_start_date).toLocaleDateString('es-VE')} →{' '}
                  {new Date(s.cycle_end_date).toLocaleDateString('es-VE')}
                </p>
              </div>
              <StatusBadge variant={STATUS_VARIANT[s.status] ?? 'neutral'} dot>
                {STATUS_LABEL[s.status] ?? s.status}
              </StatusBadge>
            </div>

            {/* KPIs del ciclo */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={`p-3 rounded-lg ${fcaGood ? 'bg-status-success-bg' : 'bg-status-warning-bg'}`}>
                <p className="text-xs text-muted-foreground">FCA real</p>
                <p className={`text-xl font-bold ${fcaGood ? 'text-status-success-text' : 'text-status-warning-text'}`}>
                  {s.actual_fca}
                  <span className="text-xs ml-1 font-normal">objetivo: {s.target_fca}</span>
                </p>
              </div>
              <div className={`p-3 rounded-lg ${weightGood ? 'bg-status-success-bg' : 'bg-muted/30'}`}>
                <p className="text-xs text-muted-foreground">Peso promedio real</p>
                <p className={`text-xl font-bold ${weightGood ? 'text-status-success-text' : ''}`}>
                  {s.actual_avg_weight_kg} kg
                  <span className="text-xs ml-1 font-normal">objetivo: {s.target_weight_kg} kg</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Mortalidad</p>
                <p className="text-xl font-bold">{s.actual_mortality_pct}%</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Viabilidad</p>
                <p className="text-xl font-bold">{viabilityPct}%</p>
              </div>
            </div>

            {/* Desglose de pago */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Desglose del Pago
              </h3>
              <Row label="Precio base (USD/kg)"     value={`USD ${s.price_per_kg_usd}`} />
              <Row label="Aves finales"              value={s.final_birds.toLocaleString('es-VE')} />
              <Row label="Pago base"                 value={`USD ${s.base_payment_usd}`} />
              {Number(s.fca_bonus_usd) > 0 && (
                <Row label="Bonus FCA"               value={`+ USD ${s.fca_bonus_usd}`} />
              )}
              {Number(s.weight_bonus_usd) > 0 && (
                <Row label="Bonus peso"              value={`+ USD ${s.weight_bonus_usd}`} />
              )}
              {Number(s.fca_penalty_usd) > 0 && (
                <Row label="Penalización FCA"        value={`- USD ${s.fca_penalty_usd}`} />
              )}
              <div className="flex items-center justify-between pt-3 mt-1">
                <span className="text-sm font-bold">Total a pagar</span>
                <span className="text-xl font-bold text-primary">USD {s.total_payment_usd}</span>
              </div>
            </div>

            {s.payment_date && (
              <p className="text-xs text-status-success-text mt-2">
                Pagado el {new Date(s.payment_date).toLocaleDateString('es-VE')}
              </p>
            )}
            {s.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">{s.notes}</p>
            )}
          </div>

          {/* WorkflowApprovalWidget */}
          <WorkflowApprovalWidget
            workflowId="liquidacion_productor_v1"
            entityId={s.id}
            entityType="AgriProducerSettlement"
            title="Aprobación de Liquidación"
            startLabel="Enviar a revisión del técnico de campo"
            startContext={{
              settlement_id:       s.id,
              flock_id:            s.flock_id,
              actual_fca:          s.actual_fca,
              actual_avg_weight:   s.actual_avg_weight_kg,
              actual_mortality:    s.actual_mortality_pct,
              total_payment_usd:   s.total_payment_usd,
            }}
            decisions={[
              { value: 'approve',  label: 'Aprobar — proceder con el pago',   variant: 'default' },
              { value: 'adjust',   label: 'Ajustar montos — requiere recálculo', variant: 'outline' },
              { value: 'hold',     label: 'En espera — faltan datos',         variant: 'outline' },
            ]}
            onCompleted={() => load()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
