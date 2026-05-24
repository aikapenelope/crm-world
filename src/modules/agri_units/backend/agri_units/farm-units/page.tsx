'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type FarmUnitRow = {
  id: string
  name: string
  unit_type: string
  ownership_type: string
  technical_manager: string | null
  capacity_heads: number | null
  status: string
  location_address: string | null
}

const UNIT_TYPE_LABEL: Record<string, string> = {
  poultry: 'Avícola', swine: 'Porcícola', bovine: 'Bovino',
  agricultural: 'Agrícola', mixed: 'Mixto',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success', maintenance: 'warning', inactive: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', maintenance: 'Mantenimiento', inactive: 'Inactivo',
}

export default function FarmUnitsPage() {
  const [units, setUnits]        = React.useState<FarmUnitRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [editing, setEditing]    = React.useState<FarmUnitRow | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: FarmUnitRow[] }>(
      '/api/agri-units/farm-units?pageSize=100',
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) setUnits(res.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const formFields = [
    { type: 'text' as const,   id: 'name',             label: 'Nombre',                      required: true },
    { type: 'select' as const, id: 'unit_type',        label: 'Tipo de Unidad',               required: true,
      options: [
        { value: 'poultry',      label: 'Avícola' },
        { value: 'swine',        label: 'Porcícola' },
        { value: 'bovine',       label: 'Bovino' },
        { value: 'agricultural', label: 'Agrícola' },
        { value: 'mixed',        label: 'Mixto' },
      ]},
    { type: 'select' as const, id: 'ownership_type',   label: 'Tipo de Tenencia',
      options: [
        { value: 'own',        label: 'Propio' },
        { value: 'integrated', label: 'Productor Integrado' },
      ]},
    { type: 'text' as const,   id: 'technical_manager', label: 'Técnico Responsable' },
    { type: 'number' as const, id: 'capacity_heads',    label: 'Capacidad (cabezas)' },
    { type: 'text' as const,   id: 'location_address',  label: 'Dirección / Ubicación' },
    { type: 'text' as const,   id: 'location_gps',      label: 'GPS (lat,lng)' },
    { type: 'select' as const, id: 'status',            label: 'Estado',
      options: [
        { value: 'active',      label: 'Activo' },
        { value: 'maintenance', label: 'En Mantenimiento' },
        { value: 'inactive',    label: 'Inactivo' },
      ]},
    { type: 'textarea' as const, id: 'notes', label: 'Observaciones' },
  ]

  const columns: ColumnDef<FarmUnitRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'unit_type',
      header: 'Tipo',
      cell: ({ row }) => UNIT_TYPE_LABEL[row.original.unit_type] ?? row.original.unit_type,
    },
    {
      accessorKey: 'ownership_type',
      header: 'Tenencia',
      cell: ({ row }) =>
        row.original.ownership_type === 'integrated' ? 'Integrado' : 'Propio',
    },
    {
      accessorKey: 'capacity_heads',
      header: 'Capacidad',
      cell: ({ row }) =>
        row.original.capacity_heads
          ? row.original.capacity_heads.toLocaleString('es-VE')
          : '—',
    },
    {
      accessorKey: 'technical_manager',
      header: 'Técnico',
      cell: ({ row }) => row.original.technical_manager ?? '—',
      meta: { truncate: true, maxWidth: 200 },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            {
              id: 'edit',
              label: 'Editar',
              onSelect: () => { setEditing(row.original); setShowForm(true) },
            },
          ]}
        />
      ),
    },
  ]

  const handleSuccess = () => {
    flash(editing ? 'Unidad actualizada' : 'Unidad productiva creada', 'success')
    setShowForm(false)
    setEditing(null)
    load()
  }

  return (
    <Page>
      <PageHeader
        title="Granjas y Galpones"
        description={`${units.filter(u => u.status === 'active').length} unidades activas`}
        actions={
          <Button
            type="button"
            onClick={() => { setEditing(null); setShowForm(true) }}
          >
            <Plus className="size-4 mr-2" /> Nueva Unidad
          </Button>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4">
              {editing ? `Editar — ${editing.name}` : 'Nueva Unidad Productiva'}
            </h3>
            <CrudForm
              entityId="agri_units.farm_unit"
              apiPath="/api/agri-units/farm-units"
              mode={editing ? 'edit' : 'create'}
              initial={editing ?? undefined}
              fields={formFields}
              groups={[
                { id: 'general',  title: 'General',   fields: ['name', 'unit_type', 'ownership_type', 'technical_manager'] },
                { id: 'capacity', title: 'Capacidad',  fields: ['capacity_heads', 'status'] },
                { id: 'location', title: 'Ubicación',  fields: ['location_address', 'location_gps'] },
                { id: 'notes',    title: 'Notas',      fields: ['notes'] },
              ]}
              onSuccess={handleSuccess}
            />
          </div>
        )}
        <DataTable
          entityId="agri_units.farm_unit"
          extensionTableId="agri-farm-units-list"
          data={units}
          columns={columns}
          isLoading={isLoading}
          emptyState={{
            label: 'Sin unidades productivas',
            description: 'Registra tus granjas y galpones para comenzar.',
          }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
