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
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useConfirmDialog } from '@open-mercato/ui/backend/confirm-dialog'
import type { FilterDef, FilterValues } from '@open-mercato/ui/backend/FilterBar'

type TransactionRow = {
  id: string
  property_id: string
  transaction_type: string
  status: string
  sale_price: string
  currency: string
  commission_rate: string
  commission_amount: string | null
  closing_date: string | null
  created_at: string
}

type ResponsePayload = {
  items: TransactionRow[]
  total: number
  page: number
  totalPages: number
}

export default function TransactionsPage() {
  const { confirm: confirmDialog, ConfirmDialogElement } = useConfirmDialog()
  const [rows, setRows] = React.useState<TransactionRow[]>([])
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
        if (filters.transaction_type) params.set('transaction_type', String(filters.transaction_type))
        if (filters.status) params.set('status', String(filters.status))

        const fallback: ResponsePayload = { items: [], total: 0, page, totalPages: 1 }
        const call = await apiCall<ResponsePayload>(
          `/api/transactions/transactions?${params.toString()}`,
          undefined,
          { fallback },
        )

        if (call.ok) {
          const payload = call.result ?? fallback
          if (!cancelled) {
            setRows(Array.isArray(payload.items) ? payload.items : [])
            setTotal(payload.total || 0)
            setTotalPages(payload.totalPages || 1)
          }
        }
      } catch {
        if (!cancelled) flash('Error al cargar transacciones', 'error')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, search, filters, reloadToken, scopeVersion])

  const handleDelete = React.useCallback(
    async (row: TransactionRow) => {
      const confirmed = await confirmDialog({ title: '¿Eliminar esta transacción?', variant: 'destructive' })
      if (!confirmed) return
      const call = await apiCall('/api/transactions/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      })
      if (call.ok) {
        flash('Transacción eliminada', 'success')
        setReloadToken((t) => t + 1)
      } else {
        flash('Error al eliminar', 'error')
      }
    },
    [confirmDialog],
  )

  const columns = React.useMemo<ColumnDef<TransactionRow>[]>(
    () => [
      {
        accessorKey: 'transaction_type',
        header: 'Tipo',
        cell: ({ row }) => row.original.transaction_type === 'sale' ? 'Venta' : 'Alquiler',
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'completed' ? 'default' : row.original.status === 'cancelled' ? 'destructive' : 'secondary'}>
            {row.original.status === 'completed' ? 'Completada' : row.original.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
          </Badge>
        ),
      },
      {
        accessorKey: 'sale_price',
        header: 'Precio',
        cell: ({ row }) => `${row.original.currency} ${Number(row.original.sale_price).toLocaleString('es-VE')}`,
      },
      {
        accessorKey: 'commission_amount',
        header: 'Comisión',
        cell: ({ row }) => row.original.commission_amount
          ? `${row.original.currency} ${Number(row.original.commission_amount).toLocaleString('es-VE')}`
          : `${row.original.commission_rate}%`,
      },
      {
        accessorKey: 'closing_date',
        header: 'Fecha cierre',
        cell: ({ row }) => row.original.closing_date
          ? new Date(row.original.closing_date).toLocaleDateString('es-VE')
          : '—',
      },
      {
        accessorKey: 'created_at',
        header: 'Creada',
        cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
      },
    ],
    [],
  )

  const filterDefs = React.useMemo<FilterDef[]>(
    () => [
      {
        id: 'transaction_type', title: 'Tipo', type: 'select',
        options: [
          { label: 'Todos', value: '' },
          { label: 'Venta', value: 'sale' },
          { label: 'Alquiler', value: 'lease' },
        ],
      },
      {
        id: 'status', title: 'Estado', type: 'select',
        options: [
          { label: 'Todos', value: '' },
          { label: 'Pendiente', value: 'pending' },
          { label: 'Completada', value: 'completed' },
          { label: 'Cancelada', value: 'cancelled' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <DataTable
          title="Transacciones"
          columns={columns}
          data={rows}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); setPage(1) }}
          searchPlaceholder="Buscar..."
          filters={filterDefs}
          filterValues={filters}
          onFiltersApply={(values) => { setFilters(values); setPage(1) }}
          onFiltersClear={() => { setFilters({}); setPage(1) }}
          actions={
            <Button asChild>
              <Link href="/backend/transactions/create">
                <Plus className="mr-2 h-4 w-4" />
                Registrar Cierre
              </Link>
            </Button>
          }
          rowActions={(row) => (
            <RowActions
              items={[
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
