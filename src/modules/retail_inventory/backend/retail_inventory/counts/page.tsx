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

type CountRow = {
  id: string
  count_number: string
  branch_id: string
  status: string
  count_type: string
  planned_date: string
  completed_at: string | null
}

const statusLabels: Record<string, string> = {
  planned: 'Planificado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  planned: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
}

const typeLabels: Record<string, string> = {
  full: 'Completo',
  partial: 'Parcial',
  spot_check: 'Verificación',
}

export default function CountsPage() {
  const router = useRouter()
  const [counts, setCounts] = React.useState<CountRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CountRow[] }>(
        '/api/retail-inventory/counts?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setCounts(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<CountRow>[] = [
    {
      accessorKey: 'count_number',
      header: 'Número',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.count_number}</span>,
    },
    {
      accessorKey: 'count_type',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{typeLabels[row.original.count_type] ?? row.original.count_type}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'outline'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'planned_date',
      header: 'Fecha Planificada',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.planned_date).toLocaleDateString('es-VE')}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Conteos Cíclicos</h1>
            <p className="text-sm text-muted-foreground">Planifica y ejecuta conteos de inventario físico</p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_inventory/counts/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo Conteo
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={counts}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_inventory/counts/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
