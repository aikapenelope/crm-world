'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Thermometer, RefreshCw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type Unit = { id: string; name: string; unit_type: string; target_temp_min: string; target_temp_max: string; sensor_id: string | null }
type Reading = { id: string; temperature_c: string; humidity_pct: string | null; recorded_at: string; is_excursion: boolean; source: string }

const HOURS_OPTIONS = [
  { value: '1',  label: 'Última hora' },
  { value: '4',  label: 'Últimas 4 horas' },
  { value: '12', label: 'Últimas 12 horas' },
  { value: '24', label: 'Últimas 24 horas' },
  { value: '48', label: 'Últimas 48 horas' },
]

const SOURCE_LABEL: Record<string, string> = {
  sensor_push: 'Sensor', batch_upload: 'Batch IoT', manual: 'Manual',
}

/** Simple sparkline using inline SVG — no external chart libs */
function TempSparkline({ readings, min, max }: { readings: Reading[]; min: number; max: number }) {
  if (readings.length < 2) return null
  const sorted = [...readings].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
  const range = max - min || 1
  const W = 200; const H = 40
  const pts = sorted.map((r, i) => {
    const x = (i / (sorted.length - 1)) * W
    const y = H - ((Number(r.temperature_c) - min) / range) * H
    return `${x.toFixed(1)},${Math.max(0, Math.min(H, y)).toFixed(1)}`
  }).join(' ')
  // Min/max reference lines
  const minY = H
  const maxY = 0

  return (
    <svg width={W} height={H + 4} className="overflow-visible">
      {/* Target range band */}
      <rect x={0} y={maxY} width={W} height={minY - maxY} fill="var(--status-success-bg)" opacity={0.3} />
      {/* Temperature line */}
      <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth={1.5} />
      {/* Excursion dots */}
      {sorted.filter((r) => r.is_excursion).map((r, i) => {
        const xi = sorted.findIndex((s) => s.id === r.id)
        const x = (xi / (sorted.length - 1)) * W
        const y = H - ((Number(r.temperature_c) - min) / range) * H
        return <circle key={i} cx={x.toFixed(1)} cy={Math.max(0, Math.min(H, y)).toFixed(1)} r={3} fill="var(--status-error-icon)" />
      })}
    </svg>
  )
}

