'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, Zap, ZapOff } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type OutageRow = { id: string; started_at: string; ended_at: string | null; duration_hrs: string | null; outage_type: string; zone: string | null; used_generator: boolean; fuel_cost_usd: string | null; impact_production_hrs_lost: string | null }
type ConsumRow  = { id: string; record_date: string; shift_type: string; work_center_name: string; kwh_consumed: string; energy_source: string; total_energy_cost_usd: string | null; generator_hrs: string }

const OUTAGE_LABEL: Record<string, string> = { scheduled_restriction: 'Restricción programada', unscheduled_cut: 'Corte no programado', voltage_fluctuation: 'Fluctuación de voltaje', complete_blackout: 'Apagón total' }
const OUTAGE_VARIANT: Record<string, 'warning' | 'error' | 'neutral'> = { scheduled_restriction: 'warning', unscheduled_cut: 'error', voltage_fluctuation: 'warning', complete_blackout: 'error' }
const SOURCE_LABEL: Record<string, string> = { grid: '⚡ Red CORPOELEC', generator: '🔋 Generador', mixed: '⚡+🔋 Mixto' }
const SHIFT_LABEL: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' }

export default function MfgEnergyPage() {
  const { runMutation } = useGuardedMutation()
  const [outages, setOutages]  = React.useState<OutageRow[]>([])
  const [consums, setConsums]  = React.useState<ConsumRow[]>([])
  const [isLoading, setLoad]   = React.useState(true)
  const [showOutageForm, setOF] = React.useState(false)
  const [showConsumForm, setCF] = React.useState(false)
  const [activeTab, setTab]    = React.useState<'outages' | 'consumption'>('outages')

  const load = React.useCallback(async () => {
    setLoad(true)
    const [outRes, conRes] = await Promise.all([
      apiCall<{ items: OutageRow[] }>('/api/mfg-energy/power-outages?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: ConsumRow[] }>('/api/mfg-energy/energy-consumption?pageSize=90', undefined, { fallback: { items: [] } }),
    ])
    if (outRes.ok) setOutages(outRes.result?.items ?? [])
    if (conRes.ok) setConsums(conRes.result?.items ?? [])
    setLoad(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleEndOutage = (outage: OutageRow) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_energy.outage', recordId: outage.id },
      mutationPayload: async () => {
        const now     = new Date().toISOString()
        const durationMs = Date.now() - new Date(outage.started_at).getTime()
        const durationHrs = (durationMs / 3600000).toFixed(4)
        await apiCallOrThrow('/api/mfg-energy/power-outages', {
          method: 'PUT',
          body: JSON.stringify({ id: outage.id, ended_at: now, duration_hrs: durationHrs }),
        })
        flash(`Corte registrado: ${durationHrs}h`, 'info')
        load()
      },
    })
  }

  // Stats
  const activeOutage    = outages.find((o) => !o.ended_at)
  const totalOutageHrs  = outages.reduce((s, o) => s + Number(o.duration_hrs ?? 0), 0)
  const generatorOutageHrs = outages.filter((o) => o.used_generator).reduce((s, o) => s + Number(o.duration_hrs ?? 0), 0)
  const totalFuelCost   = outages.reduce((s, o) => s + Number(o.fuel_cost_usd ?? 0), 0)
  const totalGridKwh    = consums.filter((c) => c.energy_source === 'grid').reduce((s, c) => s + Number(c.kwh_consumed), 0)
  const totalGenKwh     = consums.filter((c) => c.energy_source === 'generator').reduce((s, c) => s + Number(c.kwh_consumed), 0)
  const totalEnergyCost = consums.reduce((s, c) => s + Number(c.total_energy_cost_usd ?? 0), 0)

  const outageCols: ColumnDef<OutageRow>[] = [
    { id: 'type_date', header: 'Corte', cell: ({ row }) => (
      <div>
        <StatusBadge variant={OUTAGE_VARIANT[row.original.outage_type] ?? 'neutral'}>
          {OUTAGE_LABEL[row.original.outage_type] ?? row.original.outage_type}
        </StatusBadge>
        <div className="text-xs text-muted-foreground mt-0.5">{new Date(row.original.started_at).toLocaleString('es-VE')}</div>
      </div>
    )},
    { id: 'duration', header: 'Duración', cell: ({ row }) => {
      if (!row.original.ended_at) return <StatusBadge variant="error" dot>En curso</StatusBadge>
      return <span className="font-semibold">{Number(row.original.duration_hrs).toFixed(2)}h</span>
    }},
    { id: 'zone_generator', header: 'Zona / Generador', cell: ({ row }) => (
      <div>
        <span className="text-sm">{row.original.zone ?? 'Sin zona'}</span>
        {row.original.used_generator && (
          <div className="text-xs text-status-warning-text">🔋 Generador activado{row.original.fuel_cost_usd ? ` · USD ${Number(row.original.fuel_cost_usd).toFixed(2)} combustible` : ''}</div>
        )}
      </div>
    )},
    { id: 'impact', header: 'Impacto producción', cell: ({ row }) => row.original.impact_production_hrs_lost ? `${row.original.impact_production_hrs_lost}h perdidas` : '—' },
    { id: 'actions', cell: ({ row }) => !row.original.ended_at ? (
      <Button type="button" size="sm" onClick={() => handleEndOutage(row.original)}>
        <Zap className="size-3 mr-1" /> Registrar fin
      </Button>
    ) : null },
  ]

  const consumCols: ColumnDef<ConsumRow>[] = [
    { id: 'date_shift', header: 'Fecha / Turno', cell: ({ row }) => (
      <div>
        <span className="font-semibold text-sm">{new Date(row.original.record_date).toLocaleDateString('es-VE')}</span>
        <div className="text-xs text-muted-foreground">{SHIFT_LABEL[row.original.shift_type] ?? row.original.shift_type} · {row.original.work_center_name}</div>
      </div>
    )},
    { id: 'consumption', header: 'Consumo / Fuente', cell: ({ row }) => (
      <div>
        <span className="font-semibold">{Number(row.original.kwh_consumed).toLocaleString('es-VE', { minimumFractionDigits: 2 })} kWh</span>
        <div className="text-xs">{SOURCE_LABEL[row.original.energy_source] ?? row.original.energy_source}
        {Number(row.original.generator_hrs) > 0 && ` · ${row.original.generator_hrs}h generador`}</div>
      </div>
    )},
    { id: 'cost', header: 'Costo energía', cell: ({ row }) => row.original.total_energy_cost_usd ? `USD ${Number(row.original.total_energy_cost_usd).toFixed(2)}` : '—' },
  ]

  return (
    <Page>
      <PageHeader
        title="Gestión de Energía Eléctrica"
        description={activeOutage ? '⚡ CORTE ACTIVO EN CURSO' : `${totalOutageHrs.toFixed(1)}h de cortes · USD ${totalFuelCost.toFixed(0)} en combustible`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOF(!showOutageForm)}>
              <ZapOff className="size-4 mr-2" /> Registrar corte
            </Button>
            <Button type="button" variant="outline" onClick={() => setCF(!showConsumForm)}>
              <Plus className="size-4 mr-2" /> Registrar consumo
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* Active outage alert */}
        {activeOutage && (
          <div className="mb-4 p-4 bg-status-error-bg border border-status-error-border rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZapOff className="size-5 text-status-error-icon" />
                <div>
                  <p className="font-bold text-status-error-text">CORTE ELÉCTRICO ACTIVO</p>
                  <p className="text-sm text-status-error-text">
                    {OUTAGE_LABEL[activeOutage.outage_type] ?? activeOutage.outage_type}
                    {activeOutage.zone && ` · ${activeOutage.zone}`}
                    · Inicio: {new Date(activeOutage.started_at).toLocaleString('es-VE')}
                  </p>
                </div>
              </div>
              <Button type="button" size="sm" onClick={() => handleEndOutage(activeOutage)}>
                <Zap className="size-4 mr-2" /> Registrar fin del corte
              </Button>
            </div>
          </div>
        )}

        {/* KPI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Total horas cortes</div>
            <div className={`text-2xl font-bold ${totalOutageHrs > 8 ? 'text-status-error-text' : ''}`}>{totalOutageHrs.toFixed(1)}h</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Horas en generador</div>
            <div className="text-2xl font-bold text-status-warning-text">{generatorOutageHrs.toFixed(1)}h</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Combustible generador</div>
            <div className="text-2xl font-bold">USD {totalFuelCost.toFixed(0)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Red {totalGridKwh.toFixed(0)} kWh / Gen {totalGenKwh.toFixed(0)} kWh</div>
            <div className="text-2xl font-bold">USD {totalEnergyCost.toFixed(0)}</div>
          </div>
        </div>

        {/* Outage form */}
        {showOutageForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ZapOff className="size-4" /> Registrar Corte Eléctrico</h3>
            <CrudForm entityId="mfg_energy.outage" apiPath="/api/mfg-energy/power-outages" mode="create"
              initial={{ started_at: new Date().toISOString().slice(0, 16) }}
              fields={[
                { type: 'select' as const, id: 'outage_type', label: 'Tipo de corte', required: true, options: [
                  { value: 'unscheduled_cut', label: 'Corte no programado (CORPOELEC)' },
                  { value: 'scheduled_restriction', label: 'Restricción programada (CORPOELEC)' },
                  { value: 'voltage_fluctuation', label: 'Fluctuación de voltaje' },
                  { value: 'complete_blackout', label: 'Apagón total' },
                ]},
                { type: 'datetime-local' as const, id: 'started_at', label: 'Hora de inicio del corte', required: true },
                { type: 'datetime-local' as const, id: 'ended_at',   label: 'Hora de fin (dejar vacío si sigue activo)' },
                { type: 'text' as const, id: 'zone', label: 'Zona CORPOELEC (opcional)' },
                { type: 'text' as const, id: 'impact_production_hrs_lost', label: 'Horas de producción perdidas' },
                { type: 'text' as const, id: 'products_affected', label: 'Líneas / productos afectados' },
                { type: 'text' as const, id: 'generator_fuel_liters', label: 'Litros de combustible en generador' },
                { type: 'text' as const, id: 'fuel_cost_usd', label: 'Costo del combustible (USD)' },
              ]}
              onSuccess={() => { flash('Corte registrado', 'info'); setOF(false); load() }}
            />
          </div>
        )}

        {/* Consumption form */}
        {showConsumForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="size-4" /> Registrar Consumo Eléctrico</h3>
            <CrudForm entityId="mfg_energy.consumption" apiPath="/api/mfg-energy/energy-consumption" mode="create"
              initial={{ record_date: new Date().toISOString().split('T')[0], shift_type: 'morning', energy_source: 'grid' }}
              fields={[
                { type: 'date' as const,   id: 'record_date',           label: 'Fecha', required: true },
                { type: 'select' as const, id: 'shift_type',            label: 'Turno', required: true, options: [{ value: 'morning', label: 'Mañana' }, { value: 'afternoon', label: 'Tarde' }, { value: 'night', label: 'Noche' }] },
                { type: 'text' as const,   id: 'work_center_code',      label: 'Código de línea/equipo', required: true },
                { type: 'text' as const,   id: 'work_center_name',      label: 'Nombre de la línea', required: true },
                { type: 'text' as const,   id: 'kwh_consumed',          label: 'kWh consumidos', required: true },
                { type: 'select' as const, id: 'energy_source',         label: 'Fuente', required: true, options: [{ value: 'grid', label: '⚡ Red CORPOELEC' }, { value: 'generator', label: '🔋 Generador propio' }, { value: 'mixed', label: '⚡+🔋 Mixto' }] },
                { type: 'text' as const,   id: 'generator_hrs',         label: 'Horas en generador (si aplica)' },
                { type: 'text' as const,   id: 'cost_per_kwh_usd',      label: 'Tarifa USD/kWh' },
                { type: 'text' as const,   id: 'generator_fuel_cost_usd', label: 'Costo combustible generador (USD)' },
              ]}
              onSuccess={() => { flash('Consumo registrado', 'success'); setCF(false); load() }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <Button type="button" size="sm" variant={activeTab === 'outages' ? 'default' : 'outline'} onClick={() => setTab('outages')}>Cortes CORPOELEC ({outages.length})</Button>
          <Button type="button" size="sm" variant={activeTab === 'consumption' ? 'default' : 'outline'} onClick={() => setTab('consumption')}>Consumo ({consums.length})</Button>
        </div>

        {activeTab === 'outages' && (
          <DataTable entityId="mfg_energy.outage" extensionTableId="mfg-energy-outages" data={outages} columns={outageCols} isLoading={isLoading}
            emptyState={{ label: 'Sin cortes registrados', description: 'Registra los cortes de CORPOELEC para analizar su impacto en producción.' }}
            stickyActionsColumn />
        )}
        {activeTab === 'consumption' && (
          <DataTable entityId="mfg_energy.consumption" extensionTableId="mfg-energy-consumption" data={consums} columns={consumCols} isLoading={isLoading}
            emptyState={{ label: 'Sin registros de consumo', description: 'Registra el consumo eléctrico por turno para calcular el costo energético por unidad producida.' }} />
        )}
      </PageBody>
    </Page>
  )
}
