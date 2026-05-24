'use client'

import * as React from 'react'
import Link from 'next/link'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Plus } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useConfirmDialog } from '@open-mercato/ui/backend/confirm-dialog'
import type { FilterDef, FilterValues } from '@open-mercato/ui/backend/FilterBar'

type PropertyRow = {
  id: string
  title: string
  property_type: string
  operation: string
  status: string
  price: string
  currency: string
  city: string
  bedrooms: number | null
  bathrooms: number | null
  area_m2: string | null
  commission_rate: string
  created_at: string
}

type ResponsePayload = {
  items: PropertyRow[]
  total: number
  page: number
  totalPages: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  active: 'default',
  reserved: 'outline',
  sold: 'destructive',
  rented: 'destructive',
  inactive: 'secondary',
}

const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apto',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Comercial',
  oficina: 'Oficina',
  galpon: 'Galpón',
  otro: 'Otro',
}

const OP_LABELS: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  venta_alquiler: 'Venta/Alq.',
}

export default function PropertiesPage() {
  const t = useT()
  const { confirm: confirmDialog, ConfirmDialogElement } = useConfirmDialog()
  const [rows, setRows] = React.useState<PropertyRow[]>([])
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [filters, setFilters] = React.useState<FilterValues>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [reloadToken, setReloadToken] = React.useState(0)
  const scopeVersion = useOrganizationScopeVersion()

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', '50')
        if (search) params.set('search', search)
        if (filters.property_type) params.set('property_type', String(filters.property_type))
        if (filters.operation) params.set('operation', String(filters.operation))
        if (filters.status) params.set('status', String(filters.status))
        if (filters.city) params.set('city', String(filters.city))

        const fallback: ResponsePayload = { items: [], total: 0, page, totalPages: 1 }
        const call = await apiCall<ResponsePayload>(
          `/api/properties?${params.toString()}`,
          undefined,
          { fallback },
        )

        if (!call.ok) {
          flash('Error al cargar propiedades', 'error')
          return
        }

        const payload = call.result ?? fallback
        if (!cancelled) {
          setRows(Array.isArray(payload.items) ? payload.items : [])
          setTotal(payload.total || 0)
          setTotalPages(payload.totalPages || 1)
        }
      } catch {
        if (!cancelled) flash('Error al cargar propiedades', 'error')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, search, filters, reloadToken, scopeVersion])

  const handleDelete = React.useCallback(
    async (row: PropertyRow) => {
      const confirmed = await confirmDialog({
        title: `¿Eliminar "${row.title}"?`,
        variant: 'destructive',
      })
      if (!confirmed) return

      const call = await apiCall('/api/properties/properties', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      })

      if (!call.ok) {
        flash('Error al eliminar', 'error')
        return
      }

      flash('Propiedad eliminada', 'success')
      setReloadToken((t) => t + 1)
    },
    [confirmDialog],
  )

  const columns = React.useMemo<ColumnDef<PropertyRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Título',
        cell: ({ row }) => (
          <Link href={`/backend/properties/${row.original.id}`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'property_type',
        header: 'Tipo',
        cell: ({ row }) => TYPE_LABELS[row.original.property_type] ?? row.original.property_type,
      },
      {
        accessorKey: 'operation',
        header: 'Operación',
        cell: ({ row }) => OP_LABELS[row.original.operation] ?? row.original.operation,
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={STATUS_COLORS[row.original.status] as any ?? 'secondary'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Precio',
        cell: ({ row }) => `${row.original.currency} ${Number(row.original.price).toLocaleString('es-VE')}`,
      },
      {
        accessorKey: 'city',
        header: 'Ciudad',
      },
      {
        accessorKey: 'bedrooms',
        header: 'Hab.',
        cell: ({ row }) => row.original.bedrooms ?? '—',
      },
      {
        accessorKey: 'area_m2',
        header: 'Área',
        cell: ({ row }) => row.original.area_m2 ? `${row.original.area_m2} m²` : '—',
      },
    ],
    [],
  )

  const filterDefs = React.useMemo<FilterDef[]>(
    () => [
      {
        id: 'property_type',
        title: 'Tipo',
        type: 'select',
        options: [
          { label: 'Todos', value: '' },
          { label: 'Apartamento', value: 'apartamento' },
          { label: 'Casa', value: 'casa' },
          { label: 'Terreno', value: 'terreno' },
          { label: 'Comercial', value: 'comercial' },
          { label: 'Oficina', value: 'oficina' },
          { label: 'Galpón', value: 'galpon' },
        ],
      },
      {
        id: 'operation',
        title: 'Operación',
        type: 'select',
        options: [
          { label: 'Todas', value: '' },
          { label: 'Venta', value: 'venta' },
          { label: 'Alquiler', value: 'alquiler' },
          { label: 'Venta/Alquiler', value: 'venta_alquiler' },
        ],
      },
      {
        id: 'status',
        title: 'Estado',
        type: 'select',
        options: [
          { label: 'Todos', value: '' },
          { label: 'Borrador', value: 'draft' },
          { label: 'Activa', value: 'active' },
          { label: 'Reservada', value: 'reserved' },
          { label: 'Vendida', value: 'sold' },
          { label: 'Alquilada', value: 'rented' },
          { label: 'Inactiva', value: 'inactive' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <DataTable
          title="Propiedades"
          columns={columns}
          data={rows}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1) }}
          searchPlaceholder="Buscar por título, ciudad..."
          filters={filterDefs}
          filterValues={filters}
          onFiltersApply={(values) => { setFilters(values); setPage(1) }}
          onFiltersClear={() => { setFilters({}); setPage(1) }}
          actions={
            <Button asChild>
              <Link href="/backend/properties/create">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Link>
            </Button>
          }
          rowActions={(row) => (
            <RowActions
              items={[
                { id: 'edit', label: 'Editar', href: `/backend/properties/${row.id}` },
                { id: 'delete', label: 'Eliminar', destructive: true, onSelect: () => handleDelete(row) },
              ]}
            />
          )}
          pagination={{ page, pageSize: 50, total, totalPages, onPageChange: setPage }}
          isLoading={isLoading}
        />
      </PageBody>
      {ConfirmDialogElement}
    </Page>
  )
}
