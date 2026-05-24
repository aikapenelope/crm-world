'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Plus, Thermometer } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type UnitRow = {
  id: string; name: string; unit_type: string; target_temp_min: string
  target_temp_max: string; capacity_tons: string | null; sensor_id: string | null
  status: string; alert_phone: string | null
}

type TempReading = { temperature_c: string; recorded_at: string; is_excursion: boolean }

const TYPE_LABEL: Record<string, string> = {
  chill_room: 'Cuarto frío', freezer: 'Congelador',
  refrigerator: 'Refrigerador', reefer_truck: 'Camión frío',
}

export default function AgriColdChainPage() {
  const [units, setUnits]        = React.useState<UnitRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [editing, setEditing]    = React.useState<UnitRow | null>(null)
  const [latestTemps, setLatestTemps] = React.useState<Record<string, TempReading | null>>({})

  const load = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: UnitRow[] }>(
      '/api/agri-cold-chain/cold-storage-units?pageSize=100', undefined, { fallback: { items: [] } }
    )
    if (res.ok) {
      const u = res.result?.items ?? []
      setUnits(u)
      // Load latest temp reading for each unit
      const temps: Record<string, TempReading | null> = {}
      await Promise.all(u.map(async (unit) => {
        const t = await apiCall<{ data: TempReading[] }>(
          `/api/agri-cold-chain/temperature-logs?cold_storage_unit_id=${unit.id}&hours=2`,
          undefined, { fallback: { data: [] } }
        )
        temps[unit.id] = (t.result?.data ?? [])[0] ?? null
      }))
      setLatestTemps(temps)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const excursionCount = units.filter(u => {
    const t = latestTemps[u.id]
    return t?.is_excursion
  }).length

  const columns: ColumnDef<UnitRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'unit_type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABEL[row.original.unit_type] ?? row.original.unit_type,
    },
    {
      id: 'temp_range',
      header: 'Rango Objetivo',
      cell: ({ row }) => `${row.original.target_temp_min}°C — ${row.original.target_temp_max}°C`,
    },
    {
      id: 'current_temp',
      header: 'Última Lectura',
      cell: ({ row }) => {
        const t = latestTemps[row.original.id]
        if (!t) return <span className="text-muted-foreground text-xs">Sin datos</span>
        const isExcursion = t.is_excursion
        return (
          <div>
            <span className={`font-bold text-sm ${isExcursion ? 'text-status-error-text' : 'text-status-success-text'}`}>
              {t.temperature_c}°C {isExcursion ? '⚠' : '✓'}
            </span>
            <div className="text-xs text-muted-foreground">
              {new Date(t.recorded_at).toLocaleString('es-VE')}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'sensor_id',
      header: 'Sensor',
      cell: ({ row }) => row.original.sensor_id ?? <span className="text-muted-foreground text-xs">Manual</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={row.original.status === 'active' ? 'success' : 'neutral'} dot>
          {row.original.status === 'active' ? 'Activo' : row.original.status === 'maintenance' ? 'Mantenimiento' : 'Offline'}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button type="button" size="sm" variant="outline"
          onClick={() => { setEditing(row.original); setShowForm(true) }}>
          Editar
        </Button>
      ),
    },
  ]

  const formFields = [
    { type: 'text' as const,   id: 'name',                 label: 'Nombre',                    required: true },
    { type: 'select' as const, id: 'unit_type',            label: 'Tipo',                      required: true,
      options: [
        { value: 'chill_room',   label: 'Cuarto Frío (0-4°C)' },
        { value: 'freezer',      label: 'Congelador (-18°C o menos)' },
        { value: 'refrigerator', label: 'Refrigerador (2-8°C)' },
        { value: 'reefer_truck', label: 'Camión Refrigerado' },
      ]},
    { type: 'text' as const,   id: 'target_temp_min',      label: 'Temp. Mínima Objetivo (°C)', required: true },
    { type: 'text' as const,   id: 'target_temp_max',      label: 'Temp. Máxima Objetivo (°C)', required: true },
    { type: 'text' as const,   id: 'capacity_tons',        label: 'Capacidad (toneladas)' },
    { type: 'text' as const,   id: 'sensor_id',            label: 'ID del Sensor IoT' },
    { type: 'number' as const, id: 'min_alert_minutes',    label: 'Minutos para alerta (≥15 en Venezuela)' },
    { type: 'text' as const,   id: 'alert_phone',          label: 'WhatsApp de alertas (+58XXXXXXXXXX)' },
    { type: 'text' as const,   id: 'location_description', label: 'Descripción de Ubicación' },
  ]

  return (
    <Page>
      <PageHeader
        title="Cadena de Frío"
        description={excursionCount > 0
          ? `⚠ ${excursionCount} unidad(es) con excursión de temperatura`
          : `${units.length} unidades monitoreadas`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={load}>
              <Thermometer className="size-4 mr-2" /> Actualizar
            </Button>
            <Button type="button" onClick={() => { setEditing(null); setShowForm(true) }}>
              <Plus className="size-4 mr-2" /> Nueva Unidad
            </Button>
          </div>
        }
      />
      <PageBody>
        {excursionCount > 0 && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg">
            <span className="text-sm text-status-error-text font-semibold">
              🌡 {excursionCount} unidad(es) con temperatura fuera de rango — revisar inmediatamente.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">{editing ? `Editar — ${editing.name}` : 'Nueva Unidad de Frío'}</h3>
            <CrudForm
              entityId="agri_cold_chain.storage_unit"
              apiPath="/api/agri-cold-chain/cold-storage-units"
              mode={editing ? 'edit' : 'create'}
              initial={editing ?? undefined}
              fields={formFields}
              groups={[
                { id: 'general',  title: 'General',        fields: ['name', 'unit_type', 'target_temp_min', 'target_temp_max', 'capacity_tons'] },
                { id: 'iot',      title: 'Sensor / IoT',   fields: ['sensor_id', 'min_alert_minutes', 'alert_phone'] },
                { id: 'location', title: 'Ubicación',      fields: ['location_description'] },
              ]}
              onSuccess={() => { flash(editing ? 'Unidad actualizada' : 'Unidad registrada', 'success'); setShowForm(false); setEditing(null); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_cold_chain.storage_unit"
          extensionTableId="agri-cold-chain-units-list"
          data={units}
          columns={columns}
          isLoading={isLoading}
          emptyState={{
            title: 'Sin unidades de frío registradas',
            description: 'Registra los cuartos fríos para monitorear la cadena de temperatura.',
          }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
