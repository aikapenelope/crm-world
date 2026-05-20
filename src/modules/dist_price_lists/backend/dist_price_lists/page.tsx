'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type PriceListRow = {
  id: string
  name: string
  code: string
  type: string
  currency: string
  is_default: boolean
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
}

const TYPE_LABELS: Record<string, string> = {
  standard: 'Estándar',
  promotional: 'Promocional',
  volume: 'Por Volumen',
}

export default function DistPriceListsPage() {
  const router = useRouter()
  const [lists, setLists] = React.useState<PriceListRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PriceListRow[] }>(
        '/api/dist-price-lists/lists?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setLists(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<PriceListRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_default && (
            <Badge variant="default" className="ml-2">Por defecto</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type,
    },
    {
      accessorKey: 'currency',
      header: 'Moneda',
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      id: 'validity',
      header: 'Vigencia',
      cell: ({ row }) => {
        if (!row.original.valid_from && !row.original.valid_until) return 'Permanente'
        const from = row.original.valid_from ? new Date(row.original.valid_from).toLocaleDateString('es-VE') : '—'
        const until = row.original.valid_until ? new Date(row.original.valid_until).toLocaleDateString('es-VE') : '—'
        return `${from} → ${until}`
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Listas de Precios</h1>
          <Button type="button" onClick={() => router.push('/backend/dist_price_lists/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Lista
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={lists}
          isLoading={isLoading}
          searchPlaceholder="Buscar lista..."
        />
      </PageBody>
    </Page>
  )
}
