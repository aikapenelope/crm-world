'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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

type ProgramRow = {
  id: string
  name: string
  species: string
  vaccinations: any[]
  is_active: boolean
}

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollo de Engorde', layer: 'Gallina Ponedora', turkey: 'Pavo',
  swine: 'Cerdo', bovine: 'Bovino', all: 'Todas las especies',
}

export default function VaccinationProgramsPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'agri_vet.page' })
  const [programs, setPrograms]  = React.useState<ProgramRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: ProgramRow[] }>(
      '/api/agri-vet/vaccination-programs?pageSize=50',
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) setPrograms(res.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleToggle = (prog: ProgramRow) => {
    runMutation({
      context: { entityId: 'agri_vet.vaccination_program', recordId: prog.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-vet/vaccination-programs', {
          method: 'PUT',
          body: JSON.stringify({ id: prog.id, is_active: !prog.is_active }),
        })
        flash(prog.is_active ? 'Programa desactivado' : 'Programa activado', 'success')
        load()
      },
    })
  }

  const activeBroilerProgram = programs.find((p) => p.species === 'broiler' && p.is_active)

  const columns: ColumnDef<ProgramRow>[] = [
    {
      accessorKey: 'name',
      header: 'Programa',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'species',
      header: 'Especie',
      cell: ({ row }) => SPECIES_LABEL[row.original.species] ?? row.original.species,
    },
    {
      id: 'vax_count',
      header: 'Vacunaciones',
      cell: ({ row }) => {
        const count = (row.original.vaccinations ?? []).length
        const maxAge = count > 0
          ? Math.max(...(row.original.vaccinations as any[]).map((v: any) => Number(v.age_days ?? 0)))
          : 0
        return (
          <div>
            <span className={`font-semibold ${count === 0 ? 'text-status-warning-text' : ''}`}>
              {count} vacuna{count !== 1 ? 's' : ''}
            </span>
            {maxAge > 0 && <div className="text-xs text-muted-foreground">hasta día {maxAge}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={row.original.is_active ? 'success' : 'neutral'} dot>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
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
              label: 'Editar calendario',
              onSelect: () => router.push(`/backend/agri-vet/programs/${row.original.id}`),
            },
            {
              id: 'toggle',
              label: row.original.is_active ? 'Desactivar' : 'Activar',
              onSelect: () => handleToggle(row.original),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Programas de Vacunación"
        description={
          activeBroilerProgram
            ? `Broiler activo: ${activeBroilerProgram.name} — ${(activeBroilerProgram.vaccinations ?? []).length} vacunas`
            : 'Sin programa activo para broiler — los nuevos flocks no tendrán calendario automático'
        }
        actions={
          <Button type="button" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4 mr-2" /> Nuevo Programa
          </Button>
        }
      />
      <PageBody>
        {!activeBroilerProgram && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-sm text-status-warning-text">
            Sin programa de vacunación activo para pollos de engorde. Sin este, al iniciar un flock el sistema no puede generar el calendario de vacunas automáticamente.
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Crear Programa de Vacunación</h3>
            <CrudForm{...({} as any)}
              entityId="agri_vet.vaccination_program"
              apiPath="/api/agri-vet/vaccination-programs"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'name',    label: 'Nombre del Programa', required: true },
                { type: 'select' as const, id: 'species', label: 'Especie', required: true,
                  options: [
                    { value: 'broiler', label: 'Pollo de Engorde (broiler)' },
                    { value: 'layer',   label: 'Gallina Ponedora' },
                    { value: 'turkey',  label: 'Pavo' },
                    { value: 'swine',   label: 'Cerdo' },
                    { value: 'bovine',  label: 'Bovino' },
                    { value: 'all',     label: 'General (todas las especies)' },
                  ]},
                { type: 'textarea' as const, id: 'notes', label: 'Descripción / referencias del programa' },
              ]}
              groups={[
                { id: 'info', title: 'Identificación', fields: ['name', 'species', 'notes'] },
              ]}
              onSuccess={() => {
                flash('Programa creado — ahora agrega las vacunas en el detalle del programa', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_vet.vaccination_program"
          data={programs}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin programas de vacunación"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
