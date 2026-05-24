'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { ArrowLeft, Plus, RefreshCw, Syringe } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollo de Engorde', layer: 'Gallina Ponedora', turkey: 'Pavo',
  swine: 'Cerdo', bovine: 'Bovino',
}

function KpiCard({ label, value, unit, highlight }: {
  label: string; value: string | number | null; unit?: string; highlight?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value != null ? value : '—'}
        {value != null && unit && (
          <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
        )}
      </div>
    </div>
  )
}

export default function FlockDetailPage() {
  const params   = useParams<{ id: string }>()
  const router   = useRouter()
  const flockId  = params.id

  const [state, setState]       = React.useState<PageState>('loading')
  const [flock, setFlock]       = React.useState<any>(null)
  const [kpis, setKpis]         = React.useState<any>(null)
  const [records, setRecords]   = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)

  // Vaccination program state
  const [vacPrograms, setVacPrograms]     = React.useState<{ id: string; name: string; species: string }[]>([])
  const [selectedProgram, setSelProgram]  = React.useState('')
  const [showVacDialog, setVacDialog]     = React.useState(false)
  const [applyingProgram, setApplying]    = React.useState(false)

  // Cost breakdown state
  const [costData, setCostData]           = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setState('loading')
    const [flockRes, kpisRes, recRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/agri-units/flocks?id=${flockId}`),
      apiCall<any>(`/api/agri-units/flock-kpis?flock_id=${flockId}`, undefined, { fallback: null }),
      apiCall<{ items: any[] }>(`/api/agri-units/flock-weekly-records?flock_id=${flockId}&pageSize=52`, undefined, { fallback: { items: [] } }),
    ])
    const flockItem = (flockRes.result?.items ?? [])[0] ?? null
    if (!flockItem) { setState('notFound'); return }
    setFlock(flockItem)
    if (kpisRes.ok && kpisRes.result) setKpis(kpisRes.result)
    setRecords((recRes.result?.items ?? []).sort((a: any, b: any) => b.week_number - a.week_number))

    // Load vaccination programs for apply-program dialog
    const progRes = await apiCall<{ items: any[] }>('/api/agri-vet/vaccination-programs?is_active=true&pageSize=20', undefined, { fallback: { items: [] } })
    setVacPrograms((progRes.result?.items ?? []).map((p: any) => ({ id: p.id, name: p.name, species: p.species })))

    // Load cost breakdown
    const costRes = await apiCall<any>(`/api/agri-units/flock-cost-breakdown?flock_id=${flockId}`, undefined, { fallback: null })
    if (costRes.ok && costRes.result) setCostData(costRes.result)

    setState('ready')
  }, [flockId])

  React.useEffect(() => { load() }, [load])

  const weeklyColumns: ColumnDef<any>[] = [
    { accessorKey: 'week_number', header: 'Sem.' },
    {
      accessorKey: 'record_date',
      header: 'Fecha',
      cell: ({ row }) => new Date((row.original as any).record_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'live_count',
      header: 'Vivas',
      cell: ({ row }) => ((row.original as any).live_count as number).toLocaleString('es-VE'),
    },
    {
      accessorKey: 'weekly_mortality',
      header: 'Muertes',
      cell: ({ row }) => {
        const mort = (row.original as any).weekly_mortality as number
        return <span className={mort > 0 ? 'text-status-error-text font-semibold' : ''}>{mort}</span>
      },
    },
    {
      accessorKey: 'avg_body_weight_g',
      header: 'Peso prom. (g)',
      cell: ({ row }) => ((row.original as any).avg_body_weight_g as number).toLocaleString('es-VE'),
    },
    { accessorKey: 'weekly_feed_kg',   header: 'Alimento sem. (kg)' },
    {
      accessorKey: 'fca_accumulated',
      header: 'FCA acum.',
      cell: ({ row }) => (row.original as any).fca_accumulated ?? '—',
    },
    {
      accessorKey: 'iep',
      header: 'IEP',
      cell: ({ row }) => (row.original as any).iep ?? '—',
    },
    {
      accessorKey: 'house_temp_avg_c',
      header: 'Temp. (°C)',
      cell: ({ row }) => (row.original as any).house_temp_avg_c ?? '—',
    },
  ]

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando lote..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-units')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Lotes
        </Button>
        <ErrorMessage label="Lote no encontrado o sin acceso." />
      </PageBody>
    </Page>
  )

  const nextWeek = records.length > 0 ? ((records[0] as any).week_number as number) + 1 : 1

  const handleApplyProgram = async () => {
    if (!selectedProgram) return
    setApplying(true)
    try {
      const res = await apiCallOrThrow('/api/agri-vet/apply-program', {
        method: 'POST',
        body: JSON.stringify({ flock_id: flockId, program_id: selectedProgram }),
      })
      const data = res as any
      flash(`${data.created} vacunaciones programadas automáticamente (${data.program_name})`, 'success')
      setVacDialog(false)
      setSelProgram('')
    } catch (err: any) {
      const msg = err?.message ?? 'Error al aplicar el programa'
      if (msg.includes('PROGRAM_ALREADY_APPLIED')) {
        flash('Este programa ya fue aplicado a este lote', 'warning')
      } else {
        flash(msg, 'error')
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title={flock.flock_number}
        description={`${SPECIES_LABEL[flock.species as string] ?? flock.species}${flock.genetic_line ? ` · ${flock.genetic_line}` : ''} · ${(flock.initial_count as number).toLocaleString('es-VE')} aves`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-units')}>
              <ArrowLeft className="mr-2 size-4" /> Lotes
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-4" />
            </Button>
            {flock.status === 'active' && vacPrograms.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setVacDialog(!showVacDialog)}>
                <Syringe className="size-4 mr-2" /> Aplicar programa
              </Button>
            )}
            {flock.status === 'active' && (
              <Button type="button" onClick={() => setShowForm(!showForm)}>
                <Plus className="size-4 mr-2" /> Sem. {nextWeek}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>

        {/* Vaccination program apply dialog */}
        {showVacDialog && flock.status === 'active' && (
          <div className="mb-4 border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center gap-2 mb-3">
              <Syringe className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Aplicar Programa de Vacunación</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Selecciona el programa de vacunación para este lote. El sistema generará automáticamente todas las vacunaciones programadas con sus fechas calculadas desde la fecha de entrada de los pollitos.
            </p>
            <div className="flex items-center gap-3">
              <Select value={selectedProgram} onValueChange={setSelProgram}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Selecciona un programa..." />
                </SelectTrigger>
                <SelectContent>
                  {vacPrograms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.species})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleApplyProgram} disabled={!selectedProgram || applyingProgram}>
                <Syringe className="size-4 mr-2" />
                {applyingProgram ? 'Aplicando...' : 'Aplicar y generar calendario'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setVacDialog(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Días en ciclo"        value={kpis.days_in_cycle} />
            <KpiCard label="FCA acumulado"        value={kpis.fca}                           highlight />
            <KpiCard label="IEP"                  value={kpis.iep}                           highlight />
            <KpiCard label="Viabilidad"           value={kpis.viability_pct != null ? `${(kpis.viability_pct as number).toFixed(2)}` : null} unit="%" />
            <KpiCard label="Aves vivas"           value={(kpis.live_count as number).toLocaleString('es-VE')} />
            <KpiCard label="Peso promedio"        value={kpis.avg_body_weight_g}             unit="g" />
            <KpiCard label="Alimento acumulado"   value={kpis.cumulative_feed_kg}            unit="kg" />
            <KpiCard label="Peso proy. día 42"    value={kpis.projected_weight_kg != null ? (kpis.projected_weight_kg as number).toFixed(3) : null} unit="kg" />
          </div>
        )}

        {/* Status banner */}
        {flock.status !== 'active' && (
          <div className="mb-4 p-3 bg-status-neutral-bg border border-status-neutral-border rounded-lg">
            <StatusBadge variant="neutral" dot>
              {flock.status === 'completed' ? 'Lote completado' : 'Lote terminado anticipadamente'}
            </StatusBadge>
          </div>
        )}

        {/* Inline form for new weekly record */}
        {showForm && flock.status === 'active' && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registro Semana {nextWeek}</h3>
            <CrudForm
              entityId="agri_units.flock_weekly_record"
              mode="create"
              initial={{ week_number: nextWeek }}
              fields={[
                { type: 'number',   name: 'week_number',              label: 'Semana',                  required: true },
                { type: 'date',     name: 'record_date',              label: 'Fecha de registro',        required: true },
                { type: 'number',   name: 'live_count',               label: 'Aves vivas',               required: true },
                { type: 'number',   name: 'weekly_mortality',         label: 'Muertes esta semana',      required: true },
                { type: 'number',   name: 'cumulative_mortality',     label: 'Mortalidad acumulada',     required: true },
                { type: 'number',   name: 'avg_body_weight_g',        label: 'Peso promedio (g)',         required: true },
                { type: 'text',     name: 'weekly_feed_kg',           label: 'Alimento semanal (kg)',     required: true },
                { type: 'text',     name: 'cumulative_feed_kg',       label: 'Alimento acumulado (kg)',   required: true },
                { type: 'text',     name: 'house_temp_avg_c',         label: 'Temp. galpón prom. (°C)' },
                { type: 'text',     name: 'house_humidity_avg_pct',   label: 'Humedad relativa (%)' },
                { type: 'text',     name: 'water_consumption_liters', label: 'Consumo agua (L)' },
                { type: 'textarea', name: 'health_observations',      label: 'Observaciones sanitarias' },
              ]}
              groups={[
                { id: 'counts',      title: 'Conteos',        fields: ['week_number', 'record_date', 'live_count', 'weekly_mortality', 'cumulative_mortality'] },
                { id: 'production',  title: 'Producción',     fields: ['avg_body_weight_g', 'weekly_feed_kg', 'cumulative_feed_kg'] },
                { id: 'environment', title: 'Ambiente',       fields: ['house_temp_avg_c', 'house_humidity_avg_pct', 'water_consumption_liters', 'health_observations'] },
              ]}
              onSubmit={async (values) => {
                await apiCallOrThrow('/api/agri-units/flock-weekly-records', {
                  method: 'POST',
                  body: JSON.stringify({ ...values, flock_id: flockId }),
                })
                flash('Registro semanal guardado', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        {/* Cost Breakdown Section */}
        {costData && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Costo de Producción</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Costo total acumulado</div>
                <div className="text-2xl font-bold text-primary">USD {costData.total_cost_usd}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Costo por kg vivo</div>
                <div className="text-2xl font-bold">
                  {costData.cost_per_kg_live_usd
                    ? `USD ${costData.cost_per_kg_live_usd}`
                    : <span className="text-muted-foreground">—</span>}
                </div>
                {costData.cost_per_kg_live_ves && costData.bcv_rate && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ≈ Bs {Number(costData.cost_per_kg_live_ves).toLocaleString('es-VE')} (BCV {Number(costData.bcv_rate).toFixed(2)})
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Biomasa viva</div>
                <div className="text-2xl font-bold">{costData.live_biomass_kg} kg</div>
              </div>
            </div>

            {/* Cost breakdown bars */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="space-y-3">
                {/* Feed */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">Alimento</span>
                    <span className="font-semibold">USD {costData.breakdown.feed.cost_usd} <span className="text-muted-foreground font-normal">({costData.breakdown.feed.pct_total}%)</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, Number(costData.breakdown.feed.pct_total) || 0)}%` }}
                    />
                  </div>
                </div>
                {/* Inputs */}
                {Number(costData.breakdown.inputs.cost_usd) > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">Veterinario / Insumos</span>
                      <span className="font-semibold">USD {costData.breakdown.inputs.cost_usd} <span className="text-muted-foreground font-normal">({costData.breakdown.inputs.pct_total}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-warning-bg rounded-full border border-status-warning-border"
                        style={{ width: `${Math.min(100, Number(costData.breakdown.inputs.pct_total) || 0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {costData.breakdown.feed.details.length === 0 && Number(costData.total_cost_usd) === 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Sin datos de costo disponibles. Asigna lotes de alimento a este flock en el módulo Alimento Balanceado.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Weekly records table */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Registros Semanales ({records.length})</h3>
          <DataTable
            entityId="agri_units.flock_weekly_record"
            extensionTableId="agri-flock-weekly-records"
            data={records}
            columns={weeklyColumns}
            isLoading={false}
            emptyState="Sin registros semanales"
          />
        </div>
      </PageBody>
    </Page>
  )
}
