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
import { Plus, ShieldAlert } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type MedRow = {
  id: string
  flock_id: string
  diagnosis: string
  medication_name: string
  treatment_start_date: string
  treatment_end_date: string
  withdrawal_days: number
  withdrawal_end_date: string
  veterinarian_name: string | null
  resolved: boolean
}

type FlockOption = { value: string; label: string }

export default function AgriVetPage() {
  const { runMutation } = useGuardedMutation()
  const [meds, setMeds]          = React.useState<MedRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [flockOptions, setFlocks] = React.useState<FlockOption[]>([])
  const [resolvedFilter, setResolved] = React.useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = React.useCallback(async () => {
    setLoading(true)
    const [medRes, flockRes] = await Promise.all([
      apiCall<{ items: MedRow[] }>(
        `/api/agri-vet/medication-records?pageSize=100&resolved=${resolvedFilter}`,
        undefined, { fallback: { items: [] } }
      ),
      apiCall<{ items: any[] }>('/api/agri-units/flocks?pageSize=100&status=active', undefined, { fallback: { items: [] } }),
    ])
    if (medRes.ok) setMeds(medRes.result?.items ?? [])
    if (flockRes.ok) setFlocks((flockRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.flock_number })))
    setLoading(false)
  }, [resolvedFilter])

  React.useEffect(() => { load() }, [load])

  const handleResolve = (row: MedRow) => {
    runMutation({
      context: { entityId: 'agri_vet.medication', recordId: row.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-vet/medication-records', {
          method: 'PUT',
          body: JSON.stringify({ id: row.id, resolved: true }),
        })
        flash('Tratamiento cerrado', 'success')
        load()
      },
    })
  }

  const activeWithdrawals = meds.filter(m => !m.resolved && m.withdrawal_end_date >= today)

  const columns: ColumnDef<MedRow>[] = [
    {
      accessorKey: 'medication_name',
      header: 'Medicamento',
      cell: ({ row }) => <span className="font-semibold">{row.original.medication_name}</span>,
    },
    {
      accessorKey: 'diagnosis',
      header: 'Diagnóstico',
      meta: { truncate: true, maxWidth: 250 },
    },
    {
      accessorKey: 'treatment_start_date',
      header: 'Inicio',
      cell: ({ row }) => new Date(row.original.treatment_start_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'withdrawal_end_date',
      header: 'Fin de retiro',
      cell: ({ row }) => {
        const d = row.original.withdrawal_end_date
        const isActive = !row.original.resolved && d >= today
        return (
          <div>
            <span className={isActive ? 'text-status-error-text font-semibold' : ''}>
              {new Date(d).toLocaleDateString('es-VE')}
            </span>
            {isActive && <div className="text-xs text-status-warning-text">⚠ Retiro activo</div>}
          </div>
        )
      },
    },
    {
      accessorKey: 'veterinarian_name',
      header: 'Veterinario',
      cell: ({ row }) => row.original.veterinarian_name ?? '—',
    },
    {
      accessorKey: 'resolved',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={row.original.resolved ? 'neutral' : 'warning'} dot>
          {row.original.resolved ? 'Resuelto' : 'Activo'}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            ...(!row.original.resolved ? [
              { id: 'resolve', label: 'Cerrar tratamiento', onSelect: () => handleResolve(row.original) },
            ] : []),
          ]}
        />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Tratamientos Medicamentosos"
        description={activeWithdrawals.length > 0
          ? `${activeWithdrawals.length} lote(s) con período de retiro activo`
          : 'Sin períodos de retiro activos'}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button type="button" size="sm" variant={!resolvedFilter ? 'default' : 'outline'} onClick={() => setResolved(false)}>Activos</Button>
              <Button type="button" size="sm" variant={resolvedFilter ? 'default' : 'outline'} onClick={() => setResolved(true)}>Resueltos</Button>
            </div>
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" /> Nuevo Tratamiento
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* Withdrawal alert banner */}
        {activeWithdrawals.length > 0 && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
            <ShieldAlert className="size-4 text-status-error-icon shrink-0" />
            <span className="text-sm text-status-error-text">
              <strong>{activeWithdrawals.length} lote(s)</strong> con período de retiro activo — no pueden ir a beneficio hasta que finalice el retiro.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Nuevo Tratamiento Medicamentoso</h3>
            <CrudForm
              entityId="agri_vet.medication"
              apiPath="/api/agri-vet/medication-records"
              mode="create"
              fields={[
                { type: 'select' as const,   id: 'flock_id',                label: 'Lote de Aves',      required: true, options: flockOptions },
                { type: 'text' as const,     id: 'diagnosis',               label: 'Diagnóstico',       required: true },
                { type: 'text' as const,     id: 'medication_name',         label: 'Medicamento',       required: true },
                { type: 'text' as const,     id: 'active_ingredient',       label: 'Principio Activo' },
                { type: 'text' as const,     id: 'manufacturer',            label: 'Fabricante' },
                { type: 'select' as const,   id: 'administration_route',    label: 'Vía de Admin.',
                  options: [
                    { value: 'drinking_water', label: 'Agua de bebida' },
                    { value: 'injectable',     label: 'Inyectable' },
                    { value: 'oral',           label: 'Oral' },
                    { value: 'topical',        label: 'Tópico' },
                    { value: 'other',          label: 'Otro' },
                  ]},
                { type: 'text' as const,     id: 'dose_description',        label: 'Descripción de Dosis' },
                { type: 'date' as const,     id: 'treatment_start_date',    label: 'Inicio del Tratamiento', required: true },
                { type: 'number' as const,   id: 'treatment_duration_days', label: 'Duración (días)',     required: true },
                { type: 'date' as const,     id: 'treatment_end_date',      label: 'Fin del Tratamiento', required: true },
                { type: 'number' as const,   id: 'withdrawal_days',         label: 'Días de Retiro',     required: true },
                { type: 'date' as const,     id: 'withdrawal_end_date',     label: 'Fecha Fin de Retiro (= Fin + Retiro)', required: true },
                { type: 'text' as const,     id: 'veterinarian_name',       label: 'Veterinario Responsable', required: true },
                { type: 'text' as const,     id: 'medication_lot_number',   label: 'Lote del Medicamento' },
                { type: 'textarea' as const, id: 'notes',                   label: 'Notas' },
              ]}
              groups={[
                { id: 'diagnosis',    title: 'Diagnóstico',        fields: ['flock_id', 'diagnosis'] },
                { id: 'medication',   title: 'Medicamento',        fields: ['medication_name', 'active_ingredient', 'manufacturer', 'administration_route', 'dose_description'] },
                { id: 'treatment',    title: 'Tratamiento',        fields: ['treatment_start_date', 'treatment_duration_days', 'treatment_end_date'] },
                { id: 'withdrawal',   title: 'Período de Retiro',  fields: ['withdrawal_days', 'withdrawal_end_date'] },
                { id: 'responsible',  title: 'Responsable',        fields: ['veterinarian_name', 'medication_lot_number', 'notes'] },
              ]}
              onSuccess={() => { flash('Tratamiento registrado', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_vet.medication"
          extensionTableId="agri-vet-medications-list"
          data={meds}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin tratamientos registrados'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
