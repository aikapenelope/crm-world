'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type CycleRow = { id: string; field_plot_id: string; crop_type: string; crop_variety: string | null; planting_date: string; expected_harvest_date: string | null; actual_yield_tons: string | null; cost_per_ton_usd: string | null; status: string; destination: string | null }

const CROP_LABEL: Record<string, string> = { maize: 'Maíz', soybean: 'Soya', sorghum: 'Sorgo', sunflower: 'Girasol', other: 'Otro' }
const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'success' | 'error'> = { planned: 'neutral', active: 'info', harvested: 'success', failed: 'error' }
const STATUS_LABEL: Record<string, string> = { planned: 'Planificado', active: 'Activo', harvested: 'Cosechado', failed: 'Fallido' }
const DEST_LABEL: Record<string, string> = { own_feed: 'Alimento propio', sale: 'Venta', storage: 'Almacenamiento' }

export default function AgriFieldPage() {
  const { runMutation } = useGuardedMutation()
  const [cycles, setCycles]       = React.useState<CycleRow[]>([])
  const [plots, setPlots]         = React.useState<{ value: string; label: string }[]>([])
  const [isLoading, setLoading]   = React.useState(true)
  const [showCycleForm, setCycleForm] = React.useState(false)
  const [showPlotForm, setPlotForm]   = React.useState(false)
  const [statusFilter, setFilter]  = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [cycleRes, plotRes] = await Promise.all([
      apiCall<{ items: CycleRow[] }>(`/api/agri-field/crop-cycles?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-field/field-plots?pageSize=100', undefined, { fallback: { items: [] } }),
    ])
    if (cycleRes.ok) setCycles(cycleRes.result?.items ?? [])
    if (plotRes.ok)  setPlots((plotRes.result?.items ?? []).map((p: any) => ({ value: p.id, label: `${p.name} (${p.area_hectares} ha)` })))
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleHarvest = (cycle: CycleRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_field.cycle', recordId: cycle.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-field/crop-cycles', { method: 'PUT', body: JSON.stringify({ id: cycle.id, status: 'harvested', actual_harvest_date: new Date().toISOString().split('T')[0] }) })
        flash('Ciclo marcado como cosechado', 'success')
        load()
      },
    })
  }

  const activeCycles   = cycles.filter(c => c.status === 'active').length
  const harvestedTons  = cycles.filter(c => c.status === 'harvested').reduce((s, c) => s + Number(c.actual_yield_tons ?? 0), 0)

  const columns: ColumnDef<CycleRow>[] = [
    { accessorKey: 'crop_type', header: 'Cultivo', cell: ({ row }) => <span className="font-semibold">{CROP_LABEL[row.original.crop_type] ?? row.original.crop_type}{row.original.crop_variety ? ` · ${row.original.crop_variety}` : ''}</span> },
    { accessorKey: 'planting_date', header: 'Siembra', cell: ({ row }) => new Date(row.original.planting_date).toLocaleDateString('es-VE') },
    { accessorKey: 'expected_harvest_date', header: 'Cosecha est.', cell: ({ row }) => row.original.expected_harvest_date ? new Date(row.original.expected_harvest_date).toLocaleDateString('es-VE') : '—' },
    { accessorKey: 'actual_yield_tons', header: 'Rendimiento real', cell: ({ row }) => row.original.actual_yield_tons ? `${row.original.actual_yield_tons} t` : '—' },
    { accessorKey: 'cost_per_ton_usd', header: 'Costo/ton', cell: ({ row }) => row.original.cost_per_ton_usd ? `USD ${row.original.cost_per_ton_usd}` : '—' },
    { accessorKey: 'destination', header: 'Destino', cell: ({ row }) => row.original.destination ? DEST_LABEL[row.original.destination] ?? row.original.destination : '—' },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar ciclo', onSelect: () => {} },
          ...(row.original.status === 'active' ? [{ id: 'harvest', label: 'Marcar como cosechado', onSelect: () => handleHarvest(row.original) }] : []),
        ]} />
      ),
    },
  ]

  const FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'harvested', label: 'Cosechados' },
  ]

  return (
    <Page>
      <PageHeader
        title="Operaciones de Campo"
        description={[activeCycles > 0 && `${activeCycles} ciclo(s) activo(s)`, harvestedTons > 0 && `${harvestedTons.toFixed(1)} t cosechadas`].filter(Boolean).join(' · ') || undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm" variant={statusFilter === f.value ? 'default' : 'outline'} onClick={() => setFilter(f.value)}>{f.label}</Button>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={() => setPlotForm(!showPlotForm)}>Gestionar Parcelas</Button>
            <Button type="button" onClick={() => setCycleForm(!showCycleForm)}><Plus className="size-4 mr-2" /> Nuevo Ciclo</Button>
          </div>
        }
      />
      <PageBody>
        {showPlotForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Parcela Agrícola</h3>
            <CrudForm
              entityId="agri_field.plot"
              apiPath="/api/agri-field/field-plots"
              mode="create"
              fields={[
                { type: 'text' as const,   name: 'name',              label: 'Nombre de la Parcela', required: true },
                { type: 'text' as const,   name: 'area_hectares',     label: 'Área (hectáreas)',      required: true },
                { type: 'select' as const, name: 'irrigation_system', label: 'Sistema de Riego',
                  options: [
                    { value: 'drip', label: 'Goteo' }, { value: 'sprinkler', label: 'Aspersión' },
                    { value: 'flood', label: 'Gravedad/Inundación' }, { value: 'rainfed', label: 'Solo lluvia' },
                  ]},
                { type: 'text' as const,   name: 'soil_type',         label: 'Tipo de Suelo' },
                { type: 'text' as const,   name: 'location_gps',      label: 'GPS (lat,lng)' },
              ]}
              groups={[{ id: 'general', label: 'General', fields: ['name', 'area_hectares', 'irrigation_system', 'soil_type', 'location_gps'] }]}
              onSuccess={() => { flash('Parcela registrada', 'success'); setPlotForm(false); load() }}
            />
          </div>
        )}

        {showCycleForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Nuevo Ciclo de Cultivo</h3>
            <CrudForm
              entityId="agri_field.cycle"
              apiPath="/api/agri-field/crop-cycles"
              mode="create"
              fields={[
                { type: 'select' as const, name: 'field_plot_id',         label: 'Parcela',             required: true, options: plots },
                { type: 'select' as const, name: 'crop_type',             label: 'Cultivo',             required: true,
                  options: [
                    { value: 'maize', label: 'Maíz' }, { value: 'soybean', label: 'Soya' },
                    { value: 'sorghum', label: 'Sorgo' }, { value: 'sunflower', label: 'Girasol' }, { value: 'other', label: 'Otro' },
                  ]},
                { type: 'text' as const,   name: 'crop_variety',          label: 'Variedad / Híbrido' },
                { type: 'date' as const,   name: 'planting_date',         label: 'Fecha de Siembra',   required: true },
                { type: 'date' as const,   name: 'expected_harvest_date', label: 'Cosecha Estimada' },
                { type: 'text' as const,   name: 'expected_yield_tons_ha', label: 'Rendimiento Esperado (ton/ha)' },
                { type: 'select' as const, name: 'destination',           label: 'Destino',
                  options: [
                    { value: 'own_feed', label: 'Alimento propio' },
                    { value: 'sale', label: 'Venta' },
                    { value: 'storage', label: 'Almacenamiento' },
                  ]},
                { type: 'textarea' as const, name: 'notes', label: 'Notas' },
              ]}
              groups={[
                { id: 'general',  label: 'General',   fields: ['field_plot_id', 'crop_type', 'crop_variety'] },
                { id: 'schedule', label: 'Fechas',    fields: ['planting_date', 'expected_harvest_date'] },
                { id: 'yield',    label: 'Producción', fields: ['expected_yield_tons_ha', 'destination', 'notes'] },
              ]}
              onSuccess={() => { flash('Ciclo de cultivo creado', 'success'); setCycleForm(false); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_field.cycle"
          extensionTableId="agri-field-cycles-list"
          data={cycles}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin ciclos de cultivo', description: 'Registra las parcelas y luego inicia un ciclo de cultivo.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
