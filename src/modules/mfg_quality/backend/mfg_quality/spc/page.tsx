'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, RefreshCw } from 'lucide-react'

type PlanRow = {
  id: string; product_code: string; product_name: string; parameter_name: string
  parameter_unit: string; lsl: string | null; usl: string | null
  lcl: string | null; ucl: string | null; target: string | null
  is_critical_control_point: boolean
}

type SpcPoint = {
  id: string; subgroup_id: string; subgroup_date: string; sample_count: number
  subgroup_mean: string; subgroup_range: string; is_out_of_control: boolean; rule_violated: string | null
}

// ── SVG Control Chart ──────────────────────────────────────────────────────────

const W = 640
const H = 140
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

function ControlChart({
  points,
  getValue,
  ucl,
  cl,
  lcl,
  usl,
  lsl,
  label,
  unit,
}: {
  points: SpcPoint[]
  getValue: (p: SpcPoint) => number
  ucl: number | null
  cl: number | null
  lcl: number | null
  usl?: number | null
  lsl?: number | null
  label: string
  unit: string
}) {
  if (points.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4 bg-muted/10 text-center">
        <p className="text-sm text-muted-foreground">Sin datos de subgrupos para esta carta.</p>
      </div>
    )
  }

  const values = points.map(getValue)
  const allLines = [ucl, cl, lcl, usl, lsl].filter(Boolean) as number[]
  const allVals  = [...values, ...allLines]
  const minVal   = Math.min(...allVals) * 0.98
  const maxVal   = Math.max(...allVals) * 1.02
  const range    = maxVal - minVal || 1

  const xScale = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * INNER_W
  const yScale = (v: number) => PAD.top + INNER_H - ((v - minVal) / range) * INNER_H

  const formatY = (v: number) => v.toFixed(v < 10 ? 3 : 1)

  const hLine = (v: number | null, color: string, dash?: string, label?: string) => {
    if (v == null) return null
    const y = yScale(v)
    return (
      <g key={`hline-${v}`}>
        <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke={color} strokeWidth={1} strokeDasharray={dash} opacity={0.8} />
        {label && (
          <text x={PAD.left - 2} y={y + 3} fontSize={8} textAnchor="end" fill={color} opacity={0.9}>{label}</text>
        )}
      </g>
    )
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(getValue(p))}`)
    .join(' ')

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex gap-3 text-xs text-muted-foreground">
          {ucl != null && <span>UCL: {formatY(ucl)} {unit}</span>}
          {cl  != null && <span>CL: {formatY(cl)} {unit}</span>}
          {lcl != null && <span>LCL: {formatY(lcl)} {unit}</span>}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-border rounded-lg bg-card">
        {/* Y axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const v = minVal + t * range
          const y = PAD.top + INNER_H - t * INNER_H
          return (
            <g key={t}>
              <line x1={PAD.left - 3} y1={y} x2={PAD.left} y2={y} stroke="#888" strokeWidth={0.5} />
              <text x={PAD.left - 5} y={y + 3} fontSize={8} textAnchor="end" fill="#888">{formatY(v)}</text>
            </g>
          )
        })}

        {/* Control + spec limits */}
        {hLine(usl,  '#ef4444', '4 2', 'USL')}
        {hLine(lsl,  '#ef4444', '4 2', 'LSL')}
        {hLine(ucl,  '#f97316', '3 2', 'UCL')}
        {hLine(lcl,  '#f97316', '3 2', 'LCL')}
        {hLine(cl,   '#3b82f6', undefined, 'CL')}

        {/* Data line */}
        <path d={pathD} stroke="#6b7280" strokeWidth={1.2} fill="none" />

        {/* Data points */}
        {points.map((p, i) => {
          const v = getValue(p)
          const x = xScale(i)
          const y = yScale(v)
          const outOfControl = p.is_out_of_control
          const outOfSpec    = usl != null && v > usl || lsl != null && v < lsl
          const color = outOfControl ? '#ef4444' : outOfSpec ? '#f97316' : '#3b82f6'
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r={outOfControl ? 5 : 3.5} fill={color} opacity={0.9} />
              {outOfControl && (
                <circle cx={x} cy={y} r={8} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.5} />
              )}
            </g>
          )
        })}

        {/* X axis labels — every ~5 points */}
        {points.map((p, i) => {
          if (points.length > 8 && i % Math.floor(points.length / 6) !== 0 && i !== points.length - 1) return null
          const x = xScale(i)
          const label = new Date(p.subgroup_date).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' })
          return (
            <text key={i} x={x} y={H - 4} fontSize={7} textAnchor="middle" fill="#888">{label}</text>
          )
        })}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#ccc" strokeWidth={0.5} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#ccc" strokeWidth={0.5} />
      </svg>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SpcPage() {
  const router = useRouter()
  const [plans, setPlans]           = React.useState<PlanRow[]>([])
  const [selectedPlanId, setSelected] = React.useState<string>('')
  const [selectedPlan, setSelectedPlan] = React.useState<PlanRow | null>(null)
  const [points, setPoints]         = React.useState<SpcPoint[]>([])
  const [isLoading, setLoading]     = React.useState(false)

  React.useEffect(() => {
    apiCall<{ items: PlanRow[] }>('/api/mfg-quality/quality-plans?pageSize=100', undefined, { fallback: { items: [] } })
      .then((res) => setPlans(res.result?.items ?? []))
  }, [])

  React.useEffect(() => {
    if (!selectedPlanId) return
    const plan = plans.find((p) => p.id === selectedPlanId) ?? null
    setSelectedPlan(plan)
    setLoading(true)
    apiCall<{ items: SpcPoint[] }>(`/api/mfg-quality/spc-charts?plan_id=${selectedPlanId}&pageSize=300`, undefined, { fallback: { items: [] } })
      .then((res) => {
        setPoints((res.result?.items ?? []).sort((a, b) => new Date(a.subgroup_date).getTime() - new Date(b.subgroup_date).getTime()))
        setLoading(false)
      })
  }, [selectedPlanId, plans])

  const outOfControlCount = points.filter((p) => p.is_out_of_control).length
  const totalPoints       = points.length

  const plan = selectedPlan

  // Compute process capability indices (simplified)
  let cpk: string | null = null
  if (plan && points.length >= 10 && plan.usl && plan.lsl) {
    const means = points.map((p) => Number(p.subgroup_mean))
    const avg   = means.reduce((s, v) => s + v, 0) / means.length
    const ranges = points.map((p) => Number(p.subgroup_range))
    const avgRange = ranges.reduce((s, v) => s + v, 0) / ranges.length
    // d2 for n=5 = 2.326
    const sigma = avgRange / 2.326
    if (sigma > 0) {
      const cpkU = (Number(plan.usl) - avg) / (3 * sigma)
      const cpkL = (avg - Number(plan.lsl)) / (3 * sigma)
      cpk = Math.min(cpkU, cpkL).toFixed(3)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Cartas de Control SPC"
        description={plan ? `${plan.product_code} — ${plan.parameter_name} (${plan.parameter_unit})` : 'Selecciona un plan de calidad'}
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-quality')}>
            <ArrowLeft className="mr-2 size-4" /> Calidad
          </Button>
        }
      />
      <PageBody>
        {/* Plan selector */}
        <div className="mb-6 flex items-center gap-3">
          <Select value={selectedPlanId} onValueChange={setSelected}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Seleccionar plan de calidad (producto + parámetro)" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.product_code} — {p.parameter_name} ({p.parameter_unit})
                  {p.is_critical_control_point && ' ⚠ PCC'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoading && <RefreshCw className="size-4 animate-spin text-muted-foreground" />}
        </div>

        {plan && (
          <div className="space-y-6 max-w-4xl">
            {/* Plan details + process capability */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {plan.lsl && (
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">LSL</p>
                  <p className="font-bold">{plan.lsl} {plan.parameter_unit}</p>
                </div>
              )}
              {plan.target && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-bold text-primary">{plan.target} {plan.parameter_unit}</p>
                </div>
              )}
              {plan.usl && (
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">USL</p>
                  <p className="font-bold">{plan.usl} {plan.parameter_unit}</p>
                </div>
              )}
              <div className={`border rounded-lg p-3 text-center ${outOfControlCount > 0 ? 'bg-status-error-bg border-status-error-border' : 'bg-status-success-bg border-status-success-border'}`}>
                <p className="text-xs text-muted-foreground">Fuera de control</p>
                <p className={`font-bold ${outOfControlCount > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>
                  {outOfControlCount} / {totalPoints}
                </p>
              </div>
              {cpk && (
                <div className={`border rounded-lg p-3 text-center ${Number(cpk) >= 1.33 ? 'bg-status-success-bg border-status-success-border' : Number(cpk) >= 1 ? 'bg-status-warning-bg border-status-warning-border' : 'bg-status-error-bg border-status-error-border'}`}>
                  <p className="text-xs text-muted-foreground">Cpk</p>
                  <p className={`font-bold ${Number(cpk) >= 1.33 ? 'text-status-success-text' : Number(cpk) >= 1 ? 'text-status-warning-text' : 'text-status-error-text'}`}>{cpk}</p>
                  <p className="text-xs opacity-60">{Number(cpk) >= 1.33 ? 'Capaz' : Number(cpk) >= 1 ? 'Marginal' : 'Incapaz'}</p>
                </div>
              )}
            </div>

            {/* CCP warning */}
            {plan.is_critical_control_point && (
              <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-sm text-status-warning-text">
                ⚠ <strong>Punto Crítico de Control (PCC)</strong> — Una desviación fuera de especificación genera No-Conformidad automática.
              </div>
            )}

            {points.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-border rounded-xl">
                <p className="text-sm">Sin datos de inspección para este plan.</p>
                <p className="text-xs mt-1">Registra inspecciones vía el endpoint <code>/api/mfg-quality/quality-inspections</code> con subgroup_id para acumular subgrupos.</p>
              </div>
            ) : (
              <>
                {/* X-bar chart */}
                <ControlChart
                  points={points}
                  getValue={(p) => Number(p.subgroup_mean)}
                  ucl={plan.ucl ? Number(plan.ucl) : null}
                  cl={plan.target ? Number(plan.target) : null}
                  lcl={plan.lcl ? Number(plan.lcl) : null}
                  usl={plan.usl ? Number(plan.usl) : null}
                  lsl={plan.lsl ? Number(plan.lsl) : null}
                  label={`Carta X̄ — ${plan.parameter_name}`}
                  unit={plan.parameter_unit}
                />

                {/* R chart */}
                <ControlChart
                  points={points}
                  getValue={(p) => Number(p.subgroup_range)}
                  ucl={null}
                  cl={null}
                  lcl={null}
                  label="Carta R — Rango del subgrupo"
                  unit={plan.parameter_unit}
                />

                {/* Out-of-control log */}
                {outOfControlCount > 0 && (
                  <div className="border border-status-error-border rounded-xl p-4 bg-status-error-bg/30">
                    <h3 className="text-sm font-semibold text-status-error-text mb-3">
                      Señales de Alarma ({outOfControlCount} subgrupos)
                    </h3>
                    <div className="space-y-2">
                      {points.filter((p) => p.is_out_of_control).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="font-mono text-xs">{new Date(p.subgroup_date).toLocaleDateString('es-VE')}</span>
                          <span>X̄={Number(p.subgroup_mean).toFixed(4)} · R={Number(p.subgroup_range).toFixed(4)}</span>
                          <StatusBadge variant="error">{p.rule_violated ?? 'Regla violada'}</StatusBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground p-3 bg-muted/10 rounded-lg">
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-400 inline-block" /> CL — Línea Central</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-orange-400 inline-block" /> UCL/LCL — Límites de Control Estadístico</span>
                  <span className="flex items-center gap-1"><span className="w-4 h-0.5 border-t-2 border-dashed border-red-400 inline-block" /> USL/LSL — Límites de Especificación</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Fuera de control (regla Western Electric)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Normal</span>
                </div>
              </>
            )}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
