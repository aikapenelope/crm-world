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
import { Plus, CheckCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type VacRow = {
  id: string
  flock_id: string
  vaccine_name: string
  manufacturer: string | null
  administration_route: string
  scheduled_date: string
  applied_date: string | null
  birds_treated: number | null
  vaccine_lot_number: string | null
  withdrawal_days: number
  withdrawal_end_date: string | null
  status: string
}

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
  scheduled: 'warning', applied: 'success', missed: 'error', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada', applied: 'Aplicada', missed: 'No aplicada', cancelled: 'Cancelada',
}
const ROUTE_LABEL: Record<string, string> = {
  drinking_water: 'Agua de bebida', ocular: 'Ocular', injectable: 'Inyectable',
  spray: 'Spray', subcutaneous: 'Subcutáneo', oral: 'Oral',
}

export default function VaccinationsPage() {
  const { runMutation } = useGuardedMutation()
  const [records, setRecords]    = React.useState<VacRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [statusFilter, setFilter] = React.useState('scheduled')
  const [flockOptions, setFlocks] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const [vacRes, flockRes] = await Promise.all([
      apiCall<{ items: VacRow[] }>(
        `/api/agri-vet/vaccination-records?pageSize=200${statusFilter ? `&status=${statusFilter}` : ''}`,
        undefined, { fallback: { items: [] } }
      ),
      apiCall<{ items: any[] }>('/api/agri-units/flocks?pageSize=100&status=active', undefined, { fallback: { items: [] } }),
    ])
    if (vacRes.ok)   setRecords(vacRes.result?.items ?? [])
    if (flockRes.ok) setFlocks((flockRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.flock_number })))
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleApply = (row: VacRow) => {
    runMutation({
      context: { entityId: 'agri_vet.vaccination', recordId: row.id },
      operation: async () => {
        const today = new Date().toISOString().split('T')[0]
        const withdrawalEnd = row.withdrawal_days > 0
          ? new Date(Date.now() + row.withdrawal_days * 86400000).toISOString().split('T')[0]
          : today
        await apiCallOrThrow('/api/agri-vet/vaccination-records', {
          method: 'PUT',
          body: JSON.stringify({ id: row.id, status: 'applied', applied_date: today, withdrawal_end_date: withdrawalEnd }),
        })
        flash('Vacunación registrada como aplicada', 'success')
        load()
      },
    })
  }

  const columns: ColumnDef<VacRow>[] = [
    {
      accessorKey: 'vaccine_name',
      header: 'Vacuna',
      cell: ({ row }) => <span className="font-semibold">{row.original.vaccine_name}</span>,
    },
    {
      accessorKey: 'manufacturer',
      header: 'Laboratorio',
      cell: ({ row }) => row.original.manufacturer ?? '—',
    },
    {
      accessorKey: 'administration_route',
      header: 'Vía',
      cell: ({ row }) => ROUTE_LABEL[row.original.administration_route] ?? row.original.administration_route,
    },
    {
      accessorKey: 'scheduled_date',
      header: 'Fecha Programada',
      cell: ({ row }) => new Date(row.original.scheduled_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'applied_date',
      header: 'Fecha Aplicada',
      cell: ({ row }) =>
        row.original.applied_date ? new Date(row.original.applied_date).toLocaleDateString('es-VE') : '—',
    },
    {
      accessorKey: 'vaccine_lot_number',
      header: 'Lote Vacuna',
      cell: ({ row }) => row.original.vaccine_lot_number ?? '—',
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
        row.original.status === 'scheduled' ? (
          <Button type="button" size="sm" variant="outline" onClick={() => handleApply(row.original)}>
            <CheckCircle className="size-3 mr-1" /> Aplicada
          </Button>
        ) : null
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: 'scheduled', label: 'Programadas' },
    { value: 'applied',   label: 'Aplicadas' },
    { value: '',          label: 'Todas' },
  ]

  return (
    <Page>
      <PageHeader
        title="Registro de Vacunaciones"
        description={`${records.filter(r => r.status === 'scheduled').length} vacunaciones pendientes`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" /> Registrar Vacunación
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Vacunación</h3>
            <CrudForm
              entityId="agri_vet.vaccination"
              apiPath="/api/agri-vet/vaccination-records"
              mode="create"
              fields={[
                { type: 'select' as const,   id: 'flock_id',             label: 'Lote de Aves',           required: true, options: flockOptions },
                { type: 'text' as const,     id: 'vaccine_name',         label: 'Nombre de la Vacuna',    required: true },
                { type: 'text' as const,     id: 'active_ingredient',    label: 'Principio Activo' },
                { type: 'text' as const,     id: 'manufacturer',         label: 'Laboratorio' },
                { type: 'select' as const,   id: 'administration_route', label: 'Vía de Administración',
                  options: [
                    { value: 'drinking_water', label: 'Agua de bebida' },
                    { value: 'ocular',         label: 'Ocular' },
                    { value: 'injectable',     label: 'Inyectable' },
                    { value: 'spray',          label: 'Spray' },
                    { value: 'subcutaneous',   label: 'Subcutáneo' },
                    { value: 'oral',           label: 'Oral' },
                  ]},
                { type: 'date' as const,     id: 'scheduled_date',       label: 'Fecha Programada',       required: true },
                { type: 'date' as const,     id: 'applied_date',         label: 'Fecha Aplicada (si ya fue)' },
                { type: 'number' as const,   id: 'birds_treated',        label: 'Aves Tratadas' },
                { type: 'text' as const,     id: 'vaccine_lot_number',   label: 'Lote de la Vacuna' },
                { type: 'number' as const,   id: 'withdrawal_days',      label: 'Días de Retiro' },
                { type: 'textarea' as const, id: 'notes',                label: 'Observaciones' },
              ]}
              groups={[
                { id: 'vaccine',     title: 'Vacuna',      fields: ['flock_id', 'vaccine_name', 'active_ingredient', 'manufacturer', 'administration_route'] },
                { id: 'application', title: 'Aplicación',  fields: ['scheduled_date', 'applied_date', 'birds_treated', 'vaccine_lot_number', 'withdrawal_days'] },
                { id: 'notes',       title: 'Notas',       fields: ['notes'] },
              ]}
              onSuccess={() => { flash('Vacunación registrada', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}
        <DataTable
          entityId="agri_vet.vaccination"
          extensionTableId="agri-vet-vaccinations-list"
          data={records}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin vacunaciones registradas"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
