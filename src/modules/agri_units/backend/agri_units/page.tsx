'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import type { ColumnDef } from '@tanstack/react-table'

type FlockRow = {
  id: string
  flock_number: string
  farm_unit_id: string
  species: string
  genetic_line: string | null
  start_date: string
  initial_count: number
  status: string
  planned_end_date: string | null
}

const SPECIES_LABEL: Record<string, string> = {
  broiler: 'Pollo engorde', layer: 'Ponedora', turkey: 'Pavo', swine: 'Cerdo', bovine: 'Bovino',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  active: 'success', completed: 'neutral', terminated_early: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', completed: 'Completado', terminated_early: 'Terminado anticipado',
}

export default function AgriUnitsPage() {
  const router = useRouter()
  const [flocks, setFlocks]     = React.useState<FlockRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [statusFilter, setFilter] = React.useState('active')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: FlockRow[] }>(
      `/api/agri-units/flocks?${params}`,
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) setFlocks(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<FlockRow>[] = [
    {
      accessorKey: 'flock_number',
      header: 'N° Lote',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">{row.original.flock_number}</span>
      ),
    },
    {
      accessorKey: 'species',
      header: 'Especie / Línea',
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium">{SPECIES_LABEL[row.original.species] ?? row.original.species}</div>
          {row.original.genetic_line && (
            <div className="text-xs text-muted-foreground">{row.original.genetic_line}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'initial_count',
      header: 'Aves iniciales',
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.initial_count.toLocaleString('es-VE')}</span>
      ),
    },
    {
      accessorKey: 'start_date',
      header: 'Entrada',
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'planned_end_date',
      header: 'Cosecha estimada',
      cell: ({ row }) =>
        row.original.planned_end_date
          ? new Date(row.original.planned_end_date).toLocaleDateString('es-VE')
          : '—',
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
            { id: 'open',   label: 'Ver detalle',  onSelect: () => router.push(`/backend/agri-units/${row.original.id}`) },
            { id: 'edit',   label: 'Editar lote',  onSelect: () => router.push(`/backend/agri-units/${row.original.id}`) },
          ]}
        />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '',           label: 'Todos' },
    { value: 'active',     label: 'Activos' },
    { value: 'completed',  label: 'Completados' },
  ]

  const activeCount    = flocks.filter(f => f.status === 'active').length
  const description    = statusFilter === 'active'
    ? `${activeCount} lote${activeCount !== 1 ? 's' : ''} en producción`
    : undefined

  return (
    <Page>
      <PageHeader
        title="Lotes de Producción"
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  type="button"
                  size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => router.push('/backend/agri-units/flocks/create')}
            >
              Nuevo Lote
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="agri_units.flock"
          extensionTableId="agri-flocks-list"
          data={flocks}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin lotes registrados"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