export default function TemperatureReadingsPage() {
  const [units, setUnits]           = React.useState<Unit[]>([])
  const [selectedUnitId, setUnitId] = React.useState('')
  const [hours, setHours]           = React.useState('24')
  const [readings, setReadings]     = React.useState<Reading[]>([])
  const [isLoading, setLoading]     = React.useState(false)
  const [showManual, setShowManual] = React.useState(false)
  const [manualValue, setManualValue] = React.useState('')
  const [submitting, setSubmitting]   = React.useState(false)

  // Load units on mount
  React.useEffect(() => {
    apiCall<{ items: Unit[] }>('/api/agri-cold-chain/cold-storage-units?pageSize=50', undefined, { fallback: { items: [] } })
      .then((res) => {
        const u = res.result?.items ?? []
        setUnits(u)
        if (u.length > 0) setUnitId(u[0].id)
      })
  }, [])

  // Load readings when unit or hours changes
  const load = React.useCallback(async () => {
    if (!selectedUnitId) return
    setLoading(true)
    const res = await apiCall<{ data: Reading[] }>(
      `/api/agri-cold-chain/temperature-logs?cold_storage_unit_id=${selectedUnitId}&hours=${hours}`,
      undefined,
      { fallback: { data: [] } },
    )
    if (res.ok) setReadings(res.result?.data ?? [])
    setLoading(false)
  }, [selectedUnitId, hours])

  React.useEffect(() => { load() }, [load])

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? null

  // Compute stats
  const temps = readings.map((r) => Number(r.temperature_c))
  const stats = temps.length > 0 ? {
    current: temps[0],
    min:     Math.min(...temps),
    max:     Math.max(...temps),
    avg:     temps.reduce((a, b) => a + b, 0) / temps.length,
    excursions: readings.filter((r) => r.is_excursion).length,
  } : null

  const handleManualEntry = async () => {
    if (!selectedUnitId || manualValue === '') return
    setSubmitting(true)
    try {
      await apiCallOrThrow('/api/agri-cold-chain/temperature-logs/batch', {
        method: 'POST',
        body: JSON.stringify({
          cold_storage_unit_id: selectedUnitId,
          readings: [{ temperature_c: manualValue, recorded_at: new Date().toISOString() }],
          source: 'manual',
        }),
      })
      flash(`Lectura manual registrada: ${manualValue}°C`, 'success')
      setManualValue('')
      setShowManual(false)
      load()
    } catch {
      flash('Error al registrar lectura', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnDef<Reading>[] = [
    {
      accessorKey: 'recorded_at',
      header: 'Fecha / Hora',
      cell: ({ row }) => {
        const d = new Date((row.original as Reading).recorded_at)
        return <span className="font-mono text-xs">{d.toLocaleDateString('es-VE')} {d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
      },
    },
    {
      accessorKey: 'temperature_c',
      header: 'Temperatura',
      cell: ({ row }) => {
        const r = row.original as Reading
        return (
          <span className={`font-bold text-sm ${r.is_excursion ? 'text-status-error-text' : 'text-status-success-text'}`}>
            {r.temperature_c}°C
          </span>
        )
      },
    },
    {
      accessorKey: 'humidity_pct',
      header: 'Humedad',
      cell: ({ row }) => (row.original as Reading).humidity_pct ? `${(row.original as Reading).humidity_pct}%` : '—',
    },
    {
      accessorKey: 'is_excursion',
      header: 'Estado',
      cell: ({ row }) => (row.original as Reading).is_excursion ? (
        <StatusBadge variant="error">Fuera de rango</StatusBadge>
      ) : (
        <StatusBadge variant="success">En rango</StatusBadge>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Fuente',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{SOURCE_LABEL[(row.original as Reading).source] ?? (row.original as Reading).source}</span>,
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Historial de Temperatura"
        description={
          stats
            ? `Actual: ${stats.current.toFixed(1)}°C · Min: ${stats.min.toFixed(1)}°C · Max: ${stats.max.toFixed(1)}°C · ${stats.excursions > 0 ? `⚠ ${stats.excursions} excursiones` : '✓ Sin excursiones'}`
            : 'Selecciona una unidad de frío'
        }
      />
      <PageBody>
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="min-w-[200px]">
            <Select value={selectedUnitId} onValueChange={setUnitId}>
              <SelectTrigger><SelectValue placeholder="Selecciona cuarto frío..." /></SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.target_temp_min}°C — {u.target_temp_max}°C)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {HOURS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4 mr-2" /> Actualizar
          </Button>
          <Button type="button" size="sm" onClick={() => setShowManual(!showManual)}>
            <Thermometer className="size-4 mr-2" /> Ingresar manual
          </Button>
        </div>

        {/* Manual entry form */}
        {showManual && selectedUnit && (
          <div className="mb-4 border border-border rounded-lg p-4 bg-background flex items-center gap-3">
            <Thermometer className="size-4 text-primary shrink-0" />
            <span className="text-sm font-medium">Lectura manual para {selectedUnit.name}</span>
            <Input
              type="number"
              step="0.1"
              value={manualValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualValue(e.target.value)}
              placeholder="Temperatura en °C"
              className="max-w-[140px]"
            />
            <Button type="button" size="sm" onClick={handleManualEntry} disabled={submitting || manualValue === ''}>
              {submitting ? 'Registrando...' : 'Registrar'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowManual(false)}>Cancelar</Button>
          </div>
        )}

        {/* Summary cards + sparkline */}
        {stats && selectedUnit && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className={`bg-card border rounded-lg p-4 ${stats.current < Number(selectedUnit.target_temp_min) || stats.current > Number(selectedUnit.target_temp_max) ? 'border-status-error-border' : 'border-border'}`}>
              <div className="text-xs text-muted-foreground mb-1">Temperatura actual</div>
              <div className={`text-2xl font-bold ${stats.current > Number(selectedUnit.target_temp_max) || stats.current < Number(selectedUnit.target_temp_min) ? 'text-status-error-text' : 'text-status-success-text'}`}>
                {stats.current.toFixed(1)}°C
              </div>
              <div className="text-xs text-muted-foreground mt-1">Rango: {selectedUnit.target_temp_min}°C — {selectedUnit.target_temp_max}°C</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Mínima</div>
              <div className="text-2xl font-bold">{stats.min.toFixed(1)}°C</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Máxima</div>
              <div className="text-2xl font-bold">{stats.max.toFixed(1)}°C</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">Promedio</div>
              <div className="text-2xl font-bold">{stats.avg.toFixed(1)}°C</div>
            </div>
            <div className={`bg-card border rounded-lg p-4 ${stats.excursions > 0 ? 'border-status-error-border bg-status-error-bg' : 'border-border'}`}>
              <div className="text-xs text-muted-foreground mb-1">Excursiones</div>
              <div className={`text-2xl font-bold ${stats.excursions > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>
                {stats.excursions}
              </div>
            </div>
          </div>
        )}

        {/* Mini sparkline */}
        {readings.length >= 2 && selectedUnit && (
          <div className="mb-4 p-4 bg-card border border-border rounded-lg">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Tendencia — últimas {readings.length} lecturas</div>
            <TempSparkline
              readings={readings}
              min={Number(selectedUnit.target_temp_min) - 2}
              max={Number(selectedUnit.target_temp_max) + 2}
            />
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary" /> Temperatura medida</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-status-error-icon" /> Excursión</div>
              <div className="flex items-center gap-1"><div className="w-3 h-2 bg-status-success-bg opacity-50" /> Rango aceptable</div>
            </div>
          </div>
        )}

        {/* Readings table */}
        <DataTable
          entityId="agri_cold_chain.temperature_log"
          extensionTableId="agri-cold-chain-readings-list"
          data={readings}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin lecturas en este período"
        />
      </PageBody>
    </Page>
  )
}
